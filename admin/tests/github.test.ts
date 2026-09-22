import { describe, it, expect } from 'vitest';
import { createGitHub, GitHubError } from '../src/lib/github';

type Reply = { status?: number; json?: unknown; text?: string };
type Route = (body: any, n: number) => Reply;

function fakeFetch(routes: Record<string, Route>) {
  const calls: { key: string; url: string; body?: any; headers: Record<string, string> }[] = [];
  const counts = new Map<string, number>();
  const fn = (async (input: string | URL, init: RequestInit = {}) => {
    const url = String(input).replace('https://api.github.com/repos/o/r', '');
    const key = `${init.method ?? 'GET'} ${url.split('?')[0]}`;
    const body = init.body ? JSON.parse(String(init.body)) : undefined;
    calls.push({ key, url, body, headers: init.headers as Record<string, string> });
    const n = (counts.get(key) ?? 0) + 1;
    counts.set(key, n);
    const route = routes[key];
    if (!route) return new Response('lipsa', { status: 404 });
    const r = route(body, n);
    return new Response(r.text ?? JSON.stringify(r.json ?? {}), { status: r.status ?? 200 });
  }) as typeof fetch;
  return { fn, calls };
}

const repoOpts = { token: 'tok', repo: { owner: 'o', name: 'r' }, branch: 'main' };

const commitRoutes = (patch: Route): Record<string, Route> => ({
  'GET /git/ref/heads/main': (_b, n) => ({ json: { object: { sha: `base${n}` } } }),
  'GET /git/commits/base1': () => ({ json: { tree: { sha: 'tree1' } } }),
  'GET /git/commits/base2': () => ({ json: { tree: { sha: 'tree2' } } }),
  'POST /git/blobs': (_b, n) => ({ status: 201, json: { sha: `blob${n}` } }),
  'POST /git/trees': (_b, n) => ({ status: 201, json: { sha: `newtree${n}` } }),
  'POST /git/commits': (_b, n) => ({ status: 201, json: { sha: `commit${n}` } }),
  'PATCH /git/refs/heads/main': patch,
});

const input = {
  message: 'Contact și program',
  author: { name: 'Atelier', email: 'atelier@loxmobila.ro' },
  files: [
    { path: 'src/content/contact.json', content: '{"a":1}\n' },
    { path: 'src/assets/images/projects/p/ab12cd34.jpg', content: new Uint8Array([1, 2, 3]) },
  ],
  deletes: ['src/assets/images/projects/p/vechi.jpg'],
};

