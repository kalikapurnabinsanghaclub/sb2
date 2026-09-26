import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dist = path.join(__dirname, 'dist');
if (!fs.existsSync(dist)) {
  fs.mkdirSync(dist, { recursive: true });
}

// Copy files and essential asset folders to dist with minimal memory footprint
const allowedExts = ['.html', '.css', '.js', '.json', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.txt', '.xml'];
const allowedDirs = ['lib', 'assets', 'parsers', 'sections', 'cluball'];

const entries = fs.readdirSync(__dirname);
entries.forEach(item => {
  if (['dist', 'node_modules', '.git'].includes(item)) return;
  const src = path.join(__dirname, item);
  const dest = path.join(dist, item);
  try {
    const stat = fs.statSync(src);
    if (stat.isFile()) {
      const ext = path.extname(item).toLowerCase();
      if (allowedExts.includes(ext) || item.endsWith('.html')) {
        fs.copyFileSync(src, dest);
      }
    } else if (stat.isDirectory() && allowedDirs.includes(item)) {
      fs.cpSync(src, dest, { recursive: true });
    }
  } catch (e) {
    console.warn('[build] Skipping:', item, e.message);
  }
});

console.log('✅ [Build] Successfully generated dist/ directory for Render deployment!');
