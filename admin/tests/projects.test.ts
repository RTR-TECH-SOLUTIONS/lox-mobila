import { describe, it, expect, vi } from 'vitest';
import type { Project } from '@site/content/schema';
import { buildProjectSave, deleteProject, reorderProjects } from '../src/lib/projects';
import { ValidationError } from '../src/lib/content';

const make = (slug: string, photos = [`${slug}/01.jpg`]): Project => ({
  slug,
  title: slug,
  category: 'bucatarii',
  weeks: 3,
  featured: false,
  specs: [{ label: 'Fronturi', value: 'MDF' }],
  photos,
});

const fields = { title: 'Bucătărie în L', category: 'bucatarii', weeks: 5, featured: true, description: '', specs: [{ label: 'Blat', value: 'Quartz' }] };

function deps() {
  let n = 0;
  return { prepare: vi.fn(async (b: Buffer) => Buffer.concat([b, Buffer.from('!')])), newId: () => `id${String(++n).padStart(6, '0')}` };
}

describe('buildProjectSave', () => {
  it('creates a new project first in the list, with processed photos in its folder', async () => {
    const d = deps();
    const list = [make('dulap')];
    const r = await buildProjectSave({ list, draft: { ...fields, photos: ['new:a', 'new:b'] }, uploads: new Map([['a', Buffer.from('A')], ['b', Buffer.from('B')]]), ...d });
    expect(r.slug).toBe('bucatarie-in-l');
    expect(r.message).toBe('Proiect nou: Bucătărie în L');
    expect(r.list.map((p) => p.slug)).toEqual(['bucatarie-in-l', 'dulap']);
    expect(r.list[0].photos).toEqual(['bucatarie-in-l/id000001.jpg', 'bucatarie-in-l/id000002.jpg']);
    expect(r.files.map((f) => f.path)).toEqual([
      'src/assets/images/projects/bucatarie-in-l/id000001.jpg',
      'src/assets/images/projects/bucatarie-in-l/id000002.jpg',
    ]);
    expect(Buffer.from(r.files[0].content as Uint8Array).toString()).toBe('A!');
    expect(r.list[0].description).toBeUndefined();
    expect(r.deletes).toEqual([]);
  });

  it('gives a new project a free address when the title is taken', async () => {
    const r = await buildProjectSave({ list: [make('bucatarie-in-l')], draft: { ...fields, photos: ['new:a'] }, uploads: new Map([['a', Buffer.from('A')]]), ...deps() });
    expect(r.slug).toBe('bucatarie-in-l-2');
  });

  it('edits in place: keeps the address, reorders, adds and deletes photos', async () => {
    const list = [make('dulap'), make('bucatarie-in-l', ['bucatarie-in-l/01.jpg', 'bucatarie-in-l/02.jpg'])];
    const r = await buildProjectSave({
      list,
      draft: { ...fields, slug: 'bucatarie-in-l', title: 'Titlu nou', photos: ['new:x', 'keep:bucatarie-in-l/02.jpg'] },
      uploads: new Map([['x', Buffer.from('X')]]),
      ...deps(),
    });
    expect(r.slug).toBe('bucatarie-in-l');
    expect(r.message).toBe('Proiect modificat: Titlu nou');
    expect(r.list.map((p) => p.slug)).toEqual(['dulap', 'bucatarie-in-l']);
    expect(r.list[1].photos).toEqual(['bucatarie-in-l/id000001.jpg', 'bucatarie-in-l/02.jpg']);
    expect(r.deletes).toEqual(['src/assets/images/projects/bucatarie-in-l/01.jpg']);
  });

  it('refuses a photo that belongs to another project', async () => {
    const list = [make('dulap'), make('bucatarie-in-l')];
    const err = await buildProjectSave({ list, draft: { ...fields, slug: 'bucatarie-in-l', photos: ['keep:dulap/01.jpg'] }, uploads: new Map(), ...deps() }).catch((e) => e);
    expect(err).toBeInstanceOf(ValidationError);
  });

  it('checks the fields before touching any photo', async () => {
    const d = deps();
    const err = await buildProjectSave({ list: [], draft: { ...fields, title: '', photos: ['new:a'] }, uploads: new Map([['a', Buffer.from('A')]]), ...d }).catch((e) => e);
    expect((err as ValidationError).issues[0].path).toBe('title');
    expect(d.prepare).not.toHaveBeenCalled();
  });

  it('needs at least one photo', async () => {
    const err = await buildProjectSave({ list: [], draft: { ...fields, photos: [] }, uploads: new Map(), ...deps() }).catch((e) => e);
    expect((err as ValidationError).issues).toEqual([{ path: 'photos', message: 'Proiectul are nevoie de cel puțin o poză.' }]);
  });
});

describe('deleteProject and reorderProjects', () => {
  it('deletes a project with all its photos', () => {
    const r = deleteProject([make('a'), make('b', ['b/01.jpg', 'b/02.jpg'])], 'b');
    expect(r.list.map((p) => p.slug)).toEqual(['a']);
    expect(r.deletes).toEqual(['src/assets/images/projects/b/01.jpg', 'src/assets/images/projects/b/02.jpg']);
    expect(r.message).toBe('Proiect șters: b');
  });

  it('applies a new order and the home page ticks', () => {
    const r = reorderProjects([make('a'), make('b'), make('c')], ['c', 'a', 'b'], { a: true });
    expect(r.map((p) => `${p.slug}:${p.featured}`)).toEqual(['c:false', 'a:true', 'b:false']);
  });

  it('refuses an order that does not match the current list', () => {
    expect(() => reorderProjects([make('a'), make('b')], ['a'], {})).toThrow(ValidationError);
    expect(() => reorderProjects([make('a'), make('b')], ['a', 'a'], {})).toThrow(ValidationError);
  });
});
