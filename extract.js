const fs = require('fs');
const filename = process.argv[2] || 'KNSDC-Participant.html';
const html = fs.readFileSync(filename, 'utf8');
const scripts = html.match(/<script\b[^>]*>([\s\S]*?)<\/script>/gi);
let out = '';
if (scripts) {
  scripts.forEach((s) => {
    out += s.replace(/<script\b[^>]*>/i, '').replace(/<\/script>/i, '') + '\n';
  });
}
fs.writeFileSync('temp.js', out);
