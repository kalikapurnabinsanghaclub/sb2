const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

const s1 = "async getWorkshops() {\n        if (!this.isConfigured()) {\n          return JSON.parse(localStorage.getItem(this.localWorkshopsKey) || '[]');\n        }";
const r1 = "async getWorkshops() {\n        if (!this.isConfigured()) {\n          if (window.syncEngine && window.syncEngine.state && window.syncEngine.state.cb_workshops) {\n            return window.syncEngine.state.cb_workshops;\n          }\n          return JSON.parse(localStorage.getItem(this.localWorkshopsKey) || '[]');\n        }";
content = content.replace(s1, r1);

const s2 = "async getRegistrations(workshopId) {\n        if (!this.isConfigured()) {\n          const list = JSON.parse(localStorage.getItem(this.localRegistrationsKey) || '[]');\n          return list.filter(r => r.workshop_id === workshopId);\n        }";
const r2 = "async getRegistrations(workshopId) {\n        if (!this.isConfigured()) {\n          let list = [];\n          if (window.syncEngine && window.syncEngine.state && window.syncEngine.state.cb_registrations) {\n            list = window.syncEngine.state.cb_registrations;\n          } else {\n            list = JSON.parse(localStorage.getItem(this.localRegistrationsKey) || '[]');\n          }\n          return list.filter(r => r.workshop_id === workshopId);\n        }";
content = content.replace(s2, r2);

const s3 = "async saveRegistration(reg) {\n        reg.type = 'registration';\n        const list = JSON.parse(localStorage.getItem(this.localRegistrationsKey) || '[]');\n        list.push(reg);\n        localStorage.setItem(this.localRegistrationsKey, JSON.stringify(list));\n\n        if (!this.isConfigured()) return true;";
const r3 = "async saveRegistration(reg) {\n        reg.type = 'registration';\n        \n        let list = [];\n        if (window.syncEngine && window.syncEngine.state && window.syncEngine.state.cb_registrations) {\n           list = [...window.syncEngine.state.cb_registrations];\n        } else {\n           list = JSON.parse(localStorage.getItem(this.localRegistrationsKey) || '[]');\n        }\n        list.push(reg);\n        \n        localStorage.setItem(this.localRegistrationsKey, JSON.stringify(list));\n        \n        if (window.syncEngine && window.syncEngine.setData) {\n          window.syncEngine.setData(s => ({ ...s, cb_registrations: list }));\n        }\n\n        if (!this.isConfigured()) return true;";
content = content.replace(s3, r3);

fs.writeFileSync('index.html', content, 'utf8');
console.log('Fixed index.html successfully!');
