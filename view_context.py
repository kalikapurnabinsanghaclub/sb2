import sys; sys.stdout.reconfigure(encoding='utf-8')
with open('scratch/58cd9f3_file.html', 'r', encoding='utf-16') as f:
    lines = f.readlines()
for i in range(3815, 3869):
    print(lines[i].strip())
