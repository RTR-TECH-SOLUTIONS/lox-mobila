import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve, sep } from 'node:path';
import type { CommitInput, Repo, RunState } from './github';

/**
 * Mod de test: acelasi contract ca GitHub, dar pe un clone local, cu git. Nu atinge GitHub.
 * Publicarea se considera reusita la 3 secunde dupa commit.
 */
export function createLocalRepo(dir: string, now: () => number = Date.now): Repo {
  const root = resolve(dir);
  const inside = (path: string) => {
    const full = resolve(root, path);
    if (!full.startsWith(root + sep)) throw new Error(`Cale in afara repo-ului: ${path}`);
    return full;
  };
  const committedAt = new Map<string, number>();

  return {
    async readText(path) {
      return readFileSync(inside(path), 'utf8');
    },
    async readBytes(path) {
      return readFileSync(inside(path));
    },
    async commit(input: CommitInput) {
      const files = input.files.map((f) => ({ full: inside(f.path), content: f.content }));
      const deletes = input.deletes.map(inside);
      for (const f of files) {
        mkdirSync(dirname(f.full), { recursive: true });
        writeFileSync(f.full, f.content);
      }
      for (const full of deletes) rmSync(full, { force: true });
      execFileSync('git', ['add', '-A'], { cwd: root });
      execFileSync(
        'git',
        ['-c', `user.name=${input.author.name}`, '-c', `user.email=${input.author.email}`, 'commit', '-q', '-m', input.message],
        { cwd: root },
      );
      const sha = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
      committedAt.set(sha, now());
      return sha;
    },
    async runState(sha): Promise<RunState> {
      const at = committedAt.get(sha);
      return at !== undefined && now() - at >= 3000 ? 'success' : 'pending';
    },
  };
}
