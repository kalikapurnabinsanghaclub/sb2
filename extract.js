const fs = require('fs');
const html = fs.readFileSync('KNSDC-Participant.html', 'utf8');
const scripts = html.match(/<script\b[^>]*>([\s\S]*?)<\/script>/gi);
let out = '';
if (scripts) {
  scripts.forEach((s) => {
    out += s.replace(/<script\b[^>]*>/i, '').replace(/<\/script>/i, '') + '\n';
  });
}
fs.writeFileSync('temp.js', out);
