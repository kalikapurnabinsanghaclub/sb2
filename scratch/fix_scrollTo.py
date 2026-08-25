import sys, io, re
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

path = 'c:/Users/sourav pc/Desktop/kalikapur/index.html'

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Count before
before = content.count("scrollTo(")
print(f"Before: {before} occurrences of scrollTo(")

# Replace onclick="scrollTo(  and onclick='scrollTo(   patterns
# We also need to handle if(targetId) scrollTo(targetId) in showToast
content_new = content.replace("onclick=\"scrollTo(", "onclick=\"navigateTo(")
content_new = content_new.replace("onclick='scrollTo(", "onclick='navigateTo(")

# Fix the toast handler: if (targetId) scrollTo(targetId)
content_new = content_new.replace("if (targetId) scrollTo(targetId)", "if (targetId) navigateTo(targetId)")

# Fix the back to top button  onclick="scrollTo('home')"  already caught above
# Fix style="... onclick=\"scrollTo( patterns

after = content_new.count("scrollTo(")
print(f"After: {after} occurrences of scrollTo(")

# Show what's left
lines = content_new.split('\n')
remaining = [(i+1, l.strip()) for i, l in enumerate(lines) if 'scrollTo(' in l]
print(f"\nRemaining scrollTo( occurrences:")
for num, text in remaining:
    print(f"  Line {num}: {text[:120]}")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content_new)

print("\nDone! File saved.")
