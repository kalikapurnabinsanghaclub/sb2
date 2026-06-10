const fs = require('fs');
let c = fs.readFileSync('c:\\\\Users\\\\sourav pc\\\\Desktop\\\\kalikapur\\\\KNSDC-Admin.html', 'utf8');

c = c.replace(/<label class="fl">End Date<\/label>/g, '<label class="fl">End Date *</label>');
c = c.replace(/<label class="fl">End Time<\/label>/g, '<label class="fl">End Time *</label>');

c = c.replace(/if \(!startTime\) \{ toast\('Start time is required!'\); return; \}/, 
  "if (!startTime) { toast('Start time is required!'); return; }\n  if (!endDate) { toast('End date is required!'); return; }\n  if (!endTime) { toast('End time is required!'); return; }");

c = c.replace(/if\(!name \|\| !org \|\| !venue \|\| !startDate \|\| !startTime\)/, 
  "if(!name || !org || !venue || !startDate || !startTime || !endDate || !endTime)");

fs.writeFileSync('c:\\\\Users\\\\sourav pc\\\\Desktop\\\\kalikapur\\\\KNSDC-Admin.html', c);
