/**
 * Previzualizarea culorilor din admin: pagina deschisa in iframe-ul ecranului „Aspect” primeste
 * variabilele prin postMessage si le aplica pe loc. In afara iframe-ului adminului nu face nimic.
 */
const ADMIN_ORIGIN = import.meta.env.PUBLIC_ADMIN_ORIGIN as string | undefined;
const KEY = 'lox-tema-preview';

function wanted(): boolean {
  if (!ADMIN_ORIGIN || window.self === window.top) return false;
  const asked = new URLSearchParams(location.search).has('tema');
  try {
    if (asked) sessionStorage.setItem(KEY, '1');
    return sessionStorage.getItem(KEY) === '1';
  } catch {
    return asked;
  }
}

if (ADMIN_ORIGIN && wanted()) {
  window.addEventListener('message', (e) => {
    if (e.origin !== ADMIN_ORIGIN) return;
    const data = e.data as { type?: string; scheme?: string; vars?: Record<string, string> };
    if (data?.type !== 'lox-theme' || !data.vars) return;
    const root = document.documentElement;
    for (const [name, value] of Object.entries(data.vars)) {
      if (name.startsWith('--')) root.style.setProperty(name, value);
    }
    if (data.scheme === 'dark' || data.scheme === 'light') {
      root.dataset.scheme = data.scheme;
      root.style.colorScheme = data.scheme;
    }
  });
  window.parent.postMessage({ type: 'lox-theme-ready' }, ADMIN_ORIGIN);
}

export {};
