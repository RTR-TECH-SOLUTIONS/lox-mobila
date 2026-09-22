import { IMAGE_DIRS, parseContent, projectFieldsSchema, projectSchema, type Project } from '@site/content/schema';
import { check, ValidationError } from './content';
import type { FileChange } from './github';
import { uniqueSlug } from './slug';

/** Ce trimite formularul de proiect. `photos` sunt jetoane: „keep:<cale>” sau „new:<cheie upload>”. */
export interface ProjectDraft {
  slug?: string;
  title?: unknown;
  category?: unknown;
  weeks?: unknown;
  featured?: unknown;
  description?: unknown;
  specs?: unknown;
  photos?: unknown;
}

const photoFile = (path: string) => `${IMAGE_DIRS.projects}/${path}`;

export async function buildProjectSave(input: {
  list: Project[];
  draft: ProjectDraft;
  uploads: Map<string, Buffer>;
  prepare: (b: Buffer) => Promise<Buffer>;
  newId: () => string;
}): Promise<{ list: Project[]; files: FileChange[]; deletes: string[]; slug: string; message: string }> {
  const { list, draft, uploads } = input;
  const existing = draft.slug ? list.find((p) => p.slug === draft.slug) : undefined;
  if (draft.slug && !existing) {
    throw new ValidationError([{ path: '', message: 'Proiectul nu mai există. Poate a fost șters între timp.' }]);
  }

  // Campurile si pozele se verifica impreuna, ca utilizatorul sa vada toate erorile deodata.
  const fieldsResult = parseContent(projectFieldsSchema, {
    title: draft.title,
    category: draft.category,
    weeks: draft.weeks,
    featured: draft.featured === true,
    description: draft.description,
    specs: draft.specs,
  });
  const tokens = Array.isArray(draft.photos) ? draft.photos.map(String) : [];
  const noPhotos = tokens.length === 0;
  if (!fieldsResult.ok || noPhotos) {
    throw new ValidationError([
      ...(fieldsResult.ok ? [] : fieldsResult.issues),
      ...(noPhotos ? [{ path: 'photos', message: 'Proiectul are nevoie de cel puțin o poză.' }] : []),
    ]);
  }
  const fields = fieldsResult.data;

  const slug = existing?.slug ?? uniqueSlug(fields.title, list.map((p) => p.slug));
  const files: FileChange[] = [];
  const photos: string[] = [];
  for (const token of tokens) {
    if (token.startsWith('keep:')) {
      const path = token.slice(5);
      if (!existing?.photos.includes(path)) {
        throw new ValidationError([{ path: 'photos', message: 'O poză nu mai există. Reîncarcă pagina.' }]);
      }
      photos.push(path);
    } else if (token.startsWith('new:')) {
      const upload = uploads.get(token.slice(4));
      if (!upload) throw new ValidationError([{ path: 'photos', message: 'O poză nu s-a urcat. Încearcă din nou.' }]);
      let path: string;
      do path = `${slug}/${input.newId()}.jpg`;
      while (photos.includes(path) || existing?.photos.includes(path));
      files.push({ path: photoFile(path), content: await input.prepare(upload) });
      photos.push(path);
    }
  }

  const project = check(parseContent(projectSchema, { ...fields, slug, photos }));
  const deletes = (existing?.photos ?? []).filter((p) => !photos.includes(p)).map(photoFile);
  const next = existing ? list.map((p) => (p.slug === slug ? project : p)) : [project, ...list];
  return {
    list: next,
    files,
    deletes,
    slug,
    message: existing ? `Proiect modificat: ${project.title}` : `Proiect nou: ${project.title}`,
  };
}

export function deleteProject(list: Project[], slug: string): { list: Project[]; deletes: string[]; message: string } {
  const project = list.find((p) => p.slug === slug);
  if (!project) throw new ValidationError([{ path: '', message: 'Proiectul nu mai există.' }]);
  return {
    list: list.filter((p) => p.slug !== slug),
    deletes: project.photos.map(photoFile),
    message: `Proiect șters: ${project.title}`,
  };
}

export function reorderProjects(list: Project[], order: string[], featured: Record<string, boolean>): Project[] {
  const bySlug = new Map(list.map((p) => [p.slug, p]));
  const same = order.length === list.length && new Set(order).size === order.length && order.every((s) => bySlug.has(s));
  if (!same) {
    throw new ValidationError([{ path: '', message: 'Lista de proiecte s-a schimbat între timp. Reîncarcă pagina.' }]);
  }
  return order.map((s) => {
    const p = bySlug.get(s)!;
    return { ...p, featured: featured[s] ?? p.featured };
  });
}
