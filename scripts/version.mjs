// Scrie dist/version.json cu commit-ul din care s-a construit site-ul.
// Adminul intreaba fisierul asta ca sa stie daca publicarea a ajuns pe server.
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const fromGit = () => {
  try {
    return execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
};

// SOURCE_COMMIT vine de la Coolify, GITHUB_SHA din Actions; local se citeste din git.
const sha = process.env.SOURCE_COMMIT || process.env.GITHUB_SHA || fromGit();
writeFileSync('dist/version.json', `${JSON.stringify({ sha, builtAt: new Date().toISOString() })}\n`);
console.log(`version.json: ${sha || '(fara commit)'}`);
