const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

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

// Fix saveRegistration
const oldSaveRegistration = `      async saveRegistration(reg) {
        reg.type = 'registration';
        const list = JSON.parse(localStorage.getItem(this.localRegistrationsKey) || '[]');
        list.push(reg);
        localStorage.setItem(this.localRegistrationsKey, JSON.stringify(list));

        if (!this.isConfigured()) return true;`;
        
const newSaveRegistration = `      async saveRegistration(reg) {
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

fs.writeFileSync('index.html', content, 'utf8');
console.log('Fixed index.html');
