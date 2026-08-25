import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

file_path = r"c:\Users\sourav pc\Desktop\kalikapur\index.html"

with open(file_path, "rb") as f:
    bytes_content = f.read()

pos_live = bytes_content.find(b"Live Events", 33000)
pos_next = bytes_content.find(b"STANDALONE PUBLIC RATING SECTION")

if pos_live == -1 or pos_next == -1:
    print("Error: Could not locate replacement boundaries!")
    sys.exit(1)

pos_comment_start = bytes_content.rfind(b"<!--", 0, pos_next)
print(f"Replacing region: {pos_live} to {pos_comment_start}")

# Extract the region to confirm
original_region = bytes_content[pos_live:pos_comment_start]

# Define replacement bytes
replacement_bytes = b'Live Events\n        </h2>\n      </div>\n\n      <!-- Live Content Container -->\n      <div id="liveContent"></div>\n    </div>\n  </section>\n\n  '

# Perform substitution
new_bytes_content = bytes_content[:pos_live] + replacement_bytes + bytes_content[pos_comment_start:]

# Save back to file
with open(file_path, "wb") as f:
    f.write(new_bytes_content)

print("Replacement applied successfully!")

# Verify again by searching for liveContent container
with open(file_path, "rb") as f:
    verify_content = f.read()

assert b'<div id="liveContent"></div>' in verify_content
print("Verification passed: <div id=\"liveContent\"></div> is present in the file.")
