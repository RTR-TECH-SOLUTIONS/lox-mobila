import { buildObject, toLines, toParagraphs } from '../lib/form-data';
import { startStatus } from './status';

export interface Issue {
  path: string;
  message: string;
}

export interface SaveResult {
  ok: boolean;
  sha?: string;
  slug?: string;
  error?: string;
  issues?: Issue[];
}

let dirty = false;
export const markDirty = () => {
  dirty = true;
};
export const markClean = () => {
  dirty = false;
};

window.addEventListener('beforeunload', (e) => {
  if (dirty) e.preventDefault();
});
document.addEventListener('click', (e) => {
  if ((e.target as HTMLElement).closest('[data-discard]')) dirty = false;
});

function reindexOne(rep: HTMLElement): void {
  const rows = rep.querySelector<HTMLElement>('[data-rows]');
  if (!rows) return;
  [...rows.children].forEach((row, i) => {
    row.querySelectorAll<HTMLInputElement>('[data-name]').forEach((el) => {
      el.name = `${rep.dataset.repeater}.${i}.${el.dataset.name}`;
    });
  });
}

/** Pune numele complete pe campurile din randurile repetabile, in ordinea din pagina. */
export function reindex(root: ParentNode): void {
  root.querySelectorAll<HTMLElement>('[data-repeater]').forEach(reindexOne);
}

export function initRepeaters(root: ParentNode): void {
  root.querySelectorAll<HTMLElement>('[data-repeater]').forEach((rep) => {
    const rows = rep.querySelector<HTMLElement>('[data-rows]')!;
    const template = rep.querySelector<HTMLTemplateElement>('template[data-template]')!;

    rep.querySelector('[data-add]')?.addEventListener('click', () => {
      rows.append(template.content.cloneNode(true));
      reindexOne(rep);
      markDirty();
      rows.lastElementChild?.querySelector<HTMLElement>('input, textarea, select')?.focus();
    });

    rows.addEventListener('click', (e) => {
      const btn = (e.target as HTMLElement).closest('button');
      const row = btn?.closest<HTMLElement>('[data-row]');
      if (!btn || !row) return;
      if (btn.matches('[data-remove]')) row.remove();
      else if (btn.matches('[data-up]') && row.previousElementSibling) row.previousElementSibling.before(row);
      else if (btn.matches('[data-down]') && row.nextElementSibling) row.nextElementSibling.after(row);
      else return;
      reindexOne(rep);
      markDirty();
    });

    reindexOne(rep);
  });
}

/** Valorile formularului, cu tipul potrivit; listele goale apar ca [] ca sa se poata salva goale. */
export function serialize(form: HTMLFormElement): [string, unknown][] {
  reindex(form);
  const out: [string, unknown][] = [];
  form.querySelectorAll<HTMLElement>('[data-repeater]').forEach((rep) => out.push([rep.dataset.repeater!, []]));
  const fields = form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
    'input[name], textarea[name], select[name]',
  );
  for (const el of fields) {
    if (el.disabled || (el instanceof HTMLInputElement && el.type === 'file')) continue;
    const kind = el.dataset.kind;
    const value =
      el instanceof HTMLInputElement && el.type === 'checkbox'
        ? el.checked
        : kind === 'number'
          ? el.value.trim() === ''
            ? null
            : Number(el.value)
          : kind === 'lines'
            ? toLines(el.value)
            : kind === 'paragraphs'
              ? toParagraphs(el.value)
              : el.value;
    out.push([el.name, value]);
  }
  return out;
}

export function setMessage(form: HTMLFormElement, text: string, error = false): void {
  const msg = form.querySelector<HTMLElement>('[data-save-msg]');
  if (!msg) return;
  msg.textContent = text;
  msg.classList.toggle('is-error', error);
}

let errorIds = 0;

/**
 * Erorile apar sub campul lor; cele fara camp, in bara de salvare.
 * Intoarce cate mesaje au ajuns in bara, ca apelantul sa nu le scrie peste.
 */
