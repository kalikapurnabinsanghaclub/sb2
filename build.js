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

// Create directory aliases for clean URLs on static hosting
const staticAliases = [
  { src: 'KNSDC-Monitor.html', dir: 'monitor' },
  { src: 'KNSDC-Judge.html', dir: 'judge' },
  { src: 'KNSDC-Participant.html', dir: 'participant' }
];

staticAliases.forEach(({ src, dir }) => {
  const srcPath = path.join(__dirname, src);
  if (fs.existsSync(srcPath)) {
    const targetDir = path.join(dist, dir);
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
    fs.copyFileSync(srcPath, path.join(targetDir, 'index.html'));
    fs.copyFileSync(srcPath, path.join(dist, `${dir}.html`));
  }
});

console.log('✅ [Build] Successfully generated dist/ directory with clean static aliases!');
