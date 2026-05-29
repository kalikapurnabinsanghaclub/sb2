const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'index.html');
const content = fs.readFileSync(filePath, 'utf8');

// Extract script content
const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
let match;
let count = 0;

while ((match = scriptRegex.exec(content)) !== null) {
  count++;
  const scriptText = match[1];
  try {
    new Function(scriptText);
    console.log(`Script ${count} parsed successfully.`);
  } catch (err) {
    console.error(`Error in Script ${count}:`, err.message);
    // Find line number in original file
    const offset = match.index;
    const linesBefore = content.substring(0, offset).split('\n').length;
    console.error(`Approximate line offset in HTML: ${linesBefore}`);
    
    // Print the surrounding lines of the error
    const lines = scriptText.split('\n');
    console.log("Error details:", err);
  }
}
