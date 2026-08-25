import sys, re

path = r'c:\Users\sourav pc\Desktop\kalikapur\index.html'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

bad_regex = r'/(?:youtube\\.com\\/(?:[^\\/]+\\/.+\\/|(?:v|e(?:mbed)?)\\/|.*[?&]v=)|youtu\\.be\\/)([^"&?\\/\\s]{11})/i'
good_regex = r'/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i'

new_content = content.replace(bad_regex, good_regex)

if new_content != content:
    with open(path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Fixed bad regex in index.html")
else:
    print("No bad regex found")
