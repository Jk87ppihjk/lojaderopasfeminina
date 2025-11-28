import express from 'express';
import cors from 'cors';
import { config } from './config/env.js';
import { checkConnection } from './config/database.js';
import routes from './routes.js';

const app = express();

// Middleware
app.use(cors({ origin: config.frontendUrl }));
app.use(express.json());

// Routes
app.use('/api', routes);

// Start
app.listen(config.port, async () => {
  console.log(`🚀 Server running on port ${config.port}`);
  await checkConnection();
});