import sys
import io

# Set stdout to UTF-8
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

with open('c:/Users/sourav pc/Desktop/kalikapur/index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

print("--- NAVBAR / NAV ITEMS SEARCH ---")
for idx, line in enumerate(lines):
    if 'class="nl"' in line or "class='nl'" in line or 'class="nl ' in line or "onclick=\"scrollTo(" in line or "onclick='scrollTo(" in line:
        print(f"Line {idx+1}: {line.strip()}")

print("\n--- SECTIONS SEARCH ---")
for idx, line in enumerate(lines):
    if any(term in line for term in ['id="notice"', 'id="live"', 'id="previous"', 'id="about"', 'id="donate"', 'id="contact"', 'id="home"']):
        if '<section' in line or '<div' in line:
            print(f"Line {idx+1}: {line.strip()}")
