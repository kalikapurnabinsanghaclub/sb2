const fs = require('fs');

const content = fs.readFileSync('C:/Users/soura/.gemini/antigravity/scratch/sb2/KNSDC-Monitor.html', 'utf8');

// Find all script tags
const scriptRegex = /<script(?:\s+[^>]*)?>([\s\S]*?)<\/script>/gi;
let match;
let scriptIdx = 0;

while ((match = scriptRegex.exec(content)) !== null) {
  const scriptContent = match[1];
  if (scriptContent.trim().length > 100) {
    try {
      new Function(scriptContent);
      console.log(`Script ${scriptIdx}: Syntax OK (${scriptContent.length} bytes)`);
    } catch (err) {
      console.error(`Script ${scriptIdx}: SYNTAX ERROR!`, err.message);
      // find line number
      const lines = scriptContent.slice(0, 1500).split('\n');
      console.error('Preview:', lines.slice(0, 10).join('\n'));
    }
  }
  scriptIdx++;
}
