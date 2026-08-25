const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'KNSDC-Monitor.html');
const content = fs.readFileSync(filePath, 'utf8');

const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
let match;
let count = 0;

while ((match = scriptRegex.exec(content)) !== null) {
  count++;
  const scriptText = match[1];
  // Skip external scripts
  if (match[0].includes('src=')) continue;
  try {
    new Function(scriptText);
    console.log(`Script ${count} parsed successfully.`);
  } catch (err) {
    console.error(`Error in Script ${count}:`, err.message);
    const offset = match.index;
    const linesBefore = content.substring(0, offset).split('\n').length;
    console.error(`Approximate line offset in HTML: ${linesBefore}`);
    console.log("Error details:", err);
  }
}
