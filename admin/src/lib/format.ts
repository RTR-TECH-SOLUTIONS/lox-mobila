/** „40740000000” devine „0740 000 000”, cum il scrie clientul. */
export function formatPhone(international: string): string {
  const local = international.startsWith('40') ? `0${international.slice(2)}` : international;
  return local.replace(/^(\d{4})(\d{3})(\d{3})$/, '$1 $2 $3');
}

/** 1 poză, 2 poze, 20 de poze. */
export function photosLabel(n: number): string {
  if (n === 1) return '1 poză';
  return n % 100 >= 20 || n % 100 === 0 ? `${n} de poze` : `${n} poze`;
}
