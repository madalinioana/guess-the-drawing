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
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) {
      return callback(null, true);
    }

    // Check if origin is in allowedOrigins or matches pattern
    const isAllowed = allowedOrigins.some(allowed => {
      if (typeof allowed === 'string') {
        return allowed === origin;
      }
      // RegExp pattern
      return allowed.test(origin);
    });

    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('CORS not allowed'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

module.exports = corsOptions;
