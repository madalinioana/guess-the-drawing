# CI/CD Pipeline - Guess the Drawing

## 1. Environment-uri folosite

### 1.1 Development (Local)

**Configurare:**
```bash
# Frontend: http://localhost:5173
cd client && npm run dev

# Backend: http://localhost:3001
cd server && node server.js
```

**Caracteristici:**
- Hot Module Replacement (HMR) pentru React
- CORS permisiv (localhost)
- Console logging verbose
- Mock data optional

**Environment variables:**
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

### 1.2 Production

**Configurare:**
- **Frontend:** Vercel (https://guess-the-drawing-tau.vercel.app)
- **Backend:** Render.com (https://guess-the-drawing.onrender.com)

**Trigger:** Push/merge pe main branch

**Caracteristici:**
- Auto-deploy la push
- Zero-downtime deployment (Vercel)
- HTTPS/WSS fortat
- Error logging only
- Cold start 30s (Render free tier)

**Environment variables:**
```env
# Vercel
VITE_API_URL=https://guess-the-drawing.onrender.com
VITE_WS_URL=wss://guess-the-drawing.onrender.com

# Render
NODE_ENV=production
CLIENT_URL=https://guess-the-drawing-tau.vercel.app
```

---

## 2. Diferente intre environment-uri

| Aspect | Development | Production |
|--------|-------------|------------|
| **CORS** | `*` (permisiv) | Doar Vercel domain |
| **Logging** | Verbose (console.log) | Error only |
| **Rate Limiting** | Disabled | Enabled (strict) |
| **Hot Reload** | Enabled (HMR) | Disabled |
| **Bundle** | Unminified | Minified + compressed |
| **SSL** | HTTP | HTTPS fortat |

---

## 3. CI Pipeline (GitHub Actions)

**Trigger:** Push pe main/develop sau Pull Request

**Workflow:**
```yaml
jobs:
  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - Checkout code
      - Setup Node.js 18
      - npm install (client)
      - npm test --coverage

  test-backend:
    runs-on: ubuntu-latest
    steps:
      - Checkout code
      - Setup Node.js 18
      - npm install (server)
      - npm test

  build-check:
    needs: [test-frontend, test-backend]
    steps:
      - npm run build (client)
      - Check build size
```

**Durata:** ~3-4 minute

---

## 4. CD Pipeline

### 4.1 Frontend (Vercel)

**Process:**
```
1. Push pe main → Vercel detecteaza
2. Install dependencies (npm install)
3. Build (npm run build)
4. Deploy la CDN global
5. Invalideaza cache
```

**Durata:** 1-2 minute

**Settings Vercel:**
- Root Directory: `client`
- Framework: Vite
- Build Command: `npm run build`
- Output Directory: `dist`

---

### 4.2 Backend (Render)

**Process:**
```
1. Push pe main → Render detecteaza
2. Clone repository
3. Install dependencies (npm install)
4. Start (node server.js)
5. Health check /health
```

**Durata:** 2-4 minute

**Settings Render:**
- Root Directory: `server`
- Build Command: `npm install`
- Start Command: `node server.js`
- Port: Dynamic (env PORT)

---

## 5. Configurari specifice

### 5.1 Health Check

```javascript
// server/server.js
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: Date.now()
  });
});
```

Render ping-uieste `/health` la 30 secunde. Daca 3 checks fail → auto-restart.

---

### 5.2 CORS Configuration

```javascript
// server/config/cors.js
const allowedOrigins = [
  'https://guess-the-drawing-tau.vercel.app',
  /\.vercel\.app$/ // Preview deployments
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.some(allowed => 
      typeof allowed === 'string' ? allowed === origin : allowed.test(origin)
    )) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed'));
    }
  },
  credentials: true
};
```

---

## 6. Rollback Strategy

**Vercel:**
1. Deployments tab
2. Select previous deployment
3. "Promote to Production"
4. Durata: <30 secunde

**Render:**
1. Deployments tab
2. Select previous deployment
3. "Redeploy"
4. Durata: 2-3 minute

---

## 7. Concluzii

Pipeline-ul CI/CD actual asigura deployment rapid si sigur: teste automate la push (GitHub Actions), deployment automat pe main branch (Vercel + Render), rollback simplu. Diferentele intre development si production (CORS, logging, rate limiting) sunt configurate prin environment variables.
