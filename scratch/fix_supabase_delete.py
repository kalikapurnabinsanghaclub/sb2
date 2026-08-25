import sys

path1 = r'c:\Users\sourav pc\Desktop\kalikapur\KNSDC-Admin.html'
with open(path1, 'r', encoding='utf-8') as f:
    content1 = f.read()

import re

# In KNSDC-Admin.html: Add `await syncEngine.deleteStaffMember(jEmail);` inside `if (jEmail) { ... }`
pattern1 = re.compile(r'(if \(jEmail\) \{[\s\S]*?syncEngine\.setData\(st => newState\);)', re.DOTALL)
def replacer1(match):
    return match.group(1) + "\n        await syncEngine.deleteStaffMember(jEmail);"

content1 = pattern1.sub(replacer1, content1)

with open(path1, 'w', encoding='utf-8') as f:
    f.write(content1)
print("Updated KNSDC-Admin.html")

path2 = r'c:\Users\sourav pc\Desktop\kalikapur\lib\localSync-v4.js'
with open(path2, 'r', encoding='utf-8') as f:
    content2 = f.read()

# In localSync-v4.js: Update `deleteStaffMember`
old_func = """  async deleteStaffMember(email) {
    if (!this.supabase) return { success: false, error: 'No connection' };
    try {
      const { error } = await this.supabase
        .from('staff_credentials')
        .delete()
        .eq('email', email.trim().toLowerCase());
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }"""

new_func = """  async deleteStaffMember(email) {
    if (!this.supabase) return { success: false, error: 'No connection' };
    try {
      const emailLower = email.trim().toLowerCase();
      // Try to delete from staff_credentials
      await this.supabase.from('staff_credentials').delete().eq('email', emailLower);
      // Try to delete from judge_credentials
      await this.supabase.from('judge_credentials').delete().eq('email', emailLower);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }"""

content2 = content2.replace(old_func, new_func)

with open(path2, 'w', encoding='utf-8') as f:
    f.write(content2)
print("Updated localSync-v4.js")
