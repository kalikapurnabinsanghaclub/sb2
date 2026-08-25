const fs = require('fs');
const path = require('path');

const dirPath = path.join(__dirname, '..');
const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.html'));

files.forEach(file => {
  const filePath = path.join(dirPath, file);
  const content = fs.readFileSync(filePath, 'utf8');
  
  const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  let count = 0;
  
  while ((match = scriptRegex.exec(content)) !== null) {
    count++;
    if (match[0].includes('src=')) continue;
    const scriptText = match[1];
    try {
      new Function(scriptText);
    } catch (err) {
      console.error(`Error in file ${file}, Script ${count}:`, err.message);
      const offset = match.index;
      const linesBefore = content.substring(0, offset).split('\n').length;
      console.error(`Approximate line offset in HTML: ${linesBefore}`);
    }
  }
});
console.log("Syntax check on all HTML files completed.");
