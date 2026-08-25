import sys
sys.stdout.reconfigure(encoding='utf-8')
path = r'c:\Users\sourav pc\Desktop\kalikapur\KNSDC-Monitor.html'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Replace the Subjects settings tab HTML with the upgraded version
old_subjects_html = '''    <div id="st-subjects">
      <div class="g2">
        <div class="card glass-card">
          <div class="card-header" style="margin-bottom:20px">
            <div class="card-title">Scoring Subjects</div>
            <button class="btn btn-sm" style="background:var(--amber2);color:#fff;font-weight:800;border-radius:10px" onclick="openSubjectModal()">＋ ADD SUBJECT</button>
          </div>
          <div id="subjects-list" style="display:flex;flex-direction:column;gap:12px"></div>
        </div>
        <div class="card glass-card card-hover" style="background:linear-gradient(135deg, rgba(217,119,6,0.03), transparent)">
          <div class="card-title" style="margin-bottom:20px;display:flex;align-items:center;gap:8px">
             <span style="color:var(--amber2)">📋</span> Score Sheet Preview
          </div>
          <div id="score-sheet-preview"></div>
          <div style="margin-top:20px;font-size:11px;color:var(--text-muted);text-align:center">
             This is how the scoring interface appears to the judges.
          </div>
        </div>
      </div>
    </div>'''

new_subjects_html = '''    <div id="st-subjects">
      <!-- QUICK-PICK TEMPLATE BAR -->
      <div class="card glass-card" style="margin-bottom:20px;background:linear-gradient(135deg, rgba(217,119,6,0.04), transparent);border:1.5px dashed var(--amber2)30">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
          <div style="display:flex;align-items:center;gap:8px">
            <span style="font-size:1.3rem">⚡</span>
            <span style="font-weight:800;font-size:14px;color:var(--text);letter-spacing:0.5px">Quick Pick — Tap to Add</span>
          </div>
          <button class="btn btn-sm btn-ghost" onclick="openSubjectModal()" style="font-weight:700;border:1.5px solid var(--amber2);color:var(--amber2);border-radius:10px">＋ Custom Subject</button>
        </div>
        <div id="template-chips" style="display:flex;flex-wrap:wrap;gap:8px"></div>
      </div>

      <div class="g2">
        <!-- ACTIVE SUBJECTS LIST -->
        <div class="card glass-card">
          <div class="card-header" style="margin-bottom:20px">
            <div class="card-title" style="display:flex;align-items:center;gap:8px">
              <span style="color:var(--amber2)">⚪</span> Active Subjects
              <span id="subj-count" class="badge b-amber" style="font-size:10px;padding:2px 8px">0</span>
            </div>
            <button class="btn btn-sm btn-ghost" onclick="clearAllSubjects()" style="color:#ef4444;font-weight:700;font-size:11px">🗑 Clear All</button>
          </div>
          <div id="subjects-list" style="display:flex;flex-direction:column;gap:12px"></div>
          <div id="subjects-empty" style="display:none;text-align:center;padding:30px;color:var(--text-muted);font-size:13px">
            No subjects added yet. Pick from templates above or create a custom one!
          </div>
        </div>

        <!-- SCORE SHEET PREVIEW -->
        <div class="card glass-card card-hover" style="background:linear-gradient(135deg, rgba(217,119,6,0.03), transparent)">
          <div class="card-title" style="margin-bottom:20px;display:flex;align-items:center;gap:8px">
             <span style="color:var(--amber2)">📋</span> Score Sheet Preview
          </div>
          <div id="score-sheet-preview"></div>
          <div style="margin-top:20px;font-size:11px;color:var(--text-muted);text-align:center">
             This is how the scoring interface appears to the judges.
          </div>
        </div>
      </div>
    </div>'''

content = content.replace(old_subjects_html, new_subjects_html)

# 2. Replace the subject JS functions with the upgraded version
old_js = '''function openSubjectModal(id=null){
  editingSubjId=id;
  document.getElementById('subj-modal-title').textContent=id?'Edit Subject':'Add Subject';
  if(id){const s=subjects.find(x=>x.id===id);
    document.getElementById('sm-name').value=s.name;
    document.getElementById('sm-max').value=s.maxMarks;
    document.getElementById('sm-desc').value=s.desc;
  } else{['sm-name','sm-max','sm-desc'].forEach(i=>document.getElementById(i).value='');}
  openM('subject-modal');
}

async function saveSubject(){
  const name=document.getElementById('sm-name').value.trim();
  const max=parseInt(document.getElementById('sm-max').value);
  if(!name||!max){toast('Name and max marks required!');return;}
  const obj={name,maxMarks:max,desc:document.getElementById('sm-desc').value,eventId:activeEventId};
  if(editingSubjId){
    const success = await syncEngine.updateSubject(editingSubjId, obj);
    if(!success){toast('\\u274c Error updating subject');return;}
  } else {
    obj.id=Date.now();
    const success = await syncEngine.createSubject(obj);
    if(!success){toast('\\u274c Error creating subject');return;}
  }
  closeM('subject-modal');
  renderSubjects();
  toast('Subject saved!');
  broadcast('DATA_SYNC', { categories, subjects: syncEngine.getData().subjects });
}
async function deleteSubject(id){
  if(!confirm('Delete this subject?')) return;
  const success = await syncEngine.deleteSubject(id);
  if(!success){toast('\\u274c Error deleting subject');return;}
  renderSubjects();
  toast('Subject deleted');
  broadcast('DATA_SYNC', { categories, subjects: syncEngine.getData().subjects });
}'''

