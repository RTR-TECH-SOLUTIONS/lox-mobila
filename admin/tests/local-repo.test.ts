import { describe, it, expect, beforeEach } from 'vitest';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createLocalRepo } from '../src/lib/local-repo';

let dir: string;
const git = (...args: string[]) => execFileSync('git', args, { cwd: dir, encoding: 'utf8' }).trim();

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'lox-repo-'));
  git('init', '-q', '-b', 'main');
  mkdirSync(join(dir, 'src/content'), { recursive: true });
  writeFileSync(join(dir, 'src/content/a.json'), '{}\n');
  writeFileSync(join(dir, 'vechi.jpg'), 'x');
  git('add', '-A');
  git('-c', 'user.name=t', '-c', 'user.email=t@t.ro', 'commit', '-qm', 'init');
});

describe('createLocalRepo', () => {
  it('writes text and bytes, deletes files and commits once with the author', async () => {
    const repo = createLocalRepo(dir);
    const sha = await repo.commit({
      message: 'Culori',
      author: { name: 'Atelier', email: 'atelier@loxmobila.ro' },
      files: [
        { path: 'src/content/a.json', content: '{"b":2}\n' },
        { path: 'src/assets/p/01.jpg', content: new Uint8Array([7, 8]) },
      ],
      deletes: ['vechi.jpg'],
    });
    expect(sha).toBe(git('rev-parse', 'HEAD'));
    expect(git('log', '-1', '--format=%s|%an|%ae')).toBe('Culori|Atelier|atelier@loxmobila.ro');
    expect(readFileSync(join(dir, 'src/content/a.json'), 'utf8')).toBe('{"b":2}\n');
    expect([...readFileSync(join(dir, 'src/assets/p/01.jpg'))]).toEqual([7, 8]);
    expect(existsSync(join(dir, 'vechi.jpg'))).toBe(false);
    expect(await repo.readText('src/content/a.json')).toBe('{"b":2}\n');
  });

  it('refuses paths outside the repository', async () => {
    const repo = createLocalRepo(dir);
    await expect(repo.readText('../x')).rejects.toThrow('afara');
    await expect(repo.commit({ message: 'x', author: { name: 'a', email: 'a@a.ro' }, files: [{ path: '../x', content: 'a' }], deletes: [] })).rejects.toThrow('afara');
  });

  it('reports success three seconds after the commit', async () => {
    let t = 0;
    const repo = createLocalRepo(dir, () => t);
    const sha = await repo.commit({ message: 'x', author: { name: 'a', email: 'a@a.ro' }, files: [{ path: 'b.txt', content: 'b' }], deletes: [] });
    expect(await repo.runState(sha)).toBe('pending');
    t = 3000;
    expect(await repo.runState(sha)).toBe('success');
  });
});
