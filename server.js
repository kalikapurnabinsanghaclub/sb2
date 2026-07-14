import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the Vite build directory (dist folder)
app.use(express.static(path.join(__dirname, 'dist')));

// API Routes can be added here in the future
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running on Render!' });
});

// Catch-all route to serve index.html for Single Page Applications (SPA)
app.get(/(.*)/, (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
