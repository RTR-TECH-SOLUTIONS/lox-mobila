import { describe, it, expect } from 'vitest';
import { withWriteLock } from '../src/lib/lock';

const tick = () => new Promise((r) => setTimeout(r, 5));

describe('withWriteLock', () => {
  it('runs two overlapping saves one after the other', async () => {
    const log: string[] = [];
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));

    const first = withWriteLock(async () => {
      log.push('prima incepe');
      await gate;
      log.push('prima termina');
      return 1;
    });
    const second = withWriteLock(async () => {
      log.push('a doua incepe');
      return 2;
    });

    await tick();
    expect(log).toEqual(['prima incepe']);
    release();
    expect(await Promise.all([first, second])).toEqual([1, 2]);
    expect(log).toEqual(['prima incepe', 'prima termina', 'a doua incepe']);
  });

  it('lets the next save run after one fails', async () => {
    const failed = withWriteLock(async () => {
      throw new Error('commit esuat');
    });
    const next = withWriteLock(async () => 'ok');
    await expect(failed).rejects.toThrow('commit esuat');
    expect(await next).toBe('ok');
  });
});
