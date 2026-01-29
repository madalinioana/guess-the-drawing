# CI/CD Pipeline - Guess the Drawing

## 1. Introducere

Acest document descrie procesul de integrare continua (CI) si deployment continuu (CD) pentru aplicatia Guess the Drawing. Infrastructura de deployment foloseste Vercel pentru frontend si Railway pentru backend.

---

## 2. Arhitectura deployment

### 2.1 Overview

```
GitHub Repository
       |
       |-- Push to main
       |
       ├─────────────────┬─────────────────┐
       |                 |                 |
       v                 v                 v
   GitHub Actions    Vercel Deploy   Railway Deploy
   (CI Pipeline)     (Frontend)      (Backend)
       |                 |                 |
       v                 v                 v
   Run Tests         Build React      Build Node.js
   Check Linting     Deploy to CDN    Deploy to Container
       |                 |                 |
       └─────────────────┴─────────────────┘
                         |
                         v
                   Production
```

### 2.2 Componente principale

| Componenta | Serviciu | Scop |
|------------|----------|------|
| **Source Control** | GitHub | Repository principal, version control |
| **CI Pipeline** | GitHub Actions | Rulare teste, linting, build verification |
| **Frontend Hosting** | Vercel | Deploy React SPA, CDN global |
| **Backend Hosting** | Railway | Deploy Node.js server, container Docker |

---

## 3. Environment-uri

### 3.1 Development (Local)

**Configurare:**
```bash
# Frontend
cd client
npm run dev
# Ruleaza pe http://localhost:5173

# Backend
cd server
node server.js
# Ruleaza pe http://localhost:3001
```

**Caracteristici:**
- Hot Module Replacement (HMR) pentru React
- Nodemon pentru auto-restart backend
- CORS permisiv pentru localhost
- Console logging verbose
- Mock data pentru testare

**Environment Variables (dev):**
```env
# client/.env.development
VITE_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001

# server/.env.development
PORT=3001
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

---

### 3.2 Staging (Preview)

**Configurare:**
- **Frontend:** Preview deployments pe Vercel (per branch)
- **Backend:** Railway environment "staging"

**Trigger:** Pull Request catre main branch

**Caracteristici:**
- URL temporar per PR (ex: `guess-drawing-pr-123.vercel.app`)
- Izolare completa de production
- Date de test
- Expira dupa merge/close PR

**Environment Variables (staging):**
```env
# Vercel (automatic)
VITE_API_URL=https://guess-drawing-staging.up.railway.app
VITE_WS_URL=wss://guess-drawing-staging.up.railway.app

# Railway (manual config)
PORT=3001
NODE_ENV=staging
CLIENT_URL=https://guess-drawing-pr-*.vercel.app
ALLOWED_ORIGINS=*.vercel.app
```

**Utilizare:**
- Review code inainte de merge
- Testare features noi
- QA manual

---

### 3.3 Production

**Configurare:**
- **Frontend:** Vercel production (main branch)
- **Backend:** Railway production environment

**Trigger:** Push/merge pe main branch

**Caracteristici:**
- URL stabil: `https://guess-the-drawing-tau.vercel.app`
- Auto-scaling (Vercel)
- Health checks (Railway)
- Error monitoring (console logs)
- Zero-downtime deployment

**Environment Variables (production):**
```env
# Vercel
VITE_API_URL=https://guess-the-drawing-production.up.railway.app
VITE_WS_URL=wss://guess-the-drawing-production.up.railway.app

# Railway
PORT=3001
NODE_ENV=production
CLIENT_URL=https://guess-the-drawing-tau.vercel.app
ALLOWED_ORIGINS=guess-the-drawing-tau.vercel.app
LOG_LEVEL=error
```

---

## 4. CI Pipeline (GitHub Actions)

### 4.1 Configurare workflow

```yaml
# .github/workflows/ci.yml
name: CI Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        working-directory: ./client
        run: npm ci
        
      - name: Run tests
        working-directory: ./client
        run: npm test -- --coverage
        
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          directory: ./client/coverage

  test-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        working-directory: ./server
        run: npm ci
        
      - name: Run tests
        working-directory: ./server
        run: npm test
        
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Run ESLint
        run: |
          cd client && npm ci && npm run lint
          cd ../server && npm ci && npm run lint

  build-check:
    runs-on: ubuntu-latest
    needs: [test-frontend, test-backend, lint]
    steps:
      - uses: actions/checkout@v3
      
      - name: Build frontend
        working-directory: ./client
        run: |
          npm ci
          npm run build
          
      - name: Check build size
        run: |
          du -sh client/dist
```

