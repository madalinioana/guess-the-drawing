# Plan de testare - Guess the Drawing

## 1. Obiectivele testarii

### Artefacte testate si nivele

**Frontend (React):**
- Componente UI: Chat, Leaderboard, Lobby, Header
- Nivel: Unit testing (Jest + React Testing Library)

**Backend (Node.js):**
- Socket.IO event handlers
- Nivel: Manual testing

**Coverage target:** 70% unit tests

---

## 2. Procesul testarii

### Integrare in SDLC

| Faza SDLC | Metoda testare | Cand se aplica |
|-----------|----------------|----------------|
| Development | Unit tests | La fiecare save (watch mode) |
| Pre-commit | Unit tests | Inainte de commit |
| CI/CD | Automated tests | La push pe GitHub (GitHub Actions) |
| Pre-deployment | Manual tests | Inainte de merge pe main |
| Post-deployment | Smoke tests | Dupa deployment production |

---

## 3. Metodele testarii

### 3.1 Unit Testing (Jest + React Testing Library)

**Artefacte:** Componente React UI

**Justificare:** Testeaza comportamentul componentelor izolat, asigura ca UI se randeaza corect si interactioneaza cu user input.

**Exemple:**

```javascript
describe('Chat Component', () => {
  test('renders message list', () => {
    const messages = [{id: 1, sender: 'User1', text: 'Hello'}];
    render(<Chat messages={messages} onSend={jest.fn()} />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  test('sends message on Enter', () => {
    const handleSend = jest.fn();
    render(<Chat messages={[]} onSend={handleSend} />);
    
    const input = screen.getByPlaceholderText(/guess/i);
    fireEvent.change(input, {target: {value: 'casa'}});
    fireEvent.keyPress(input, {key: 'Enter'});
    
    expect(handleSend).toHaveBeenCalledWith('casa');
  });
});
```

---

### 3.2 Manual Testing

**Artefacte:** Flow-uri complete end-to-end

**Justificare:** Verifica functionalitatea aplicatiei in conditii reale, include testare pe dispozitive multiple si browsere diferite.

**Checklist functional:**
- [ ] Create room cu nume valid
- [ ] Join room cu cod valid (8 caractere)
- [ ] Desenare smooth pe canvas
- [ ] Ghicire corecta (case insensitive)
- [ ] Timer countdown functional
- [ ] Leaderboard update la scor
- [ ] Kick player (doar host)
- [ ] WhatsApp share functional
- [ ] Disconnect handling (reconnect automat)

**Non-functional:**
- [ ] Responsive pe mobil (320px, 768px, 1024px)
- [ ] Touch events pe canvas (mobil)
- [ ] Latenta <100ms (drawing sync)
- [ ] No memory leaks (Chrome DevTools)

**Browsere testate:** Chrome, Firefox, Safari, Edge

---

## 4. Rezultatele testarii

### 4.1 Metrici

| Metrica | Valoare | Target | Status |
|---------|---------|--------|--------|
| Unit test coverage (frontend) | 70% | 70% | ✅ Pass |
| Manual test cases | 15 | 15 | ✅ Pass |
| Critical bugs | 0 | 0 | ✅ Pass |
| Browsere suportate | 4/4 | 4 | ✅ Pass |

### 4.2 Observatii

**Bugs gasite si rezolvate:**
1. Canvas clear incomplet la runda noua → Fixed prin force re-render
2. Rate limiting bypass prin multiple tabs → Acceptat (low priority pentru MVP)
3. Reconnect nu restaureaza starea exacta → User trebuie rejoin manual (limitare arhitecturala)

**Issues nerezolvate (low priority):**
- Performance scade la >100 strokes pe canvas (rar in practica)
- Cold start 30s pe Render free tier (acceptabil)

### 4.3 Rezultate teste

**Frontend (Jest):**
```
PASS  src/components/__tests__/Chat.test.jsx
PASS  src/components/__tests__/Leaderboard.test.jsx
PASS  src/components/__tests__/Header.test.jsx
PASS  src/components/__tests__/Lobby.test.jsx

Test Suites: 4 passed, 4 total
Tests: 18 passed, 18 total
Time: 3.241s
Coverage: 70.5%
```

---

## 5. Concluzii

Strategia de testare cu focus pe unit testing frontend si manual testing exhaustiv s-a dovedit adecvata pentru MVP academic. Coverage 70% ofera incredere in stabilitatea componentelor critice UI, iar testarea manuala asigura functionalitatea flow-urilor end-to-end.
