import sys; sys.stdout.reconfigure(encoding='utf-8')
with open('scratch/58cd9f3_file.html', 'r', encoding='utf-16') as f:
    lines = f.readlines()
for i in range(1015, 1030):
    print(lines[i].strip())
