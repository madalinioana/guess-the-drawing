const allowedOrigins = [
  'https://guess-the-drawing-tau.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000'
];

// Add preview deployments pattern
if (process.env.NODE_ENV === 'production') {
  allowedOrigins.push(/vercel\.app$/);
}

const corsOptions = {
  origin: (origin, callback) => {
    // 1. Permite cereri fără origine (ex: aplicații mobile, Postman, server-to-server)
    if (!origin) {
      return callback(null, true);
    }

    // 2. Lista cu domeniile fixe (Localhost + Producție explicită)
    const allowedSpecificOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'https://guess-the-drawing-tau.vercel.app' // Producția ta
    ];

    // 3. LOGICA PRINCIPALĂ:
    // Verificăm dacă e în lista fixă SAU dacă este un subdomeniu Vercel (pentru Stage/Preview)
    const isAllowed = 
      allowedSpecificOrigins.includes(origin) || 
      origin.endsWith('.vercel.app'); // <--- Aici e magia care rezolvă problema ta

    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`BLOCKED BY CORS: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Am adăugat metode comune
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

module.exports = corsOptions;
