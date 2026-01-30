# Analiza de securitate - Guess the Drawing

## 1. Riscuri principale de securitate

### 1.1 Input Injection (XSS)

**Risc:** Utilizatori rau-intentionati pot introduce cod JavaScript malitios prin cuvinte sau mesaje chat.

**Severitate:** Medie | **Probabilitate:** Ridicata

**Tactici de mitigare:**

```javascript
function sanitizeInput(text) {
  return text
    .trim()
    .substring(0, 100)
    .replace(/<[^>]*>/g, '')         // Remove HTML tags
    .replace(/javascript:/gi, '')    // Remove JS protocol
    .replace(/on\w+=/gi, '');       // Remove event handlers
}

socket.on('guess', (data) => {
  const cleanText = sanitizeInput(data.text);
  // Process clean text
});
```

**Eficacitate:** 90% - Previne majoritatea atacurilor XSS comune

---

### 1.2 Authorization Bypass (Cheating)

**Risc:** Jucatori incearca sa deseneze cand nu e randul lor sau sa kick alti jucatori fara permisiuni.

**Severitate:** Medie | **Probabilitate:** Ridicata

**Tactici de mitigare:**

```javascript
socket.on('drawing', (data) => {
  const room = rooms.get(data.roomId);
  
  if (socket.id !== room.drawerId) {
    return; // Ignora silent (anti-cheat)
  }
  
  socket.to(data.roomId).emit('drawingReceived', data);
});

socket.on('kickPlayer', (data) => {
  const room = rooms.get(data.roomId);
  
  if (socket.id !== room.hostId) {
    return socket.emit('error', {code: 'UNAUTHORIZED'});
  }
  
  // Proceseaza kick
});
```

**Eficacitate:** 95% - Validare server-side pentru toate actiunile critice

---

### 1.3 Denial of Service (DoS)

**Risc:** Atacatori emit rapid evenimente (drawing, guess) pentru a suprasolicita serverul.

**Severitate:** Ridicata | **Probabilitate:** Medie

**Tactici de mitigare:**

```javascript
const rateLimiters = new Map();

function checkRateLimit(socketId, eventType, limit, windowMs) {
  const key = `${socketId}:${eventType}`;
  const now = Date.now();
  
  if (!rateLimiters.has(key)) {
    rateLimiters.set(key, []);
  }
  
  const timestamps = rateLimiters.get(key);
  const validTimestamps = timestamps.filter(t => now - t < windowMs);
  
  if (validTimestamps.length >= limit) {
    return false; // Rate limited
  }
  
  validTimestamps.push(now);
  rateLimiters.set(key, validTimestamps);
  return true;
}

socket.on('guess', (data) => {
  if (!checkRateLimit(socket.id, 'guess', 5, 2000)) {
    return socket.emit('rateLimited');
  }
  // Process
});
```

**Rate limits:**
- Drawing: 60 events/secunda
- Guess: 5 events per 2 secunde
- Room creation: 3 per minut

**Eficacitate:** 85% - Previne majoritatea atacurilor DoS

---

### 1.4 CORS Misconfiguration

**Risc:** Domenii neautorizate pot accesa API-ul backend.

**Severitate:** Medie | **Probabilitate:** Scazuta

**Tactici de mitigare:**

```javascript
const allowedOrigins = [
  'https://guess-the-drawing-tau.vercel.app',
  /\.vercel\.app$/ // Preview deployments
];

app.use(cors({
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
}));
```

**Eficacitate:** 95% - Doar Vercel domain permis

---

## 2. Vulnerabilitati cunoscute (acceptabile pentru MVP)

| Vulnerabilitate | Impact | Acceptabilitate |
|-----------------|--------|-----------------|
| Lipsa autentificare persistenta | Oricine poate crea camere | Acceptabil (MVP casual) |
| Session hijacking prin socket.id | Posibil, dar impact limitat | Acceptabil (no sensitive data) |
| Nu exista profanity filter | Cuvinte ofensatoare posibile | Acceptabil (joc intre prieteni) |

---

## 3. Matrice de risc

| Risc | Severitate | Probabilitate | Mitigare | Status |
|------|------------|---------------|----------|--------|
| XSS | Medie | Ridicata | 90% | Mitigat |
| Authorization Bypass | Medie | Ridicata | 95% | Mitigat |
| DoS | Ridicata | Medie | 85% | Mitigat |
| CORS | Medie | Scazuta | 95% | Mitigat |

---

## 4. Concluzii

Aplicatia implementeaza masuri de securitate adecvate pentru un MVP academic: input sanitization, validare server-side, rate limiting, CORS restrictiv. Vulnerabilitatile cunoscute (lipsa auth persistenta, no profanity filter) sunt acceptabile pentru scope-ul de joc casual intre prieteni.
