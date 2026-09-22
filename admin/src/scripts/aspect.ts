import { deriveTheme, themeWarnings, type ThemeColors } from '@site/lib/theme';
import { initSaveForm, markDirty } from './form';

const form = document.querySelector<HTMLFormElement>('form[data-theme-form]');
const frame = document.querySelector<HTMLIFrameElement>('iframe[data-frame]');

if (form && frame) {
  const origin = frame.dataset.origin!;
  const names = ['background', 'text', 'accent'] as const;
  const hex = (n: (typeof names)[number]) => form.querySelector<HTMLInputElement>(`[data-hex="${n}"]`)!;
  const color = (n: (typeof names)[number]) => form.querySelector<HTMLInputElement>(`[data-color="${n}"]`)!;
  const warnings = form.querySelector<HTMLElement>('[data-warnings]')!;
  const valid = (v: string) => /^#[0-9a-fA-F]{6}$/.test(v.trim());

  const current = (): ThemeColors | null => {
    const out = {} as ThemeColors;
    for (const n of names) {
      const v = hex(n).value.trim();
      if (!valid(v)) return null;
      out[n] = v.toUpperCase();
    }
    return out;
  };

  // Trimite culorile in iframe si actualizeaza avertismentele de contrast.
  const apply = () => {
    const c = current();
    if (!c) return;
    const { scheme, vars } = deriveTheme(c);
    frame.contentWindow?.postMessage({ type: 'lox-theme', scheme, vars }, origin);
    warnings.replaceChildren(
      ...themeWarnings(c).map((w) => Object.assign(document.createElement('p'), { className: 'warning', textContent: w.message })),
    );
  };

  for (const n of names) {
    color(n).addEventListener('input', () => {
      hex(n).value = color(n).value.toUpperCase();
      markDirty();
      apply();
    });
    hex(n).addEventListener('input', () => {
      markDirty();
      if (!valid(hex(n).value)) return;
      color(n).value = hex(n).value.trim().toLowerCase();
      apply();
    });
  }

  form.querySelectorAll<HTMLButtonElement>('[data-preset]').forEach((b) =>
    b.addEventListener('click', () => {
      const preset = JSON.parse(b.dataset.preset!) as ThemeColors;
      for (const n of names) {
        hex(n).value = preset[n];
        color(n).value = preset[n].toLowerCase();
      }
      markDirty();
      apply();
    }),
  );

  frame.addEventListener('load', apply);
  window.addEventListener('message', (e) => {
    if (e.origin === origin && (e.data as { type?: string })?.type === 'lox-theme-ready') apply();
  });

  document.querySelectorAll<HTMLButtonElement>('[data-width]').forEach((b) =>
    b.addEventListener('click', () => {
      document.querySelectorAll('[data-width]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      frame.closest('[data-preview]')!.classList.toggle('is-phone', b.dataset.width === 'phone');
    }),
  );

  initSaveForm(form);
}
