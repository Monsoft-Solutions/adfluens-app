import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import apiRoutes from './routes/api.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const isDev = process.env.NODE_ENV !== 'production';

// Middleware
app.use(cors({
  origin: isDev ? 'http://localhost:3000' : true,
  credentials: true
}));
app.use(express.json());

// API Routes
app.use('/api', apiRoutes);

// Serve static files in production
if (!isDev) {
  const distPath = path.join(__dirname, '..', 'dist');
  app.use(express.static(distPath));
  
  // Handle client-side routing
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  if (isDev) {
    console.log(`📦 API available at http://localhost:${PORT}/api`);
    console.log(`🖥️  Frontend dev server should run on http://localhost:3000`);
  }
});

