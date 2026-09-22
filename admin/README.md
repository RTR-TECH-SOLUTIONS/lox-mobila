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

## Productie

Coolify, aplicație Dockerfile: contextul `/`, fișierul `admin/Dockerfile`, portul 4321, verificarea `/health`.
Variabilele sunt cele din `.env.example`; `LOCAL_REPO_DIR` rămâne gol.

Adminul face commit direct pe `main`: înainte de lucru în cod, `git pull`.
