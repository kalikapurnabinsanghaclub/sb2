const fs = require('fs');
let c = fs.readFileSync('c:\\\\Users\\\\sourav pc\\\\Desktop\\\\kalikapur\\\\KNSDC-Monitor.html', 'utf8');

const regex = /if\s*\(monitorEmail\)\s*\{[\s\S]*?activeEventId\s*=\s*s\.activeEventId;\s*\}/;
const replacement = `if (monitorEmail) {
    if (monitorEmail.toLowerCase() === 'kalikapurnabinsanghaclub@gmail.com') {
      if (!activeEventId) activeEventId = s.activeEventId || (EVENTS[0] ? String(EVENTS[0].id) : null);
      
      const selWrap = document.getElementById('assigned-event-name')?.parentElement;
      const sel = document.getElementById('global-event-sel');
      if (selWrap) selWrap.style.display = 'none';
      if (sel) {
        sel.style.display = 'block';
        sel.style.width = '100%';
        sel.style.padding = '10px';
        sel.style.marginBottom = '10px';
        sel.style.borderRadius = '8px';
        sel.style.border = '1px solid var(--border)';
        sel.style.background = 'var(--s2)';
        sel.style.color = 'var(--text)';
        sel.style.fontWeight = '700';
        sel.onchange = (e) => {
          activeEventId = e.target.value;
          const ev = EVENTS.find(x => String(x.id) === activeEventId);
          if (ev) window.eventName = ev.name;
          renderGlobalEventSelector();
          syncEngine.notify();
        };
      }
    } else {
      const assignedEv = EVENTS.find(e =>
        Array.isArray(e.staff) && e.staff.map(x => (x || '').toLowerCase()).includes(monitorEmail.toLowerCase())
      );
      if (assignedEv && String(assignedEv.id) !== String(activeEventId)) {
        activeEventId = String(assignedEv.id);
        window.eventName = assignedEv.name;
      } else if (assignedEv) {
        activeEventId = String(assignedEv.id);
      } else {
        activeEventId = s.activeEventId || (EVENTS[0] ? String(EVENTS[0].id) : null);
      }
    }
  } else {
    activeEventId = s.activeEventId;
  }`;

c = c.replace(regex, replacement);
fs.writeFileSync('c:\\\\Users\\\\sourav pc\\\\Desktop\\\\kalikapur\\\\KNSDC-Monitor.html', c);
