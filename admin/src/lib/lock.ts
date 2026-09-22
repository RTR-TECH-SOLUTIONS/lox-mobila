let tail: Promise<unknown> = Promise.resolve();

/**
 * Salvarile adminului trec pe rand: citire, construire, commit. Altfel doua salvari simultane
 * pot construi fiecare pe aceeasi lista veche, iar a doua sterge poze pe care prima le foloseste.
 * Un singur proces de admin, deci ajunge o coada in memorie.
 */
export function withWriteLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = tail.then(() => fn());
  // O salvare esuata nu blocheaza coada.
  tail = run.catch(() => undefined);
  return run;
}
