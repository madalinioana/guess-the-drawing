# Authentication System Documentation

## Overview
The authentication system allows players to either play as guests or create an account to save their progress. Both registered users and guests have full access to game functionality.

## Features

### For Users
- **Login/Register Modal**: Clean modal interface matching the app's design
- **Guest Play**: Users can play without an account
- **Persistent Sessions**: Logged-in users stay authenticated across browser sessions
- **Username Auto-fill**: Registered users have their username automatically filled

### Components

#### AuthModal.jsx
- Handles both login and registration
- Client-side validation
- Switches between login/register modes
- Form error handling

#### AuthButton.jsx
- Shows login button for guests
- Displays user info and logout for authenticated users
- Positioned in top-right of pages

#### AuthContext.jsx
- Manages authentication state
- Provides auth methods throughout the app
- Handles localStorage persistence

#### authService.js
- API calls for login, register, verify
- Centralized authentication logic

### Server Endpoints

#### POST /auth/register
- Registers a new user
- Validates username (min 3 chars), email, password (min 6 chars)
- Returns JWT token and user data

#### POST /auth/login
- Authenticates existing user
- Returns JWT token and user data

#### POST /auth/verify
- Verifies JWT token validity
- Returns user data if token is valid

### Security Features
- Password hashing with bcryptjs (10 salt rounds)
- JWT tokens with 7-day expiration
- Protected endpoints
- Input validation

### Guest vs Registered User

**Guests can:**
- Create and join rooms
- Play the full game
- Participate in chat
- View leaderboards

**Registered users additionally get:**
- Persistent username
- Ability to save stats (future feature)
- Single sign-on across sessions

## Usage

### Playing as Guest
1. Enter any username in the lobby
2. Create or join a room
3. Play normally

### Playing as Registered User
1. Click "Login / Register" button
2. Register a new account or login
3. Username is automatically filled
4. Create or join a room

### Logout
Click the "Logout" button in the top-right corner when logged in.

## Design Principles
- Matches existing "Comic Sans MS" retro design
- Bright colors (#ffff66, #00ff00, #0066ff)
- Bold black borders and box shadows
- Non-intrusive authentication flow
- Guest-friendly approach

## Future Enhancements
- Persistent user statistics and leaderboards
- User profiles
- Friend system
- Match history
- Database integration (currently using in-memory storage)
