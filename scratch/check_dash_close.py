import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

with open('c:/Users/sourav pc/Desktop/kalikapur/KNSDC-Admin.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Check lines 385-430 context
print("Context around pp-dashboard closing:")
for i in range(385, 430):
    print(f"  {i+1}: {lines[i].rstrip()}")
