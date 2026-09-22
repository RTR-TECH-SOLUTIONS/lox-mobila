// Genereaza linia unui cont pentru ADMIN_USERS: npm run user -- <email> "<Nume>" "<parola>"
import { hashPassword } from '../src/lib/password.mjs';

const [email, name, password] = process.argv.slice(2);
if (!email || !name || !password || password.length < 10) {
  console.error('Folosire: npm run user -- <email> "<Nume>" "<parola de minimum 10 caractere>"');
  process.exit(1);
}
if (!email.includes('@')) {
  console.error(`Emailul „${email}” nu e valid.`);
  process.exit(1);
}
console.log(JSON.stringify({ email, name, hash: hashPassword(password) }));
