# Admin LOX Mobila

Panoul în care atelierul LOX își editează proiectele, pozele, textele, contactul și culorile.
Fiecare salvare face un commit pe `main`; workflow-ul `deploy.yml` publică site-ul în cam un minut.

## Local

    cp .env.example .env        # apoi completează; LOCAL_REPO_DIR = un clone local, fără GitHub
    npm install
    npm run dev                 # http://localhost:4400

## Cont nou sau parolă nouă

    npm run user -- atelier@loxmobila.ro "Nume" "parola de minimum 10 caractere"

Linia afișată se adaugă în lista `ADMIN_USERS` din Coolify, apoi se repornește aplicația.

În Coolify, `ADMIN_USERS` (și orice valoare care conține `$`) se bifează „Is Literal”. Altfel Coolify
citește `$ceva` ca pe o variabilă și îl înlocuiește cu text gol. Formatul nou al parolelor
(`scrypt:<sare>:<hash>`) nu mai are `$`, dar conturile vechi (`scrypt$...`) încă îl au.
Un cont scris greșit oprește adminul la pornire, cu mesajul `ADMIN_USERS: contul <nr> nu e valid (<câmp>)`
în log, iar verificarea `/health` pică.

## Verificarea cap-coadă

Rulează tot fluxul din browser (login, proiect nou, poze, texte, culori), în modul local, fără GitHub,
apoi construiește site-ul cu ce a scris adminul. Din rădăcina repo-ului:

    rm -rf /tmp/lox-e2e && git clone -q "$PWD" /tmp/lox-e2e
    PUBLIC_ADMIN_ORIGIN=http://localhost:4400 npm run build && npx astro preview --port 4322
    cd admin && ADMIN_ENV_FILE=.env.e2e npm run dev          # alt terminal; adminul pe 4400
    node admin/e2e/flow.mjs                                  # din rădăcină, al treilea terminal

`admin/.env.e2e` e ca `.env`, cu `LOCAL_REPO_DIR=/tmp/lox-e2e` și contul `e2e@loxmobila.ro` cu parola
`parola-e2e-12345` (linia se face cu `npm run user`). Scriptul se oprește la prima verificare care nu
trece; ultima linie bună e `ok site-ul se construieste cu continutul scris de admin`. La final, oprește
serverele (`npx astro dev stop` în `admin/`, `npx astro preview stop` în rădăcină) și construiește
site-ul din nou, fără `PUBLIC_ADMIN_ORIGIN`.

## Productie

Coolify, aplicație Dockerfile: contextul `/`, fișierul `admin/Dockerfile`, portul 4321, verificarea `/health`.
La verificare, gazda e `127.0.0.1`, nu `localhost`: în container `localhost` poate ajunge pe IPv6,
unde serverul nu ascultă, și aplicația apare căzută deși merge.
Variabilele sunt cele din `.env.example`; `LOCAL_REPO_DIR` rămâne gol.

Adminul face commit direct pe `main`: înainte de lucru în cod, `git pull`.

`SESSION_SECRET` semnează sesiunile: dacă îl schimbi, toată lumea iese din cont și intră din nou.

`GITHUB_TOKEN` e un token fine-grained doar pentru `lox-mobila` (Contents citire și scriere, Actions
citire) și expiră după un an. Pune-ți un memento: când expiră, salvările dau „Nu am putut salva pe
GitHub”. Se face unul nou pe GitHub și se înlocuiește în Coolify.

## Când se mută domeniile

- `ADMIN_ORIGIN` în Coolify: adresa nouă a adminului (verificarea de origine respinge altfel orice salvare).
- `PUBLIC_SITE_URL` în Coolify: adresa nouă a site-ului (previzualizarea din Aspect și linkurile „Vezi pe site”).
- `PUBLIC_ADMIN_ORIGIN` în `.github/workflows/deploy.yml`: site-ul primește culorile de previzualizare
  doar de la adminul cu adresa asta.
- Gazda nouă a site-ului nu are voie să trimită `X-Frame-Options` (sau `frame-ancestors` care să
  excludă adminul) pentru paginile site-ului: ecranul Aspect afișează site-ul într-un iframe.
