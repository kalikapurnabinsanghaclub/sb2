const fs = require('fs');
const html = fs.readFileSync('KNSDC-Participant.html', 'utf-8');
const { JSDOM } = require('jsdom');
const dom = new JSDOM(html);
const text = dom.window.document.body.textContent;
if (text.includes('win.document.close();')) {
    console.log('BUG DETECTED: JS rendered as text!');
} else {
    console.log('NO BUG in JSDOM.');
}
