# C4 Architecture Diagrams (Stage 3)

## Level 1: System Context

Această diagramă arată sistemul "Guess the Drawing" ca pe o cutie neagră și utilizatorii care interacționează cu el.

```mermaid
C4Context
  title System Context Diagram - Guess the Drawing
  
  Person(player, "Player", "A casual gamer wanting to play and socialize.")
  
  System(game_system, "Guess the Drawing", "Our real-time drawing and guessing game platform.")

  Rel(player, game_system, "Plays game, manages account, creates lobbies", "Web Browser (HTTPS)")
  Rel(game_system, player, "Serves game, authenticates, streams real-time updates", "HTTPS + WebSockets (WSS)")
