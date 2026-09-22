type State = 'pending' | 'success' | 'failure' | 'slow';

interface Job {
  sha: string;
  view?: string;
  at: number;
}

const KEY = 'lox-publish';
const POLL_MS = 4000;
const SLOW_MS = 6 * 60_000;
const SLOW_POLL_MS = POLL_MS * 3;
const GIVE_UP_MS = 30 * 60_000;
const SHA = /^[0-9a-f]{40}$/;

const bar = document.querySelector<HTMLElement>('[data-status]');
const siteUrl = document.body.dataset.siteUrl ?? '';
let timer = 0;

const TEXT: Record<State, string> = {
  pending: 'Se publică. Durează cam un minut.',
  success: 'Publicat.',
  failure: 'Nu s-a publicat. Site-ul a rămas cum era. Încearcă din nou sau scrie-ne.',
  slow: 'Publicarea durează mai mult decât de obicei. Verifică site-ul peste câteva minute.',
};

function render(state: State, job: Job): void {
  if (!bar) return;
  bar.dataset.state = state;
  bar.hidden = false;
  const dot = Object.assign(document.createElement('span'), { className: 'status__dot' });
  const text = Object.assign(document.createElement('span'), { textContent: TEXT[state] });
  bar.replaceChildren(dot, text);
  if (state === 'success') {
    const a = Object.assign(document.createElement('a'), { href: `${siteUrl}${job.view ?? '/'}`, target: '_blank', rel: 'noopener', textContent: 'Vezi pe site' });
    bar.append(a);
  }
  if (state !== 'pending') {
    const close = Object.assign(document.createElement('button'), { type: 'button', className: 'linklike status__close', textContent: 'Închide' });
    close.addEventListener('click', () => (bar.hidden = true));
    bar.append(close);
  }
}

function finish(): void {
  clearTimeout(timer);
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* fara sessionStorage, urmarirea se opreste la schimbarea paginii */
  }
}

async function tick(job: Job): Promise<void> {
  const age = Date.now() - job.at;
  // Peste 30 de minute renuntam sa mai intrebam; mesajul de "dureaza mai mult" ramane pe bara.
  if (age > GIVE_UP_MS) {
    finish();
    if (bar?.dataset.state !== 'slow') render('slow', job);
    return;
  }
  // Dupa 6 minute aratam mesajul de intarziere, dar continuam sa intrebam, mai rar, ca sa prindem finalul.
  const slow = age > SLOW_MS;
  if (slow && bar?.dataset.state !== 'slow') render('slow', job);
  try {
    const res = await fetch(`/api/status?sha=${job.sha}`);
    const data = (await res.json()) as { state?: State };
    if (data.state === 'success' || data.state === 'failure') {
      finish();
      render(data.state, job);
      return;
    }
  } catch {
    /* reincercam la urmatorul pas */
  }
  timer = window.setTimeout(() => tick(job), slow ? SLOW_POLL_MS : POLL_MS);
}

export function startStatus(sha: string, view?: string): void {
  const job: Job = { sha, view, at: Date.now() };
  try {
    sessionStorage.setItem(KEY, JSON.stringify(job));
  } catch {
    /* continuam doar pe pagina curenta */
  }
  clearTimeout(timer);
  render('pending', job);
  void tick(job);
}

// O publicare pornita inainte de o schimbare de pagina continua sa fie urmarita.
const params = new URLSearchParams(location.search);
const fromUrl = params.get('publicat');
if (fromUrl && SHA.test(fromUrl)) {
  history.replaceState(null, '', location.pathname);
  startStatus(fromUrl, params.get('vezi') ?? undefined);
} else {
  try {
    const saved = sessionStorage.getItem(KEY);
    if (saved) {
      const job = JSON.parse(saved) as Job;
      if (SHA.test(job.sha)) {
        render('pending', job);
        void tick(job);
      }
    }
  } catch {
    /* nimic de reluat */
  }
}