describe('createGitHub.commit', () => {
  it('makes one commit with text blobs, byte blobs and deletions', async () => {
    const { fn, calls } = fakeFetch(commitRoutes(() => ({ json: {} })));
    const sha = await createGitHub({ ...repoOpts, fetch: fn }).commit(input);
    expect(sha).toBe('commit1');

    const blobs = calls.filter((c) => c.key === 'POST /git/blobs').map((c) => c.body);
    expect(blobs).toEqual([
      { content: '{"a":1}\n', encoding: 'utf-8' },
      { content: Buffer.from([1, 2, 3]).toString('base64'), encoding: 'base64' },
    ]);
    const tree = calls.find((c) => c.key === 'POST /git/trees')!.body;
    expect(tree.base_tree).toBe('tree1');
    expect(tree.tree).toContainEqual({ path: 'src/assets/images/projects/p/vechi.jpg', mode: '100644', type: 'blob', sha: null });
    const commit = calls.find((c) => c.key === 'POST /git/commits')!.body;
    expect(commit.parents).toEqual(['base1']);
    expect(commit.author.name).toBe('Atelier');
    expect(calls.find((c) => c.key === 'PATCH /git/refs/heads/main')!.body).toEqual({ sha: 'commit1', force: false });
    expect(calls[0].headers.Authorization).toBe('Bearer tok');
  });

  it('rebuilds the commit on top of the new tip when the branch moved', async () => {
    const { fn, calls } = fakeFetch(commitRoutes((_b, n) => (n === 1 ? { status: 422, json: { message: 'not a fast forward' } } : { json: {} })));
    const sha = await createGitHub({ ...repoOpts, fetch: fn }).commit(input);
    expect(sha).toBe('commit2');
    expect(calls.filter((c) => c.key === 'POST /git/commits')[1].body.parents).toEqual(['base2']);
  });

  it('does not retry other errors', async () => {
    const routes = commitRoutes(() => ({ json: {} }));
    routes['POST /git/blobs'] = () => ({ status: 500, text: 'eroare' });
    const { fn, calls } = fakeFetch(routes);
    await expect(createGitHub({ ...repoOpts, fetch: fn }).commit(input)).rejects.toBeInstanceOf(GitHubError);
    expect(calls.filter((c) => c.key === 'GET /git/ref/heads/main')).toHaveLength(1);
  });

  it('does not retry a 422 from tree creation, since the branch has not moved', async () => {
    const routes = commitRoutes(() => ({ json: {} }));
    routes['POST /git/trees'] = () => ({ status: 422, json: { message: 'bad tree' } });
    const { fn, calls } = fakeFetch(routes);
    await expect(createGitHub({ ...repoOpts, fetch: fn }).commit(input)).rejects.toBeInstanceOf(GitHubError);
    expect(calls.filter((c) => c.key === 'GET /git/ref/heads/main')).toHaveLength(1);
  });
});

describe('createGitHub reads and status', () => {
  it('reads a raw file from the branch', async () => {
    const { fn, calls } = fakeFetch({ 'GET /contents/src/content/contact.json': () => ({ text: '{"ok":true}' }) });
    expect(await createGitHub({ ...repoOpts, fetch: fn }).readText('src/content/contact.json')).toBe('{"ok":true}');
    expect(calls[0].url).toBe('/contents/src/content/contact.json?ref=main');
    expect(calls[0].headers.Accept).toBe('application/vnd.github.raw+json');
  });

  const DEPLOY = '.github/workflows/deploy.yml';
  const stateOf = async (runs: unknown[]) => {
    const { fn } = fakeFetch({ 'GET /actions/runs': () => ({ json: { workflow_runs: runs } }) });
    return createGitHub({ ...repoOpts, fetch: fn }).runState('a'.repeat(40));
  };

  it('maps workflow runs to a publish state', async () => {
    const states: unknown[][] = [
      [],
      [{ path: DEPLOY, status: 'in_progress', conclusion: null }],
      [{ path: DEPLOY, status: 'completed', conclusion: 'success' }],
      [{ path: DEPLOY, status: 'completed', conclusion: 'failure' }],
    ];
    const results = [];
    for (const runs of states) results.push(await stateOf(runs));
    expect(results).toEqual(['pending', 'pending', 'success', 'failure']);
  });

  it('follows the deploy workflow, not another run on the same commit', async () => {
    const other = { path: 'dynamic/pages/pages-build-deployment', status: 'completed', conclusion: 'failure' };
    expect(await stateOf([other, { path: DEPLOY, status: 'completed', conclusion: 'success' }])).toBe('success');
    expect(await stateOf([{ ...other, conclusion: 'success' }, { path: DEPLOY, status: 'queued', conclusion: null }])).toBe('pending');
  });

  it('falls back to the first run when none is the deploy workflow', async () => {
    expect(await stateOf([{ path: 'x.yml', status: 'completed', conclusion: 'success' }])).toBe('success');
  });

  it('keeps waiting when the run was cancelled or skipped, since a newer run publishes the change', async () => {
    expect(await stateOf([{ path: DEPLOY, status: 'completed', conclusion: 'cancelled' }])).toBe('pending');
    expect(await stateOf([{ path: DEPLOY, status: 'completed', conclusion: 'skipped' }])).toBe('pending');
  });
});
