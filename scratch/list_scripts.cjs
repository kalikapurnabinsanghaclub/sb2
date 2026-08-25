const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'KNSDC-Monitor.html');
const html = fs.readFileSync(filePath, 'utf8');

const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
let match;
let count = 0;

while ((match = scriptRegex.exec(html)) !== null) {
  count++;
  if (match[0].includes('src=')) {
    console.log(`Script ${count}: External src="${match[0].match(/src="([^"]+)"/)?.[1]}"`);
    continue;
  }
  const code = match[1];
  const defs = [];
  const defRegex = /function\s+([a-zA-Z0-9_$]+)\s*\(/g;
  let defMatch;
  while ((defMatch = defRegex.exec(code)) !== null) {
    defs.push(defMatch[1]);
  }
  console.log(`Script ${count}: Inline, length=${code.length}, defined functions=${defs.length}`);
  if (defs.length > 0) {
    console.log("Sample functions:", defs.slice(0, 10));
  }
}
