import { describe, it, expect, beforeEach } from 'vitest';
import { clearContentCache, readContent, saveContent, ValidationError } from '../src/lib/content';
import type { CommitInput, Repo } from '../src/lib/github';

const theme = '{\n  "background": "#0C0C0C",\n  "text": "#F2EFEA",\n  "accent": "#B7966B"\n}\n';

function memoryRepo(files: Record<string, string>) {
  const commits: CommitInput[] = [];
  let reads = 0;
  const repo: Repo = {
    async readText(path) {
      reads++;
      if (!(path in files)) throw new Error(`lipsa ${path}`);
      return files[path];
    },
    async readBytes() {
      return Buffer.alloc(0);
    },
    async commit(input) {
      commits.push(input);
      return 'a'.repeat(40);
    },
    async runState() {
      return 'success';
    },
  };
  return { repo, commits, reads: () => reads };
}

beforeEach(clearContentCache);

describe('readContent', () => {
  it('parses the file once and serves the next read from cache', async () => {
    const m = memoryRepo({ 'src/content/theme.json': theme });
    expect((await readContent(m.repo, 'theme')).accent).toBe('#B7966B');
    await readContent(m.repo, 'theme');
    expect(m.reads()).toBe(1);
  });
});

describe('saveContent', () => {
  it('commits the normalized JSON together with extra files and deletions', async () => {
    const m = memoryRepo({});
    const sha = await saveContent(m.repo, 'theme', { background: '#ffffff', text: '#111111', accent: '#86643a' }, {
      message: 'Culori',
      author: { name: 'Atelier', email: 'atelier@loxmobila.ro' },
      files: [{ path: 'x.jpg', content: new Uint8Array([1]) }],
      deletes: ['y.jpg'],
    });
    expect(sha).toHaveLength(40);
    const [c] = m.commits;
    expect(c.message).toBe('Culori');
    expect(c.files[0]).toEqual({
      path: 'src/content/theme.json',
      content: '{\n  "background": "#FFFFFF",\n  "text": "#111111",\n  "accent": "#86643A"\n}\n',
    });
    expect(c.files[1].path).toBe('x.jpg');
    expect(c.deletes).toEqual(['y.jpg']);
    expect((await readContent(m.repo, 'theme')).background).toBe('#FFFFFF');
  });

  it('refuses invalid data with field issues and does not commit', async () => {
    const m = memoryRepo({});
    const err = await saveContent(m.repo, 'theme', { background: 'alb', text: '#111111', accent: '#86643A' }, {
      message: 'Culori',
      author: { name: 'a', email: 'a@a.ro' },
    }).catch((e) => e);
    expect(err).toBeInstanceOf(ValidationError);
    expect((err as ValidationError).issues[0].path).toBe('background');
    expect(m.commits).toHaveLength(0);
  });
});