new_js = '''// ══════════════════════════════════════════
// SUBJECT TEMPLATE LIBRARY
// ══════════════════════════════════════════
const SUBJECT_TEMPLATES = [
  { name: 'Steps', maxMarks: 10, desc: 'Accuracy and clarity of dance steps, footwork precision and variety.' },
  { name: 'Tal', maxMarks: 10, desc: 'Adherence to rhythmic cycle (tala), maintaining proper beat structure and tempo.' },
  { name: 'Rhythm & Timing', maxMarks: 10, desc: 'Synchronization with music beats, tempo consistency and rhythmic accuracy.' },
  { name: 'Technique & Execution', maxMarks: 10, desc: 'Technical proficiency, body control, balance, flexibility and skill execution.' },
  { name: 'Costume & Presentation', maxMarks: 10, desc: 'Appropriateness of costume, stage presence, grooming and visual appeal.' },
  { name: 'Choreography', maxMarks: 10, desc: 'Creativity and structure of the dance composition, transitions and formations.' },
  { name: 'Musicality', maxMarks: 10, desc: 'Emotional connection with music, expression through movement and musical interpretation.' },
  { name: 'Overall Performance', maxMarks: 10, desc: 'General impression, entertainment value, confidence and audience engagement.' },
  { name: 'Expression', maxMarks: 10, desc: 'Facial expression and emotional storytelling through dance.' },
  { name: 'Energy & Stamina', maxMarks: 10, desc: 'Consistent energy level, endurance and dynamic stage presence throughout.' },
  { name: 'Creativity', maxMarks: 10, desc: 'Originality of movement, innovative choreographic elements and unique style.' },
  { name: 'Grace & Poise', maxMarks: 10, desc: 'Elegance of movement, fluidity and refined body posture.' },
  { name: 'Synchronization', maxMarks: 10, desc: 'Group coordination, unison timing and formation accuracy (for group acts).' },
  { name: 'Stage Utilization', maxMarks: 10, desc: 'Effective use of stage space, movement across the performance area.' },
  { name: 'Audience Impact', maxMarks: 10, desc: 'Crowd engagement, entertainment value and memorable performance quality.' }
];

function renderTemplateChips() {
  const el = document.getElementById('template-chips');
  if (!el) return;
  const activeNames = subjects.map(s => s.name.toLowerCase());
  el.innerHTML = SUBJECT_TEMPLATES.map(t => {
    const isAdded = activeNames.includes(t.name.toLowerCase());
    return `<button class="btn btn-sm" onclick="${isAdded ? '' : `addFromTemplate('${t.name.replace(/'/g, "\\\\'")}')`}"
      style="border-radius:20px;padding:6px 14px;font-size:12px;font-weight:700;
      border:1.5px solid ${isAdded ? 'var(--green2,#10b981)' : 'var(--amber2)'};
      background:${isAdded ? 'rgba(16,185,129,0.08)' : 'rgba(217,119,6,0.06)'};
      color:${isAdded ? 'var(--green2,#10b981)' : 'var(--amber2)'};
      cursor:${isAdded ? 'default' : 'pointer'};
      opacity:${isAdded ? '0.7' : '1'};
      transition:all 0.2s"
      title="${t.desc}">
      ${isAdded ? '✅' : '＋'} ${t.name}
    </button>`;
  }).join('');
}

async function addFromTemplate(name) {
  const template = SUBJECT_TEMPLATES.find(t => t.name === name);
  if (!template) return;
  const obj = { id: Date.now(), name: template.name, maxMarks: template.maxMarks, desc: template.desc, eventId: activeEventId };
  const success = await syncEngine.createSubject(obj);
  if (!success) { toast('\\u274c Error adding subject'); return; }
  renderSubjects();
  toast('\\u2705 ' + name + ' added!');
  broadcast('DATA_SYNC', { categories, subjects: syncEngine.getData().subjects });
}

async function clearAllSubjects() {
  if (!confirm('Are you sure you want to remove ALL scoring subjects? This cannot be undone.')) return;
  const allSubjs = [...subjects];
  for (const s of allSubjs) {
    await syncEngine.deleteSubject(s.id);
  }
  renderSubjects();
  toast('All subjects cleared');
  broadcast('DATA_SYNC', { categories, subjects: syncEngine.getData().subjects });
}

function openSubjectModal(id=null){
  editingSubjId=id;
  document.getElementById('subj-modal-title').textContent=id?'Edit Subject':'Add Custom Subject';
  if(id){const s=subjects.find(x=>x.id===id);
    document.getElementById('sm-name').value=s.name;
    document.getElementById('sm-max').value=s.maxMarks;
    document.getElementById('sm-desc').value=s.desc||'';
  } else{['sm-name','sm-max','sm-desc'].forEach(i=>document.getElementById(i).value='');
    document.getElementById('sm-max').value='10';
  }
  openM('subject-modal');
}

async function saveSubject(){
  const name=document.getElementById('sm-name').value.trim();
  const max=parseInt(document.getElementById('sm-max').value);
  if(!name||!max){toast('Name and max marks required!');return;}
  const obj={name,maxMarks:max,desc:document.getElementById('sm-desc').value,eventId:activeEventId};
  if(editingSubjId){
    const success = await syncEngine.updateSubject(editingSubjId, obj);
    if(!success){toast('\\u274c Error updating subject');return;}
  } else {
    obj.id=Date.now();
    const success = await syncEngine.createSubject(obj);
    if(!success){toast('\\u274c Error creating subject');return;}
  }
  closeM('subject-modal');
  renderSubjects();
  toast('\\u2705 Subject saved!');
  broadcast('DATA_SYNC', { categories, subjects: syncEngine.getData().subjects });
}

async function deleteSubject(id){
  if(!confirm('Delete this subject?')) return;
  const success = await syncEngine.deleteSubject(id);
  if(!success){toast('\\u274c Error deleting subject');return;}
  renderSubjects();
  toast('Subject deleted');
  broadcast('DATA_SYNC', { categories, subjects: syncEngine.getData().subjects });
}'''

