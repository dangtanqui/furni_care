import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join, extname } from 'path';
import { readFileSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the dist directory
const distPath = join(__dirname, 'dist');

// Check if dist directory exists
if (!existsSync(distPath)) {
  console.error(`Error: dist directory not found at ${distPath}`);
  console.error('Please run "npm run build" first to build the application.');
  process.exit(1);
}

app.use(express.static(distPath, {
  // Don't set index to false, let express.static handle it
  // But we'll override with our catch-all route
}));

// History API fallback: serve index.html for all routes
// This allows React Router to handle client-side routing
app.get('*', (req, res) => {
  // Don't serve index.html for:
  // 1. API routes (should be proxied or handled separately)
  // 2. Files with extensions (static assets like .js, .css, .svg, etc.)
  const hasExtension = extname(req.path) !== '';
  const isApiRoute = req.path.startsWith('/api');
  
  if (isApiRoute || hasExtension) {
    return res.status(404).send('Not found');
  }
  
  // Serve index.html for all other routes (SPA routes)
  const indexPath = join(distPath, 'index.html');
  
  if (!existsSync(indexPath)) {
    console.error(`Error: index.html not found at ${indexPath}`);
    return res.status(500).send('Internal server error: index.html not found');
  }
  
  try {
    const indexContent = readFileSync(indexPath, 'utf-8');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(indexContent);
  } catch (error) {
    console.error('Error serving index.html:', error);
    res.status(500).send('Internal server error');
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Serving static files from: ${distPath}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

