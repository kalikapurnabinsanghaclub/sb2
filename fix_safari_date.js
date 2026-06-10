const fs = require('fs');
let c = fs.readFileSync('c:\\\\Users\\\\sourav pc\\\\Desktop\\\\kalikapur\\\\index.html', 'utf8');

c = c.replace(/const evEndObj = new Date\(\`\${ed}T\${et}:00\`\);/g, "const safeDateStr = ed.includes('-') ? ed.replace(/-/g, '/') : ed;\n          const evEndObj = new Date(`${safeDateStr} ${et}:00`);");

fs.writeFileSync('c:\\\\Users\\\\sourav pc\\\\Desktop\\\\kalikapur\\\\index.html', c);