### 4.2 Checks obligatorii pentru merge

| Check | Descriere | Blocat merge? |
|-------|-----------|---------------|
| **test-frontend** | Unit tests React | Da |
| **test-backend** | Unit tests Node.js | Da |
| **lint** | ESLint pass | Da |
| **build-check** | Build success | Da |

---

## 5. CD Pipeline

### 5.1 Frontend Deployment (Vercel)

**Trigger:** Push pe main branch

**Process:**
```
1. Vercel detecteaza push pe GitHub
2. Cloneaza repository
3. Instaleaza dependencies (npm ci)
4. Ruleaza build (npm run build)
5. Optimizeaza assets (minify, compress)
6. Deploy la CDN global
7. Invalideaza cache vechi
8. Update DNS (daca e nevoie)
```

**Build settings:**
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm ci",
  "framework": "vite"
}
```

**Features Vercel:**
- **Preview Deployments:** URL unic per commit
- **Automatic HTTPS:** SSL certificate auto-generat
- **Edge Network:** 150+ locations
- **Instant Rollback:** Revert la deployment anterior
- **Analytics:** Traffic, performance metrics

**Durata deployment:** 1-2 minute

---

### 5.2 Backend Deployment (Railway)

**Trigger:** Push pe main branch

**Process:**
```
1. Railway detecteaza push pe GitHub
2. Creeaza container Docker
3. Instaleaza dependencies
4. Expune PORT 3001
5. Health check pe /health
6. Rolling deployment (zero downtime)
7. Opreste container vechi
```

**Dockerfile (implicit):**
```dockerfile
# Railway genereaza automat
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY . .

EXPOSE 3001

CMD ["node", "server.js"]
```

**Health check:**
```javascript
// server.js
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: Date.now()
  });
});
```

**Features Railway:**
- **Auto-scaling:** 1-4 instante bazat pe load
- **Persistent Connections:** WebSocket support
- **Logs:** Real-time logs in dashboard
- **Metrics:** CPU, RAM, network usage
- **Rollback:** Deploy anterior cu 1 click

**Durata deployment:** 2-3 minute

---

## 6. Deployment workflow complet

### 6.1 Feature development flow

```
1. Developer creeaza branch feature/xyz
   git checkout -b feature/xyz

2. Dezvolta si testeaza local
   npm test (trebuie sa treaca)

3. Commit si push
   git add .
   git commit -m "Add feature XYZ"
   git push origin feature/xyz

4. Creeaza Pull Request pe GitHub
   - GitHub Actions ruleaza CI
   - Vercel creeaza preview deployment
   - Code review

5. Dupa approve si CI pass
   - Merge in main branch
   - Vercel deploy production (frontend)
   - Railway deploy production (backend)

6. Verificare production
   - Smoke tests manual
   - Check logs pentru erori
   - Monitor uptime
```

### 6.2 Hotfix flow

```
1. Identificare bug in production
   git checkout main
   git pull

2. Fix rapid si test local
   npm test

3. Commit direct pe main (exceptional)
   git commit -m "Hotfix: description"
   git push origin main

4. Deploy automat (1-2 min)
   - Vercel: frontend
   - Railway: backend

5. Verificare fix
   - Test feature afectata
   - Check error logs
```

---

## 7. Monitoring si observabilitate

### 7.1 Logs

**Frontend (Vercel):**
```bash
# Acces: Vercel Dashboard > Project > Logs
# Filtru: Error, Warning, Info
# Retention: 7 zile (free tier)
```

**Backend (Railway):**
```bash
# Acces: Railway Dashboard > Service > Logs
# Filtru: stdout, stderr
# Retention: 7 zile