content = content.replace(old_js, new_js)

# 3. Update renderSubjects to also render template chips & show count/empty state
old_render = '''function renderSubjects(){
  const el = document.getElementById('subjects-list');
  if(!el) return;
  const filteredSubjs = subjects.filter(s => String(s.eventId) === String(activeEventId) || !s.eventId);
  el.innerHTML = filteredSubjs.map(s=>`
    <div class="card glass-card card-hover" style="display:flex;align-items:center;gap:12px;padding:14px;border-radius:16px;margin-bottom:10px;background:#fff">
      <div style="width:36px;height:36px;border-radius:10px;background:var(--amber2)20;color:var(--amber2);display:flex;align-items:center;justify-content:center;font-weight:900;font-size:16px">${s.name[0]}</div>
      <div style="flex:1">
        <div style="font-weight:800;font-size:14px;color:var(--text)">${s.name}</div>
        <div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px">Max Marks: ${s.maxMarks}</div>
      </div>
      <div style="display:flex;gap:4px">
        <button class="btn btn-ghost btn-xs" onclick="openSubjectModal(${s.id})" style="padding:6px;min-width:32px">\\u270f\\ufe0f</button>
        <button class="btn btn-danger btn-xs" onclick="deleteSubject(${s.id})" style="padding:6px;min-width:32px">\\ud83d\\uddd1</button>
      </div>
    </div>`).join('');
  renderScoreSheetPreview();
}'''

new_render = '''function renderSubjects(){
  const el = document.getElementById('subjects-list');
  if(!el) return;
  const filteredSubjs = subjects.filter(s => String(s.eventId) === String(activeEventId) || !s.eventId);
  const emptyEl = document.getElementById('subjects-empty');
  const countEl = document.getElementById('subj-count');
  if (countEl) countEl.textContent = filteredSubjs.length;
  if (emptyEl) emptyEl.style.display = filteredSubjs.length === 0 ? 'block' : 'none';

  el.innerHTML = filteredSubjs.map(s=>`
    <div class="card glass-card card-hover" style="display:flex;align-items:center;gap:12px;padding:14px;border-radius:16px;margin-bottom:0;background:#fff">
      <div style="width:36px;height:36px;border-radius:10px;background:var(--amber2)20;color:var(--amber2);display:flex;align-items:center;justify-content:center;font-weight:900;font-size:16px">${s.name[0]}</div>
      <div style="flex:1">
        <div style="font-weight:800;font-size:14px;color:var(--text)">${s.name}</div>
        <div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px">Max: ${s.maxMarks} pts${s.desc ? ' — ' + s.desc.substring(0,60) + (s.desc.length > 60 ? '…' : '') : ''}</div>
      </div>
      <div style="display:flex;gap:4px">
        <button class="btn btn-ghost btn-xs" onclick="openSubjectModal(${s.id})" style="padding:6px;min-width:32px" title="Edit">\\u270f\\ufe0f</button>
        <button class="btn btn-danger btn-xs" onclick="deleteSubject(${s.id})" style="padding:6px;min-width:32px" title="Delete">\\ud83d\\uddd1</button>
      </div>
    </div>`).join('');

  renderTemplateChips();
  renderScoreSheetPreview();
}'''

content = content.replace(old_render, new_render)

# 4. Also expose the new functions to window
old_expose = 'window.saveSubject = saveSubject;'
new_expose = '''window.saveSubject = saveSubject;
window.addFromTemplate = addFromTemplate;
window.clearAllSubjects = clearAllSubjects;'''

content = content.replace(old_expose, new_expose)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print('✅ Updated KNSDC-Monitor.html with template picker and enhanced subject management!')
