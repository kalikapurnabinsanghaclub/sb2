const fs = require('fs');
let c = fs.readFileSync('c:\\\\Users\\\\sourav pc\\\\Desktop\\\\kalikapur\\\\index.html', 'utf8');

const regexEvents = /EVENTS = uniqueEvents\.filter\(ev => \{\s*const d = ev\.startDate \|\| ev\.date \|\| "";\s*const evDate = d\.includes\(' '\) \? d\.split\(' '\)\[0\] : d;\s*return evDate >= todayStr;\s*\}\)/;

const newEventsLogic = `EVENTS = uniqueEvents.filter(ev => {
          const ed = ev.endDate || ev.startDate || ev.date || "";
          const et = ev.endTime || ev.startTime || ev.time || "23:59";
          if (!ed) return true;
          const evEndObj = new Date(\`\${ed}T\${et}:00\`);
          if (isNaN(evEndObj.getTime())) {
            const evDate = ed.includes(' ') ? ed.split(' ')[0] : ed;
            return evDate >= todayStr;
          }
          return evEndObj >= new Date();
        })`;

c = c.replace(regexEvents, newEventsLogic);

const regexPrev = /PREV = uniqueEvents\.filter\(ev => \{\s*const d = ev\.startDate \|\| ev\.date \|\| "";\s*const evDate = d\.includes\(' '\) \? d\.split\(' '\)\[0\] : d;\s*return evDate && evDate < todayStr;\s*\}\)/;

const newPrevLogic = `PREV = uniqueEvents.filter(ev => {
          const ed = ev.endDate || ev.startDate || ev.date || "";
          const et = ev.endTime || ev.startTime || ev.time || "23:59";
          if (!ed) return false;
          const evEndObj = new Date(\`\${ed}T\${et}:00\`);
          if (isNaN(evEndObj.getTime())) {
            const evDate = ed.includes(' ') ? ed.split(' ')[0] : ed;
            return evDate && evDate < todayStr;
          }
          return evEndObj < new Date();
        })`;

c = c.replace(regexPrev, newPrevLogic);

fs.writeFileSync('c:\\\\Users\\\\sourav pc\\\\Desktop\\\\kalikapur\\\\index.html', c);
