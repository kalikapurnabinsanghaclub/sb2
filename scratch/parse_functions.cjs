const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'KNSDC-Monitor.html');
const html = fs.readFileSync(filePath, 'utf8');

// Extract inline javascript content
const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
let match;
let jsCode = '';

while ((match = scriptRegex.exec(html)) !== null) {
  if (match[0].includes('src=')) continue;
  jsCode += match[1] + '\n';
}

// Find all defined functions: function name(...) or const name = (...) =>
const definedFuncs = new Set();
const defRegex = /function\s+([a-zA-Z0-9_$]+)\s*\(/g;
let defMatch;
while ((defMatch = defRegex.exec(jsCode)) !== null) {
  definedFuncs.add(defMatch[1]);
}

// Find all function calls: name(...)
const calledFuncs = new Set();
const callRegex = /\b([a-zA-Z0-9_$]+)\s*\(/g;
let callMatch;
while ((callMatch = callRegex.exec(jsCode)) !== null) {
  calledFuncs.add(callMatch[1]);
}

// Standard browser globals, libraries, and built-ins to ignore
const ignored = new Set([
  'Function', 'eval', 'parseInt', 'parseFloat', 'isNaN', 'isFinite', 'decodeURI', 'encodeURI', 'decodeURIComponent', 'encodeURIComponent',
  'alert', 'confirm', 'prompt', 'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval', 'fetch',
  'Set', 'Map', 'WeakSet', 'WeakMap', 'Date', 'RegExp', 'Error', 'TypeError', 'ReferenceError', 'RangeError',
  'Object', 'Function', 'Boolean', 'Symbol', 'Error', 'Number', 'Math', 'String', 'Array', 'JSON', 'Promise', 'Proxy', 'Reflect',
  'console', 'document', 'window', 'navigator', 'location', 'history', 'screen',
  'require', 'import', 'export', 'define',
  'createObjectURL', 'revokeObjectURL',
  'ArrayFrom', 'SetInterval', 'SetTimeout',
  'XLSX', 'jsPDF', 'html2canvas', 'Chart', 'LocalSync', 'staffAudio',
  'Audio', 'FileReader', 'Image', 'Option',
  'parseInt', 'parseFloat', 'isNaN', 'isFinite',
  'String', 'Number', 'Boolean', 'Object', 'Array', 'Date', 'RegExp', 'Math', 'JSON',
  'toString', 'valueOf', 'toLocaleString',
  'getReader', 'readAsDataURL',
  'checkAuth', 'initIdentity', 'vmCalcRemaining', 'submitVerification', 'uploadJudgeAvatar',
  'renderDashboard', 'renderOnStage', 'renderParticipantsTable', 'loadScorePanel',
  'syncSlider', 'syncNum', 'clampScore', 'saveScores', 'clearScorePanel',
  'searchParticipant', 'insMention', 'sendMsg', 'toggleSOS', 'toggleTheme',
  'openEditModal', 'closeEditModal', 'saveModalScores', 'modalSyncSlider',
  'modalSyncNum', 'modalClampScore', 'toggleFloatChat', 'sendFloatMsg',
  'downloadEventReportPDF', 'downloadEventReportExcel',
  'require', 'module', 'exports',
  'FormData', 'Blob', 'Headers', 'Request', 'Response',
  'click', 'focus', 'blur', 'submit', 'reset',
  'WebSocket', 'EventSource', 'URL', 'URLSearchParams',
  'Notification', 'Worker', 'SharedWorker', 'ServiceWorker',
  'requestAnimationFrame', 'cancelAnimationFrame',
  'push', 'pop', 'shift', 'unshift', 'splice', 'slice', 'concat', 'join', 'split', 'replace', 'match', 'search',
  'test', 'exec', 'forEach', 'map', 'filter', 'reduce', 'reduceRight', 'some', 'every', 'find', 'findIndex',
  'indexOf', 'lastIndexOf', 'includes', 'keys', 'values', 'entries', 'hasOwnProperty', 'isPrototypeOf',
  'propertyIsEnumerable', 'toLocaleString', 'toString', 'valueOf',
  'Uint8Array', 'Int8Array', 'Uint16Array', 'Int16Array', 'Uint32Array', 'Int32Array', 'Float32Array', 'Float64Array',
  'ArrayBuffer', 'DataView',
  'showUnauthorizedOverlay',
  'renderDashboardHtml',
]);

const missing = [];
for (const f of calledFuncs) {
  if (!definedFuncs.has(f) && !ignored.has(f)) {
    // Check if it's a method call like obj.func( or similar
    // We can check if the character before the function name is a dot.
    const escaped = f.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const dotCheckRegex = new RegExp(`\\.\\s*${escaped}\\s*\\(`, 'g');
    if (dotCheckRegex.test(jsCode)) {
      continue; // It is a method call
    }
    missing.push(f);
  }
}

console.log("=== Defined Functions Count ===", definedFuncs.size);
console.log("=== Called Functions Count ===", calledFuncs.size);
console.log("=== Potential Missing Function Definitions ===");
console.log(missing);