export function showIssues(form: HTMLFormElement, issues: Issue[]): number {
  form.querySelectorAll('.field.has-error').forEach((f) => f.classList.remove('has-error'));
  form.querySelectorAll<HTMLElement>('.field__error').forEach((e) => {
    e.hidden = true;
    e.textContent = '';
  });
  form.querySelectorAll('[aria-invalid]').forEach((el) => {
    el.removeAttribute('aria-invalid');
    el.removeAttribute('aria-describedby');
  });

  const loose: string[] = [];
  let first: HTMLElement | null = null;
  for (const issue of issues) {
    const input = issue.path ? form.querySelector<HTMLElement>(`[name="${CSS.escape(issue.path)}"]`) : null;
    const field = input?.closest<HTMLElement>('.field');
    const box = field?.querySelector<HTMLElement>('.field__error') ?? form.querySelector<HTMLElement>(`[data-error-for="${CSS.escape(issue.path)}"]`);
    if (!box) {
      loose.push(issue.message);
      continue;
    }
    field?.classList.add('has-error');
    box.textContent = issue.message;
    box.hidden = false;
    // Cititorul de ecran anunta eroarea odata cu campul.
    box.id ||= `eroare-${++errorIds}`;
    input?.setAttribute('aria-invalid', 'true');
    input?.setAttribute('aria-describedby', box.id);
    first ??= input ?? box;
  }
  if (loose.length) setMessage(form, loose.join(' '), true);
  first?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  if (first instanceof HTMLInputElement || first instanceof HTMLTextAreaElement || first instanceof HTMLSelectElement) first.focus({ preventScroll: true });
  return loose.length;
}

function send(url: string, body: XMLHttpRequestBodyInit, isJson: boolean, onProgress?: (p: number) => void): Promise<SaveResult> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    if (isJson) xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.responseType = 'json';
    if (onProgress) xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
    xhr.onload = () => {
      if (xhr.status === 401) resolve({ ok: false, error: 'Sesiunea a expirat. Reîncarcă pagina și intră din nou în cont.' });
      else resolve((xhr.response as SaveResult | null) ?? { ok: false, error: `Eroare ${xhr.status}. Încearcă din nou.` });
    };
    xhr.onerror = () => reject(new Error('retea'));
    xhr.send(body);
  });
}

interface SaveOptions {
  /** Verificari facute inainte de trimitere; daca intoarce erori, nu se trimite nimic. */
  validate?: (form: HTMLFormElement) => Issue[];
  /** Corpul cererii; implicit, JSON-ul formularului. */
  body?: (form: HTMLFormElement) => Promise<{ body: XMLHttpRequestBodyInit; json: boolean }>;
  /** Ce se intampla dupa salvare; implicit porneste bara de publicare. */
  onSaved?: (result: SaveResult) => void;
}

export function initSaveForm(form: HTMLFormElement, opts: SaveOptions = {}): void {
  const button = form.querySelector<HTMLButtonElement>('[data-save]');
  form.addEventListener('input', markDirty);
  form.addEventListener('change', markDirty);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (button?.disabled) return;
    const local = opts.validate?.(form) ?? [];
    if (local.length) {
      if (!showIssues(form, local)) setMessage(form, 'Verifică câmpurile marcate.', true);
      return;
    }
    if (button) button.disabled = true;
    setMessage(form, 'Se salvează…');
    try {
      const payload = opts.body
        ? await opts.body(form)
        : { body: JSON.stringify(buildObject(serialize(form))), json: true };
      const result = await send(form.action, payload.body, payload.json, payload.json
        ? undefined
        : (p) => setMessage(form, p < 1 ? `Se urcă pozele: ${Math.round(p * 100)}%` : 'Se pregătesc pozele…'));
      if (result.ok && result.sha) {
        markClean();
        showIssues(form, []);
        setMessage(form, '');
        if (opts.onSaved) opts.onSaved(result);
        else startStatus(result.sha, form.dataset.view);
      } else {
        const loose = showIssues(form, result.issues ?? []);
        if (!loose) setMessage(form, result.error ?? 'Nu s-a putut salva.', true);
      }
    } catch {
      setMessage(form, 'Nu s-a putut trimite. Verifică conexiunea la internet și încearcă din nou.', true);
    } finally {
      if (button) button.disabled = false;
    }
  });
}

document.querySelectorAll<HTMLFormElement>('form[data-save-form]').forEach((form) => {
  initRepeaters(form);
  initSaveForm(form);
});