# Exemple logs:
[INFO] Server started on port 3001
[INFO] New connection: socket-abc123
[ERROR] Rate limit exceeded: socket-abc123
```

### 7.2 Metrici

**Vercel Analytics:**
- Page views
- Unique visitors
- Load time (P50, P95)
- Core Web Vitals

**Railway Metrics:**
- CPU usage (%)
- Memory usage (MB)
- Network I/O (MB/s)
- Active connections

### 7.3 Alerts (setup recomandat pentru productie)

**Email notifications pentru:**
- Deployment failed
- Error rate spike (>10 erori/min)
- Downtime detection
- Memory usage >80%

---

## 8. Rollback strategy

### 8.1 Rollback Vercel (frontend)

```bash
# Option 1: Vercel Dashboard
1. Deployments tab
2. Select previous deployment
3. Click "Promote to Production"

# Option 2: Vercel CLI
vercel rollback [deployment-url]
```

**Durata:** <30 secunde

### 8.2 Rollback Railway (backend)

```bash
# Railway Dashboard
1. Deployments tab
2. Select previous deployment
3. Click "Redeploy"
```

**Durata:** 1-2 minute (rebuild container)

### 8.3 Git rollback (ultimate)

```bash
# Revert la commit anterior
git revert HEAD
git push origin main

# Sau revert la commit specific
git revert <commit-hash>
git push origin main
```

Auto-trigger deployment cu versiunea anterioara.

---

## 9. Configurari specifice

### 9.1 Diferente intre environments

| Aspect | Development | Staging | Production |
|--------|-------------|---------|------------|
| **CORS** | `*` (permisiv) | Specific domain | Restrictiv |
| **Logging** | Verbose | Debug | Error only |
| **Rate Limiting** | Disabled | Enabled (lenient) | Enabled (strict) |
| **Error Messages** | Stack trace | Generic | Generic |
| **Analytics** | Disabled | Enabled | Enabled |
| **Auto-scaling** | N/A | N/A | Enabled |

### 9.2 Environment variables management

**Vercel:**
```bash
# Add variable
vercel env add VITE_API_URL production

# List all
vercel env ls

# Pull local
vercel env pull .env.local
```

**Railway:**
```bash
# Add variable in dashboard
Variables tab > Add Variable

# Or via CLI
railway variables set PORT=3001
```

**Best practices:**
- Nu commit `.env` files in Git
- Foloseste `.env.example` pentru template
- Rotate secrets periodic (trimestrial)

---

## 10. Troubleshooting

### 10.1 Probleme comune

**Deployment failed - Frontend:**
```bash
# Check build logs in Vercel
# Common: dependencies issue

# Fix:
npm ci
npm run build  # Test local
```

**Deployment failed - Backend:**
```bash
# Check Railway logs
# Common: port binding, missing env vars

# Fix:
# Verifica PORT=${PORT} in Railway settings
# Verifica toate env vars sunt setate
```

**WebSocket connection failed:**
```bash
# Verify CORS settings
# Verify WSS (not WS) in production
# Check Railway service is running
```

---

## 11. Imbunatatiri viitoare

### Prioritate ridicata

1. **Automated E2E tests in CI**
   ```yaml
   e2e-tests:
     runs-on: ubuntu-latest
     steps:
       - name: Run Playwright
         run: npx playwright test
   ```

2. **Staging environment persistent**
   - Railway staging service permanent
   - Vercel staging domain custom

### Prioritate medie

3. **Deployment notifications**
   - Slack/Discord webhook
   - Email on deployment success/fail

4. **Performance monitoring**
   - Sentry pentru error tracking
   - New Relic / Datadog pentru APM

### Prioritate scazuta

5. **Blue-Green deployment**
6. **Canary releases** (5% traffic initial)

---

## 12. Concluzii

Pipeline-ul CI/CD actual asigura deployment rapid si sigur pentru aplicatia Guess the Drawing. Folosirea Vercel si Railway simplifica procesul si elimina nevoia de infrastructura complexa.

**Puncte forte:**
- Deployment automat la push
- Preview deployments pentru PR-uri
- Zero-downtime deployment
- Rollback simplu si rapid

**Limitari:**
- Lipsa E2E tests in CI
- Monitoring basic (doar logs)
- Single environment production (nu blue-green)

Pentru un proiect academic, setup-ul actual este mai mult decat suficient. Pentru productie la scara, recomandare: adaugare monitoring avansat si teste E2E automate.
