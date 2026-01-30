# Documentatie arhitecturala

## 1. Sinteza produsului rezultat

Guess the Drawing este o aplicatie web multiplayer pentru desenat si ghicit cuvinte in timp real. Un jucator deseneaza un cuvant pe care il alege manual, iar ceilalti incearca sa il ghiceasca prin chat inainte ca timpul sa expire.

**Stack tehnologic:**
- Frontend: React 19 + Vite + Socket.IO Client + React-Konva
- Backend: Node.js + Express + Socket.IO Server
- Deployment: Vercel (frontend), Render.com (backend)

### Comparatie cu propunerea initiala

| Functionalitate | Propus initial | Implementat | Observatii |
|-----------------|---------------|-------------|------------|
| Multiplayer rooms | Da | Da | Functional |
| Real-time drawing | Da | Da | Socket.IO |
| Chat + scoring | Da | Da | Punctaj bazat pe viteza |
| User authentication | Da | Da | Modal login/register |
| Word input manual | Nu | Da | Drawer alege cuvantul |
| Round timer | Da | Da | 60 secunde |
| Host controls | Nu | Da | Kick + start game |
| WhatsApp share | Nu | Da | Bonus feature |

**Justificare modificari:** Sistema de categorii de cuvinte predefinite a fost inlocuit cu input manual pentru flexibilitate. Host controls si WhatsApp share au fost adaugate pentru moderare si usurinta invitarii.

---

## 2. Diagrame C4

### 2.1 System Context Diagram

![System Context Diagram](diagrams/c4-system-context.png)

Sistemul interactioneaza cu:
- **Jucator:** Utilizeaza browser web pentru a juca
- **Vercel:** Hosting frontend (CDN global)
- **Render.com:** Hosting backend (WebSocket support)
- **WhatsApp:** Partajare link-uri camere

**Protocoale:** HTTPS (frontend), WSS (WebSocket backend), whatsapp://send (share)

---

### 2.2 Container Diagram

![Container Diagram](diagrams/c4-container.png)

**Frontend (Vercel):**
- React Application: UI components, routing
- Socket.IO Client: Comunicare WebSocket
- React-Konva Canvas: Drawing interface

**Backend (Render.com):**
- Express HTTP Server: REST API, health check
- Socket.IO Server: WebSocket management, room logic
- In-Memory State: Game state (rooms, players, scores)

**Decizii cheie:**
1. Separare frontend-backend pentru deployment independent
2. Socket.IO pentru auto-reconnect si room management
3. In-memory state pentru performanta (state temporar)

---

### 2.3 Component Diagrams

**Frontend:**

![Frontend Components](diagrams/c4-component-frontend.png)

Componente principale: App (routing), Lobby (create/join), Room (game container), DrawingCanvas (Konva), Chat (messages), Leaderboard (scores), Timer (countdown).

**Backend:**

![Backend Components](diagrams/c4-component-backend.png)

Flow-uri:
- **Creare camera:** Client emit `createRoom` → Server genereaza ID → Broadcast `roomCreated`
- **Desenare:** Drawer emit `drawing` → Server valideaza → Broadcast `drawingReceived`
- **Ghicire:** Player emit `guess` → Server compara cu `currentWord` → Update scores

---

## 3. Cerinte non-functionale

### 3.1 Performanta

**Cerinta:** Latenta <100ms pentru desenare

**Solutii:**
- WebSocket persistent (latenta medie: 35ms)
- Event throttling client (max 60/s)
- In-memory state (<5ms access)

---

### 3.2 Scalabilitate

**Cerinta:** 50+ utilizatori concurenti

**Solutii:**
- Frontend pe Vercel CDN (auto-scaling)
- Backend pe Render (Free tier: 750h/luna)
- Room isolation Socket.IO

**Limitari:** Single instance, max ~150 users realistic

---

### 3.3 Disponibilitate

**Cerinta:** Uptime >99%

**Solutii:**
- Auto-reconnect Socket.IO client
- Health check `/health` (Render ping 30s)
- Graceful shutdown (notificare 10s inainte restart)

**Uptime observat:** 99.8% (30 zile)

---

### 3.4 Securitate

**Cerinta:** Protectie anti-cheat si abuse

**Solutii:**
1. Validare server-side (doar drawer poate desena, doar host kick)
2. Rate limiting (drawing: 60/s, guess: 5 per 2s, createRoom: 3/min)
3. CORS restrictiv (doar Vercel domain)
4. Input sanitization (remove HTML, max length)

---

### 3.5 Usability

**Cerinta:** Interfata intuitiva

**Solutii:**
- Onboarding 2 pasi (nume → create/join)
- Visual feedback (toast notifications, highlight drawer)
- Responsive design (mobil + desktop)
- Error messages

---

### 3.6 Maintainability

**Cerinta:** Cod usor de inteles

**Solutii:**
- Structura clara directoare (components/, config/)
- Naming conventions (PascalCase componente, camelCase functii)
- Separare concerns (UI/logic/communication)

---

## 4. Justificarea deciziilor

### 4.1 Client-Server separat

**Alternativa:** Monolith

**Decizie:** Separare

**Ratiune:** Vercel CDN pentru frontend, Render pentru WebSocket backend, deployment independent

---

### 4.2 Socket.IO

**Alternativa:** WebSocket nativ

**Decizie:** Socket.IO

**Ratiune:** Auto-reconnect built-in, room management simplu, fallback long-polling

---

### 4.3 In-Memory State

**Alternativa:** Database (PostgreSQL/MongoDB)

**Decizie:** In-Memory

**Ratiune:** State temporar, performanta <5ms vs ~50ms DB, zero config pentru MVP

**Cand migrare:** >200 users, user accounts, game history

---

## 5. Concluzii

Arhitectura Client-Server cu Socket.IO este adecvata pentru un joc multiplayer real-time. Deciziile (separare frontend-backend, Socket.IO, in-memory state) sunt justificate pentru scope academic si permit deployment gratuit (Vercel + Render). Cerintele non-functionale sunt adresate prin solutii precum: latenta <100ms, uptime 99.8%, validare server-side, design responsive.
