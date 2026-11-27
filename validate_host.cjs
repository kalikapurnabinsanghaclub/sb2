const fs = require('fs');
const vm = require('vm');
const content = fs.readFileSync('KNSDC-Host.html', 'utf8');
const scriptRegex = /<script(?:\s+[^>]*)?>([\s\S]*?)<\/script>/gi;
let match, scriptIndex = 0;
while ((match = scriptRegex.exec(content)) !== null) {
  scriptIndex++;
  if (!match[1].trim()) continue;
  new vm.Script(match[1]);
}
console.log(`✅ All ${scriptIndex} scripts in KNSDC-Host.html passed JS syntax validation!`);
