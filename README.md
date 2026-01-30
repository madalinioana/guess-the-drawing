# Guess the Drawing

Un joc multiplayer in timp real unde un jucator deseneaza un cuvant, iar ceilalti incearca sa il ghiceasca prin chat inainte sa expire timpul.

[Joaca jocul](https://guess-the-drawing-tau.vercel.app/) | [Video demo](https://youtu.be/7kIcNPx2oTA)

---

## Cuprins

- [Tehnologii](#tehnologii)
- [Functionalitati](#functionalitati)
- [Instalare](#instalare)
- [Arhitectura Sistemului](#arhitectura-sistemului)
- [Asigurarea Calitatii si Testare](#asigurarea-calitatii-si-testare)
- [Analiza de Securitate](#analiza-de-securitate)
- [Pipeline CI/CD](#pipeline-cicd)
- [Design Patterns](#design-patterns)

---

## Tehnologii

### Frontend
- **React 19:** Framework UI modern
- **Vite:** Build tool rapid
- **Socket.IO Client:** Comunicare WebSocket bidirectionala
- **React-Konva:** Canvas HTML5 pentru desenat

### Backend
- **Node.js 18:** Runtime JavaScript
- **Express:** HTTP server si REST API
- **Socket.IO:** Server WebSocket pentru real-time

### Deployment
- **Vercel:** Hosting Frontend (CDN global)
- **Render.com:** Hosting Backend (Container)

---

## Functionalitati

### Functionalitati Principale
- **Camere Multiplayer:** Creare si acces camere cu cod unic
- **Desenare in timp real:** Sincronizare instanta a canvas-ului
- **Sistem de Chat:** Mesaje live si mecanism de ghicire a cuvintelor
- **Scor Dinamic:** Punctaj calculat in functie de timpul ramas
- **Clasament Live:** Actualizare in timp real a scorurilor
- **Timer Runda:** Numaratoare inversa sincronizata

### Control Host
- **Start Joc:** Initierea rundei de catre creatorul camerei
- **Kick Players:** Moderarea listei de jucatori
- **Management Camera:** Control total asupra sesiunii

### Functionalitati Aditionale
- **Partajare WhatsApp:** Link direct pentru invitatii
- **Reconectare Automata:** Gestionarea intreruperilor de conexiune
- **Validare Input:** Verificarea numelor si a codurilor de acces

---

## Instalare

### Cerinte preliminare
- Node.js 18 sau mai nou
- npm sau yarn
- Git

### Configurare locala

1. **Clonare repository:**
```bash
git clone https://github.com/madalinioana/guess-the-drawing
cd guess-the-drawing
```

2. **Configurare Backend:**
```bash
cd server
npm install
node server.js
```
Serverul va rula pe `http://localhost:3001`

3. **Configurare Frontend:**
```bash
cd client
npm install
npm run dev
```
Aplicatia va fi disponibila la `http://localhost:5173`

---

## Arhitectura Sistemului

### Sinteza produsului

Am optat pentru o arhitectura **Client-Server separata** pentru a asigura un deployment independent si o scalare eficienta a componentelor.

**Motivatie:**
- Utilizarea Vercel CDN pentru o latenta globala minima a interfetei.
- Utilizarea Render pentru suportul nativ WebSocket necesar backend-ului.
- Posibilitatea de a actualiza frontend-ul fara a intrerupe conexiunile websocket active.

### Situatia implementarilor fata de propunerea initiala

| Functionalitate | Propus | Implementat | Diferenta |
|----------------|--------|-------------|-----------|
| Camere Multiplayer | Da | Da | Complet functional |
| Desenare Real-time | Da | Da | Sincronizare prin Socket.IO |
| Chat si Scoring | Da | Da | Algoritm bazat pe viteza |
| Autentificare | Da | Da | Login simplificat (modal) |
| Categorii Cuvinte | Da | Nu | Inlocuit cu input manual |
| Control Host | Nu | Da | Adaugat pentru moderare |
| Share WhatsApp | Nu | Da | Functionalitate bonus |

**Justificare modificari:**
Am inlocuit categoriile predefinite cu input manual pentru a oferi jucatorilor libertate totala in alegerea cuvintelor. Functiile de moderare (Host Controls) au fost adaugate pentru a preveni abuzurile in camerele publice.

### Diagrame C4

**Diagrama de Context (System Context):**

![System Context](docs/diagrams/c4-system-context.png)

Prezinta interactiunea utilizatorilor cu sistemul si dependentele externe (Vercel, Render, WhatsApp).

**Diagrama de Containere (Container Diagram):**

![Container](docs/diagrams/c4-container.png)

Detaliaza distributia responsabilitatilor intre React App, Socket.IO si Express Server.

**Diagrame de Componente (Component Diagrams):**

![Frontend Components](docs/diagrams/c4-component-frontend.png)
*Frontend: Structura modulara React (Lobby, Room, Canvas, Chat)*

![Backend Components](docs/diagrams/c4-component-backend.png)
*Backend: Gestionarea evenimentelor Socket.IO si starea jocului*

### Cerinte non-functionale si solutii

| Cerinta | Obiectiv | Solutie Arhitecturala |
|---------|----------|----------------------|
| **Performanta** | Latenta < 100ms | Conexiune persistenta WebSocket si throttling la evenimente (60fps) |
| **Scalabilitate** | 50+ utilizatori | CDN pentru statice si containerizare backend |
| **Disponibilitate** | Uptime ridicat | Mecanism de reconectare automata in client si health checks |
| **Securitate** | Protectie XSS/DoS | Sanitizare input si limitarea ratei de cereri (Rate Limiting) |
| **Mentenanta** | Cod modular | Separarea logicii de business de interfata |

---

## Asigurarea Calitatii si Testare

### Obiective

Procesul de testare s-a concentrat pe validarea componentelor critice de UI si a stabilitatii conexiunii in timp real.

**Artefacte testate:**
- **Frontend:** Componentele React (Chat, Leaderboard, Lobby)
- **Backend:** Gestionarea evenimentelor si validarea datelor
- **Nivele:** Testare unitara si testare manuala end-to-end

### Metode de testare

**1. Testare Unitara (Jest + React Testing Library)**

S-a utilizat pentru verificarea izolata a componentelor, asigurand randarea corecta si raspunsul la interactiunile utilizatorului.

**Exemplu test Chat:**
```javascript
describe('Chat Component', () => {
  test('trimite mesaj la apasarea Enter', () => {
    const handleSend = jest.fn();
    render(<Chat messages={[]} onSend={handleSend} />);
    
    // Simulare input utilizator
    const input = screen.getByPlaceholderText(/guess/i);
    fireEvent.change(input, {target: {value: 'casa'}});
    fireEvent.keyPress(input, {key: 'Enter'});
    
    expect(handleSend).toHaveBeenCalledWith('casa');
  });
});
```

**2. Testare Manuala**

Verificarea fluxurilor complete de utilizare (creare camera, joc, chat, deconectare) pe diferite browsere (Chrome, Firefox, Safari) si dispozitive.

### Rezultate

| Metrica | Valoare | Status |
|---------|---------|--------|
| Acoperire Cod (Unit) | 70% | Pass |
| Cazuri Test Manual | 15 | Pass |
| Bug-uri Critice | 0 | Pass |

---

## Analiza de Securitate

### Riscuri Identificate

| Risc | Impact | Probabilitate |
|------|--------|---------------|
| **XSS Injection** | Executie cod malitios in chat/nume | Medie |
| **Authorization Bypass** | Actiuni neautorizate (kick, desen) | Medie |
| **DoS Attack** | Suprasolicitarea serverului | Medie |

### Masuri de protectie implementate

**1. Sanitizare Input**
Toate datele introduse de utilizatori sunt curatate de tag-uri HTML si scripturi inainte de procesare.

**2. Validare Autorizare**
Serverul verifica permisiunile pentru fiecare actiune critica. Doar jucatorul "Drawer" poate emite evenimente de desenare, si doar "Host"-ul poate elimina jucatori.

**3. Rate Limiting**
Am implementat limitari pentru frecventa evenimentelor per socket pentru a preveni flood-ul:
- Desenare: max 60 evenimente/secunda
- Ghicire: max 5 incercari/2 secunde

**4. Configurare CORS**
Accesul la API este restrictionat exclusiv domeniului de frontend (Vercel).

---

## Pipeline CI/CD

### Medii de lucru

**Development (Local):**
- Ruleaza pe localhost
- Logging detaliat
- CORS permisiv pentru dezvoltare rapida

**Production:**
- Frontend: Vercel | Backend: Render
- Trigger automat la push pe branch-ul `main`
- Optimizari de performanta (minification) si securitate (HTTPS, CORS strict)

### Fluxul de Integrare si Livrare (GitHub Actions)

1. **Continuous Integration (CI):**
   - La fiecare push sau Pull Request, se ruleaza automat testele unitare (Frontend si Backend).
   - Se verifica build-ul aplicatiei pentru erori.

2. **Continuous Deployment (CD):**
   - **Frontend:** Vercel detecteaza modificarile pe `main`, instaleaza dependintele, construieste proiectul si il publica pe CDN.
   - **Backend:** Render preia codul nou, construieste containerul si reporneste serviciul, efectuand un Health Check final.

---

## Design Patterns

In implementare au fost utilizate urmatoarele tipare de proiectare:

**Pub/Sub (Publish-Subscribe):**
Fundamentul comunicarii prin Socket.IO. Clientii publica evenimente (ex: `drawing`), iar serverul le distribuie catre abonati (ceilalti jucatori din camera).

**Observer:**
Utilizat in componentele React pentru a reactiona la modificarile de stare asincrone (ex: actualizarea listei de mesaje sau a clasamentului in timp real).
