export interface QuoteRequest {
  name: string;
  phone: string;
  projectType: string;
  message: string;
}

/** Normalizeaza un numar romanesc la formatul international fara plus: 40xxxxxxxxx */
export function normalizeNumber(raw: string): string {
  let d = raw.replace(/\D/g, '');
  if (d.startsWith('00')) d = d.slice(2);
  if (d.startsWith('0')) d = `40${d.slice(1)}`;
  return d;
}

export function buildMessage(r: QuoteRequest): string {
  const lines = [
    'Bună ziua, aș dori o ofertă.',
    '',
    `Nume: ${r.name.trim()}`,
    `Telefon: ${r.phone.trim()}`,
    `Proiect: ${r.projectType.trim()}`,
  ];

  const details = r.message.trim();
  if (details) lines.push('', details);

  return lines.join('\n');
}

export function buildWhatsAppUrl(number: string, r: QuoteRequest): string {
  return `https://wa.me/${normalizeNumber(number)}?text=${encodeURIComponent(buildMessage(r))}`;
}
