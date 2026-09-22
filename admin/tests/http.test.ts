import { describe, it, expect } from 'vitest';
import { errorResponse } from '../src/lib/http';
import { ValidationError } from '../src/lib/content';

describe('errorResponse', () => {
  it('uses the generic message when a field issue is present', async () => {
    const res = errorResponse(new ValidationError([{ path: 'title', message: 'Câmpul e obligatoriu.' }]));
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.error).toBe('Verifică câmpurile marcate.');
    expect(body.issues).toEqual([{ path: 'title', message: 'Câmpul e obligatoriu.' }]);
  });

  it('uses the issue messages when every issue has no field', async () => {
    const res = errorResponse(new ValidationError([{ path: '', message: 'Proiectul nu mai există.' }]));
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.error).toBe('Proiectul nu mai există.');
  });
});
