// Node.js script to fix the corrupted Edit Event Modal in KNSDC-Admin.html
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'KNSDC-Admin.html');
let content = fs.readFileSync(filePath, 'utf8');

// The corrupted section starts with "<!-- EDIT EVENT MODAL -->" and ends with "};\r\n" before "window.saveNewEvent"
const startMarker = '<!-- EDIT EVENT MODAL -->';
const endMarker = 'window.saveNewEvent = async () =>';

const startIdx = content.indexOf(startMarker);
const endIdx = content.indexOf(endMarker);

if (startIdx === -1 || endIdx === -1) {
  console.error('Could not find markers! startIdx:', startIdx, 'endIdx:', endIdx);
  process.exit(1);
}

// Find the newline before endMarker
let insertPoint = endIdx;
// Go back to find the start of the line
while (insertPoint > 0 && content[insertPoint - 1] !== '\n') {
  insertPoint--;
}

const before = content.substring(0, startIdx);
const after = content.substring(insertPoint);

const replacement = `<!-- EDIT EVENT MODAL -->
<div class="modal-overlay" id="edit-event-modal" style="display:none" onclick="closeOnBg(event,'edit-event-modal')">
  <div class="modal" style="max-width:700px">
    <div class="modal-head">
      <div class="modal-title">✏️ Edit Event</div>
      <button class="btn btn-ghost btn-icon" onclick="closeM('edit-event-modal')">✕</button>
    </div>
    <div class="modal-body">
      <input type="hidden" id="edit-ev-id"/>
      <div class="g2">
        <div class="fg"><label class="fl">Event Name *</label><input type="text" id="edit-cev-name" placeholder="Annual Cultural Fest 2025"/></div>
        <div class="fg"><label class="fl">Organizer Name *</label><input type="text" id="edit-cev-org" placeholder="e.g. Kalikapur Nabin Sangha"/></div>
      </div>
      <div class="g2">
        <div class="fg"><label class="fl">Event Type</label><select id="edit-cev-type"><option value="Cultural">Cultural</option><option value="Sports">Sports</option><option value="Social">Social</option><option value="Workshop">Workshop</option></select></div>
        <div class="fg"><label class="fl">Venue / Location *</label><input type="text" id="edit-cev-venue" placeholder="Main Auditorium, KNSDC Hall"/></div>
      </div>
      <div class="g2">
        <div class="fg"><label class="fl">Start Date *</label><input type="date" id="edit-cev-start"/></div>
        <div class="fg"><label class="fl">Start Time *</label><input type="time" id="edit-cev-time"/></div>
      </div>
      <div class="g2">
        <div class="fg"><label class="fl">End Date *</label><input type="date" id="edit-cev-end"/></div>
        <div class="fg"><label class="fl">End Time *</label><input type="time" id="edit-cev-endtime"/></div>
      </div>
      <div class="fg"><label class="fl">Expected Participants</label><input type="number" id="edit-cev-capacity" placeholder="500"/></div>
      <div class="fg">
        <label class="fl">Upload Banner Image</label>
        <input type="file" id="edit-cev-banner-file" accept="image/*" onchange="handleBannerUpload(event, 'edit-cev-banner')"/>
        <input type="hidden" id="edit-cev-banner"/>
        <div id="edit-ev-banner-preview" style="width:100%;height:100px;border-radius:10px;margin-top:8px;overflow:hidden;display:none;border:1px solid var(--border)"><img id="edit-ev-banner-img" src="" alt="" style="width:100%;height:100%;object-fit:cover"/></div>
      </div>
      <div class="fg"><label class="fl">Description</label><textarea id="edit-cev-desc" style="min-height:60px"></textarea></div>
      <div style="margin-top:20px; padding-top:15px; border-top:1px dashed var(--border)">
        <div style="font-size:11px; color:var(--text-muted); font-family:var(--fm); letter-spacing:1px; text-transform:uppercase; margin-bottom:12px; font-weight:800">📅 Round Schedules</div>
        <div style="display:flex; flex-direction:column; gap:12px">
          <div style="background:rgba(0,0,0,0.02); border-radius:12px; padding:12px; border:1px solid var(--border)"><div style="font-weight:800; font-size:12px; margin-bottom:8px; color:var(--blue); text-transform:uppercase">Audition Round</div><div class="g3"><div class="fg" style="margin:0"><label class="fl" style="font-size:10px">Venue</label><input type="text" id="edit-cev-round-audition-venue"/></div><div class="fg" style="margin:0"><label class="fl" style="font-size:10px">Date</label><input type="date" id="edit-cev-round-audition-date"/></div><div class="fg" style="margin:0"><label class="fl" style="font-size:10px">Time</label><input type="time" id="edit-cev-round-audition-time"/></div></div></div>
          <div style="background:rgba(0,0,0,0.02); border-radius:12px; padding:12px; border:1px solid var(--border)"><div style="font-weight:800; font-size:12px; margin-bottom:8px; color:var(--blue); text-transform:uppercase">Qualified Round</div><div class="g3"><div class="fg" style="margin:0"><label class="fl" style="font-size:10px">Venue</label><input type="text" id="edit-cev-round-qualified-venue"/></div><div class="fg" style="margin:0"><label class="fl" style="font-size:10px">Date</label><input type="date" id="edit-cev-round-qualified-date"/></div><div class="fg" style="margin:0"><label class="fl" style="font-size:10px">Time</label><input type="time" id="edit-cev-round-qualified-time"/></div></div></div>
          <div style="background:rgba(0,0,0,0.02); border-radius:12px; padding:12px; border:1px solid var(--border)"><div style="font-weight:800; font-size:12px; margin-bottom:8px; color:var(--blue); text-transform:uppercase">Semifinal Round</div><div class="g3"><div class="fg" style="margin:0"><label class="fl" style="font-size:10px">Venue</label><input type="text" id="edit-cev-round-semifinal-venue"/></div><div class="fg" style="margin:0"><label class="fl" style="font-size:10px">Date</label><input type="date" id="edit-cev-round-semifinal-date"/></div><div class="fg" style="margin:0"><label class="fl" style="font-size:10px">Time</label><input type="time" id="edit-cev-round-semifinal-time"/></div></div></div>
          <div style="background:rgba(0,0,0,0.02); border-radius:12px; padding:12px; border:1px solid var(--border)"><div style="font-weight:800; font-size:12px; margin-bottom:8px; color:var(--blue); text-transform:uppercase">Final Round</div><div class="g3"><div class="fg" style="margin:0"><label class="fl" style="font-size:10px">Venue</label><input type="text" id="edit-cev-round-final-venue"/></div><div class="fg" style="margin:0"><label class="fl" style="font-size:10px">Date</label><input type="date" id="edit-cev-round-final-date"/></div><div class="fg" style="margin:0"><label class="fl" style="font-size:10px">Time</label><input type="time" id="edit-cev-round-final-time"/></div></div></div>
        </div>
      </div>
    </div>
    <div class="modal-foot">
      <button class="btn btn-ghost" onclick="closeM('edit-event-modal')">Cancel</button>
      <button class="btn btn-amber" onclick="saveEditedEvent()">💾 Save Changes</button>
    </div>
  </div>
</div>

<div id="toast"></div>
<script src="lib/supabase.js"><\/script>
<script src="lib/localSync-v4.js?v=3"><\/script>
<script src="lib/staffAudio.js"><\/script>
<script src="lib/sampleDataLocal.js"><\/script>
<script>
// ── Banner Upload & Preview ──
window.handleBannerUpload = async (evt, hiddenId) => {
  const file = evt.target.files[0];
  if (!file) { document.getElementById(hiddenId).value = ''; if (hiddenId === 'cev-banner') previewEventBanner(); return; }
  if (window.syncEngine && window.syncEngine.uploadFile) {
    toast('📤 Uploading banner...');
    const url = await window.syncEngine.uploadFile(file);
    if (url) {
      document.getElementById(hiddenId).value = url;
      toast('✅ Banner uploaded!');
      if (hiddenId === 'cev-banner') previewEventBanner();
      if (hiddenId === 'edit-cev-banner') { const p=document.getElementById('edit-ev-banner-preview'),i=document.getElementById('edit-ev-banner-img'); if(p&&i){i.src=url;p.style.display='block';} }
      return;
    }
  }
  const reader = new FileReader();
  reader.onload = function(e) {
    document.getElementById(hiddenId).value = e.target.result;
    if (hiddenId === 'cev-banner') previewEventBanner();
    if (hiddenId === 'edit-cev-banner') { const p=document.getElementById('edit-ev-banner-preview'),i=document.getElementById('edit-ev-banner-img'); if(p&&i){i.src=e.target.result;p.style.display='block';} }
  };
  reader.readAsDataURL(file);
};
window.previewEventBanner = () => {
  const url = document.getElementById('cev-banner').value.trim();
  const img = document.getElementById('ev-banner-img');
  const ph = document.getElementById('ev-banner-placeholder');
  const name = document.getElementById('cev-name').value.trim();
  if (url) { img.src = url; img.style.display = 'block'; ph.style.display = 'none'; }
  else { img.style.display = 'none'; ph.style.display = 'block'; ph.innerHTML = name ? '<div style="font-family:var(--fh);font-size:22px;font-weight:800;color:#fff;letter-spacing:1px">'+name.toUpperCase()+'<\/div>' : '<div style="font-size:36px">🎪<\/div><div style="font-size:12px;font-family:var(--fm);letter-spacing:2px;margin-top:6px;color:rgba(255,255,255,0.7)">EVENT BANNER<\/div>'; }
};

`;

fs.writeFileSync(filePath, before + replacement + after, 'utf8');
console.log('✅ Edit Event Modal fixed successfully!');
console.log('Replaced content between markers.');
