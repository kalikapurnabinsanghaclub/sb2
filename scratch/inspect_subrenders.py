with open(r"C:\Users\soura\.gemini\antigravity\scratch\sb2\KNSDC-Monitor.html", "r", encoding="utf-8") as f:
    text = f.read()

import re

fns = ['renderDashStats', 'renderRoundPipeline', 'renderStageView', 'renderAttendanceBreakdown', 'renderJudgeStatus', 'renderSwitches', 'updateFlashStatusUI']

for fn in fns:
    pos = text.find(f'function {fn}(')
    if pos != -1:
        # find end of function
        end = text.find('\nfunction ', pos + 10)
        code = text[pos:end]
        print(f"\n==================== {fn} ({len(code)} bytes) ====================")
        
        # Check all document.getElementById calls in this function
        elem_ids = re.findall(r'document\.getElementById\(["\']([^"\']+)["\']\)', code)
        print(f"Element IDs queried: {elem_ids}")
        for eid in elem_ids:
            exists = f'id="{eid}"' in text or f"id='{eid}'" in text
            if not exists:
                print(f"  [MISSING DOM ELEMENT]: #{eid} in {fn}!")
            else:
                print(f"  [OK] Found #{eid}")
    else:
        print(f"[MISSING FUNCTION]: {fn}")
