with open(r"C:\Users\soura\.gemini\antigravity\scratch\sb2\KNSDC-Monitor.html", "r", encoding="utf-8") as f:
    text = f.read()

import re

flash_fns = ['selectPresetFlash', 'triggerFlashMessage', 'clearFlashMessage', 'onFlashTextInput', 'updateFlashStatusUI']
for fn in flash_fns:
    pos = text.find(f'function {fn}(')
    if pos != -1:
        end = text.find('\nfunction ', pos + 10)
        code = text[pos:end]
        print(f"\n=== {fn} ===")
        print(code[:600].encode('ascii', errors='replace').decode('ascii'))
    else:
        print(f"❌ Function {fn} NOT FOUND!")
