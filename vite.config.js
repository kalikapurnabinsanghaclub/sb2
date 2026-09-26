import { defineConfig } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Scan all root HTML files to bundle them as multi-page inputs
const htmlFiles = fs.readdirSync(__dirname).filter(f => f.endsWith('.html'));
const input = {};
htmlFiles.forEach(file => {
  const name = file.replace(/\.html$/, '');
  input[name] = path.resolve(__dirname, file);
});

export default defineConfig({
  build: {
    outDir: 'dist',
    rollupOptions: {
      input
    }
  },
  plugins: [
    {
      name: 'copy-lib-assets',
      closeBundle() {
        const libSrc = path.resolve(__dirname, 'lib');
        const libDest = path.resolve(__dirname, 'dist', 'lib');
        if (fs.existsSync(libSrc)) {
          fs.cpSync(libSrc, libDest, { recursive: true });
        }
      }
    }
  ]
});
