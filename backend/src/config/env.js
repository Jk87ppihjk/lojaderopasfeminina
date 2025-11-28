import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  appUrl: process.env.APP_URL,
  backendUrl: process.env.BACKEND_URL,
  frontendUrl: process.env.FRONTEND_URL || '*',
  db: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  },
  jwtSecret: process.env.JWT_SECRET || 'fallback_secret',
  internalApiKey: process.env.INTERNAL_API_KEY,
  brevo: {
    apiKey: process.env.BREVO_API_KEY,
    senderEmail: process.env.BREVO_SENDER_EMAIL,
  },
  payment: {
    abacatePaySecret: process.env.ABACATEPAY_SECRET,
    mpAccessToken: process.env.MP_ACCESS_TOKEN,
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  }
};