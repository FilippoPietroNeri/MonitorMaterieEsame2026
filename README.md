# MonitorMaterieEsame2026

**MonitorMaterieEsame2026** è un progetto open source per il monitoraggio automatico delle materie d’esame di Stato, tramite il confronto delle pubblicazioni ufficiali del Ministero dell’Istruzione tra anni scolastici diversi.

---

## Caratteristiche

- Monitoraggio automatico delle materie d’esame tra anni diversi.
- Confronto e visualizzazione delle differenze.
- Interfaccia web semplice e intuitiva.
- Progetto open source e facilmente estendibile.

---

## Requisiti

- Node.js e npm/yarn
- NGINX
- Certbot (per SSL)
- Ubuntu/Debian (per le istruzioni NGINX)

---

## Installazione

### 1. Clona il repository

```bash
git clone https://github.com/FilippoPietroNeri/MonitorMaterieEsame2026.git
cd MonitorMaterieEsame2026
```

### 2. Installa le dipendenze

```bash
npm install
# oppure
yarn install
```

### 3. Avvia l'applicazione

```bash
npm start
# oppure
yarn start
```

L’applicazione sarà disponibile su `http://localhost:3000`.

---

## Configurazione NGINX e SSL

### Variabili di ambiente monitor
- `MONITOR_INTERVAL_MS` (opzionale): intervallo di polling in millisecondi per controllare il sito ministeriale. Default: `120000` (2 minuti).
- `MONITOR_TIMEOUT_MS` (opzionale): timeout in millisecondi per la richiesta HTTP al sito. Default: `10000`.
- `DISCORD_WEBHOOK_URLS` (opzionale): uno o più webhook Discord separati da virgola, punto e virgola o newline che riceveranno la notifica quando l'anno passa da 2024/25 a 2025/26 (o a un nuovo anno scolastico). In alternativa si può usare `DISCORD_WEBHOOK_URL` per un singolo webhook.
- SMTP: continuano a servire `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` per l'invio email agli iscritti.

### 1. Installa NGINX e Certbot

```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx
```

### 2. Configura il sito

Crea un file di configurazione NGINX:

```bash
sudo nano /etc/nginx/sites-available/domain.com
```

Inserisci il seguente contenuto:

```nginx
server {
    listen 80;
    server_name domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 3. Abilita il sito e riavvia NGINX

```bash
sudo ln -s /etc/nginx/sites-available/domain.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 4. Abilita HTTPS con Certbot

```bash
sudo certbot --nginx -d domain.com
```

Segui le istruzioni per ottenere il certificato SSL gratuito.

---

## Contributi

Contributi benvenuti! Puoi aprire **issue** o **pull request** per suggerire miglioramenti o aggiungere nuove funzionalità.

---

## Licenza

Questo progetto è rilasciato sotto **MIT License**.
