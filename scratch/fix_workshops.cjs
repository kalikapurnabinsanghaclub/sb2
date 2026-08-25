const fs = require('fs');

const files = ['KNSDC-Organizer.html', 'index.html'];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');

  // Fix getWorkshops
  content = content.replace(
    /async getWorkshops\(\) \{\s*if \(\!this\.isConfigured\(\)\) \{\s*return JSON\.parse\(localStorage\.getItem\(this\.localWorkshopsKey\) \|\| '\[\]'\);\s*\}/,
    `async getWorkshops() {
        if (!this.isConfigured()) {
          if (window.syncEngine && window.syncEngine.state && window.syncEngine.state.cb_workshops) {
            return window.syncEngine.state.cb_workshops;
          }
          return JSON.parse(localStorage.getItem(this.localWorkshopsKey) || '[]');
        }`
  );

  // Fix getRegistrations
  content = content.replace(
    /async getRegistrations\(workshopId\) \{\s*if \(\!this\.isConfigured\(\)\) \{\s*const list = JSON\.parse\(localStorage\.getItem\(this\.localRegistrationsKey\) \|\| '\[\]'\);\s*return list\.filter\(r => r\.workshop_id === workshopId\);\s*\}/,
    `async getRegistrations(workshopId) {
        if (!this.isConfigured()) {
          let list = [];
          if (window.syncEngine && window.syncEngine.state && window.syncEngine.state.cb_registrations) {
            list = window.syncEngine.state.cb_registrations;
          } else {
            list = JSON.parse(localStorage.getItem(this.localRegistrationsKey) || '[]');
          }
          return list.filter(r => r.workshop_id === workshopId);
        }`
  );

  // Fix saveWorkshop
  const oldSaveWorkshop = `async saveWorkshop(ws, imageFile = null, videoFile = null) {
        ws.type = 'workshop';
        
        const list = JSON.parse(localStorage.getItem(this.localWorkshopsKey) || '[]');
        const idx = list.findIndex(w => w.id === ws.id);
        if (idx !== -1) {
          if (!imageFile) ws.image_url = list[idx].image_url || ws.image_url;
          if (!videoFile) ws.video_url = list[idx].video_url || ws.video_url;
          list[idx] = ws;
        } else {
          list.push(ws);
        }
        localStorage.setItem(this.localWorkshopsKey, JSON.stringify(list));

        if (!this.isConfigured()) return true;`;
        
  const newSaveWorkshop = `async saveWorkshop(ws, imageFile = null, videoFile = null) {
        ws.type = 'workshop';
        
        const list = JSON.parse(localStorage.getItem(this.localWorkshopsKey) || '[]');
        const idx = list.findIndex(w => w.id === ws.id);
        
        if (imageFile && window.syncEngine && window.syncEngine.uploadFile) {
           ws.image_url = await window.syncEngine.uploadFile(imageFile, 'workshops/');
        }
        if (videoFile && window.syncEngine && window.syncEngine.uploadFile) {
           ws.video_url = await window.syncEngine.uploadFile(videoFile, 'workshops/');
        }
        
        if (idx !== -1) {
          if (!imageFile) ws.image_url = list[idx].image_url || ws.image_url;
          if (!videoFile) ws.video_url = list[idx].video_url || ws.video_url;
          list[idx] = ws;
        } else {
          list.push(ws);
        }
        localStorage.setItem(this.localWorkshopsKey, JSON.stringify(list));
        
        if (window.syncEngine && window.syncEngine.setData) {
          window.syncEngine.setData(s => ({ ...s, cb_workshops: list }));
        }

        if (!this.isConfigured()) return true;`;

  content = content.replace(oldSaveWorkshop, newSaveWorkshop);
  
  // Fix deleteWorkshop
  const oldDeleteWorkshop = `async deleteWorkshop(workshopId) {
        const list = JSON.parse(localStorage.getItem(this.localWorkshopsKey) || '[]');
        const updated = list.filter(w => w.id !== workshopId);
        localStorage.setItem(this.localWorkshopsKey, JSON.stringify(updated));

        const regs = JSON.parse(localStorage.getItem(this.localRegistrationsKey) || '[]');
        const updatedRegs = regs.filter(r => r.workshop_id !== workshopId);
        localStorage.setItem(this.localRegistrationsKey, JSON.stringify(updatedRegs));

        if (!this.isConfigured()) return true;`;
        
  const newDeleteWorkshop = `async deleteWorkshop(workshopId) {
        const list = JSON.parse(localStorage.getItem(this.localWorkshopsKey) || '[]');
        const updated = list.filter(w => w.id !== workshopId);
        localStorage.setItem(this.localWorkshopsKey, JSON.stringify(updated));

        const regs = JSON.parse(localStorage.getItem(this.localRegistrationsKey) || '[]');
        const updatedRegs = regs.filter(r => r.workshop_id !== workshopId);
        localStorage.setItem(this.localRegistrationsKey, JSON.stringify(updatedRegs));
        
        if (window.syncEngine && window.syncEngine.setData) {
          window.syncEngine.setData(s => ({ ...s, cb_workshops: updated, cb_registrations: updatedRegs }));
        }

        if (!this.isConfigured()) return true;`;
        
  content = content.replace(oldDeleteWorkshop, newDeleteWorkshop);
  
  // Fix saveRegistration
  const oldSaveRegistration = `async saveRegistration(reg) {
        reg.type = 'registration';
        const list = JSON.parse(localStorage.getItem(this.localRegistrationsKey) || '[]');
        list.push(reg);
        localStorage.setItem(this.localRegistrationsKey, JSON.stringify(list));

        if (!this.isConfigured()) return true;`;
        
  const newSaveRegistration = `async saveRegistration(reg) {
        reg.type = 'registration';
        
        let list = [];
        if (window.syncEngine && window.syncEngine.state && window.syncEngine.state.cb_registrations) {
           list = [...window.syncEngine.state.cb_registrations];
        } else {
           list = JSON.parse(localStorage.getItem(this.localRegistrationsKey) || '[]');
        }
        list.push(reg);
        
        localStorage.setItem(this.localRegistrationsKey, JSON.stringify(list));
        
        if (window.syncEngine && window.syncEngine.setData) {
          window.syncEngine.setData(s => ({ ...s, cb_registrations: list }));
        }

        if (!this.isConfigured()) return true;`;
        
  content = content.replace(oldSaveRegistration, newSaveRegistration);

  fs.writeFileSync(file, content, 'utf8');
  console.log('Fixed ' + file);
});
