const allowedOrigins = [
  'https://guess-the-drawing-tau.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000'
];

if (process.env.NODE_ENV === 'production') {
  allowedOrigins.push(/vercel\.app$/);
}

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }

    const allowedSpecificOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'https://guess-the-drawing-tau.vercel.app'
    ];

    const isAllowed =
      allowedSpecificOrigins.includes(origin) ||
      origin.endsWith('.vercel.app');

    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`BLOCKED BY CORS: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

module.exports = corsOptions;
