import { env } from './env';
import { createGitHub, type Repo } from './github';
import { createLocalRepo } from './local-repo';

let instance: Repo | undefined;

/** Depozitul folosit de admin: clone-ul local din LOCAL_REPO_DIR (teste) sau GitHub. */
export function repo(): Repo {
  if (!instance) {
    const e = env();
    instance = e.localRepoDir
      ? createLocalRepo(e.localRepoDir)
      : createGitHub({ token: e.githubToken, repo: e.repo, branch: e.branch });
  }
  return instance;
}

/** Autorul commit-ului e omul logat, ca istoricul sa arate cine a schimbat ce. */
export function author(user: { name: string; email: string }): { name: string; email: string } {
  return { name: user.name, email: user.email };
}
