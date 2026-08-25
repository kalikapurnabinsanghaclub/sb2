import fs from 'fs';
import vm from 'vm';

const content = fs.readFileSync('./KNSDC-Monitor.html', 'utf-8');
const scriptRegex = /<script>([\s\S]*?)<\/script>/gi;
let match;
let count = 0;
while ((match = scriptRegex.exec(content)) !== null) {
  count++;
  try {
    new vm.Script(match[1]);
  } catch (err) {
    console.error(`Script block ${count} syntax error:`, err.message);
    process.exit(1);
  }
}
console.log(`Successfully parsed ${count} script tags!`);
