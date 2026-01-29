# Installation Guide for Authentication System

## Server Setup

1. Navigate to the server directory:
```bash
cd server
```

2. Install the new dependencies:
```bash
npm install
```

This will install:
- `bcryptjs` - Password hashing
- `jsonwebtoken` - JWT token generation and verification
- `cors` - Cross-Origin Resource Sharing

3. (Optional) Set environment variables:
```bash
# Create a .env file in the server directory
JWT_SECRET=your-super-secret-key-here
FRONTEND_URL=http://localhost:5173
PORT=3001
```

4. Start the server:
```bash
npm start
```

## Client Setup

The client-side authentication components are already integrated. No additional dependencies are needed beyond what's already in the project.

## Running the Application

1. Start the server (from server directory):
```bash
npm start
```

2. Start the client (from client directory):
```bash
npm run dev
```

3. Open your browser to `http://localhost:5173`

## Testing the Authentication

### Register a New User
1. Click "Login / Register" button
2. Switch to "Register" mode
3. Enter username, email, and password
4. Click "Register"

### Login as Existing User
1. Click "Login / Register" button
2. Enter username and password
3. Click "Login"

### Play as Guest
1. Simply enter a username in the lobby
2. Create or join a room without logging in

## Troubleshooting

### Server won't start
- Make sure all dependencies are installed: `npm install`
- Check that port 3001 is not in use

### Login/Register not working
- Check browser console for errors
- Verify server is running on port 3001
- Check network tab for API responses

### Authentication state not persisting
- Check browser's localStorage
- Clear localStorage and try again
- Ensure cookies/storage is enabled in browser
