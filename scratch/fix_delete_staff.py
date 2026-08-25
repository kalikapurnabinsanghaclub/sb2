import sys

path = r'c:\Users\sourav pc\Desktop\kalikapur\KNSDC-Admin.html'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

import re

# Find the block for deleteStaffCard
pattern = re.compile(r'async function deleteStaffCard\(staffId, staffName\) \{.*?window\.deleteStaffCard = deleteStaffCard;', re.DOTALL)

def replacer(match):
    return """async function deleteStaffCard(staffId, staffName) {
    if (!confirm(`Remove ${staffName} from staff? This action cannot be undone.`)) return;
    const s = syncEngine.getData();
    
    // Find email by matching id in staff credentials
    const creds = s.staffCredentials || {};
    const email = Object.keys(creds).find(k => creds[k].id === staffId || k === staffId) || staffId;
    
    // Also try judgeCredentials
    const jCreds = s.judgeCredentials || {};
    const jEmail = Object.keys(jCreds).find(k => (jCreds[k].id === staffId || k === staffId));
    
    if (jEmail) {
        // Remove from judgeCredentials
        delete jCreds[jEmail];
        const newState = { ...s, judgeCredentials: jCreds };
        syncEngine.setData(st => newState);
        toast(`🗑️ ${staffName} removed successfully.`);
        
        const activePage = document.querySelector('.pp.active');
        const pageId = activePage ? activePage.id.replace('pp-', '') : 'dashboard';
        refreshUI(pageId);
        return;
    }
    
    const res = await syncEngine.deleteStaffMember(email);
    if (!res.success) {
        // Fallback: remove from local state
        const newCreds = { ...creds };
        delete newCreds[email];
        const newState = { ...s, staffCredentials: newCreds };
        syncEngine.setData(st => newState);
        toast(`🗑️ ${staffName} removed from local state.`);
    } else {
        toast(`🗑️ ${staffName} removed.`);
    }
    
    const activePage = document.querySelector('.pp.active');
    const pageId = activePage ? activePage.id.replace('pp-', '') : 'dashboard';
    refreshUI(pageId);
}
window.deleteStaffCard = deleteStaffCard;"""

if pattern.search(content):
    new_content = pattern.sub(replacer, content)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Fixed deleteStaffCard successfully!")
else:
    print("Could not find deleteStaffCard block")
