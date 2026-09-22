export interface FileChange {
  path: string;
  /** Text (se scrie in UTF-8) sau bytes (poze). */
  content: string | Uint8Array;
}

export interface CommitInput {
  message: string;
  author: { name: string; email: string };
  files: FileChange[];
  deletes: string[];
}

export type RunState = 'pending' | 'success' | 'failure';

/** Ce stie adminul sa faca cu depozitul: GitHub in productie, un clone local in teste. */
export interface Repo {
  readText(path: string): Promise<string>;
  readBytes(path: string): Promise<Buffer>;
  commit(input: CommitInput): Promise<string>;
  runState(sha: string): Promise<RunState>;
}

export class GitHubError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

/** Doar PATCH-ul de ref intoarce 422 pentru ca ramura s-a miscat; restul 422-urilor sunt erori de continut. */
export class BranchMovedError extends GitHubError {
  constructor() {
    super('Ramura s-a mutat intre timp', 422);
  }
}

interface Options {
  token: string;
  repo: { owner: string; name: string };
  branch: string;
  fetch?: typeof fetch;
}

const encodePath = (path: string) => path.split('/').map(encodeURIComponent).join('/');

export function createGitHub(opts: Options): Repo {
  const f = opts.fetch ?? fetch;
  const base = `https://api.github.com/repos/${opts.repo.owner}/${opts.repo.name}`;
  const headers = (accept = 'application/vnd.github+json'): Record<string, string> => ({
    Authorization: `Bearer ${opts.token}`,
    Accept: accept,
    'X-GitHub-Api-Version': '2022-11-28',
  });

  async function request(path: string, init: RequestInit = {}, accept?: string): Promise<Response> {
    const res = await f(`${base}${path}`, {
      ...init,
      headers: { ...headers(accept), ...(init.body ? { 'Content-Type': 'application/json' } : {}) },
    });
    if (!res.ok) throw new GitHubError(`GitHub ${init.method ?? 'GET'} ${path}: ${res.status}`, res.status);
    return res;
  }

  const api = async <T>(path: string, init?: RequestInit): Promise<T> => (await request(path, init)).json() as Promise<T>;
  const post = <T>(path: string, body: unknown, method = 'POST') => api<T>(path, { method, body: JSON.stringify(body) });
  const raw = (path: string) =>
    request(`/contents/${encodePath(path)}?ref=${encodeURIComponent(opts.branch)}`, {}, 'application/vnd.github.raw+json');

  async function commitOnce(input: CommitInput): Promise<string> {
    const ref = await api<{ object: { sha: string } }>(`/git/ref/heads/${opts.branch}`);
    const parent = ref.object.sha;
    const current = await api<{ tree: { sha: string } }>(`/git/commits/${parent}`);

    const tree: { path: string; mode: '100644'; type: 'blob'; sha: string | null }[] = [];
    for (const file of input.files) {
      const blob = await post<{ sha: string }>(
        '/git/blobs',
        typeof file.content === 'string'
          ? { content: file.content, encoding: 'utf-8' }
          : { content: Buffer.from(file.content).toString('base64'), encoding: 'base64' },
      );
      tree.push({ path: file.path, mode: '100644', type: 'blob', sha: blob.sha });
    }
    for (const path of input.deletes) tree.push({ path, mode: '100644', type: 'blob', sha: null });

    const newTree = await post<{ sha: string }>('/git/trees', { base_tree: current.tree.sha, tree });
    const commit = await post<{ sha: string }>('/git/commits', {
      message: input.message,
      tree: newTree.sha,
      parents: [parent],
      author: { ...input.author, date: new Date().toISOString() },
    });
    try {
      await post(`/git/refs/heads/${opts.branch}`, { sha: commit.sha, force: false }, 'PATCH');
    } catch (e) {
      if (e instanceof GitHubError && e.status === 422) throw new BranchMovedError();
      throw e;
    }
    return commit.sha;
  }

  return {
    async readText(path) {
      return (await raw(path)).text();
    },
    async readBytes(path) {
      return Buffer.from(await (await raw(path)).arrayBuffer());
    },
    /**
     * Un singur commit pentru toata salvarea; daca ramura s-a miscat intre timp, il reface o data peste noul varf.
     * Refacerea trimite aceleasi fisiere, construite pe continutul citit inainte. Merge doar pentru ca
     * withWriteLock pune salvarile adminului la rand; ramura se poate misca atunci doar din afara (un push).
     */
    async commit(input) {
      try {
        return await commitOnce(input);
      } catch (e) {
        if (e instanceof BranchMovedError) return commitOnce(input);
        throw e;
      }
    },
    async runState(sha) {
      const data = await api<{ workflow_runs: { path?: string; status: string; conclusion: string | null }[] }>(
        `/actions/runs?head_sha=${sha}&per_page=5`,
      );
      const runs = data.workflow_runs;
      const run = runs.find((r) => r.path?.endsWith('.github/workflows/deploy.yml')) ?? runs[0];
      if (!run || run.status !== 'completed') return 'pending';
      if (run.conclusion === 'success') return 'success';
      // O rulare anulata sau sarita e inlocuita de una mai noua, care publica si schimbarea asta.
      if (run.conclusion === 'cancelled' || run.conclusion === 'skipped') return 'pending';
      return 'failure';
    },
  };
}
