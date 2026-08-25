import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

try:
    with open('c:/Users/sourav pc/Desktop/kalikapur/dist/index.html', 'r', encoding='utf-8') as f:
        content = f.read()
    
    print("--- DIST INDEX.HTML NAVBAR SEARCH ---")
    # Let's search for buttons with class nl
    import re
    matches = re.findall(r'<button[^>]*class=["\']nl[^>]*>.*?</button>', content)
    for m in matches:
        print(m)
except Exception as e:
    print(f"Error: {e}")
