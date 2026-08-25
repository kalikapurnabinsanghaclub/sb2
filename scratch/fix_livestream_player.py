import sys, re

path = r'c:\Users\sourav pc\Desktop\kalikapur\index.html'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

def replacer(match):
    var_name = match.group(1)
    
    player_js = f"""
                </div>
                ${{(() => {{
                  let input = {var_name}?.switchStates?.liveStreamUrl || state.switchStates?.liveStreamUrl || '';
                  if(!input) return '';
                  let embedUrl = input;
                  if (input.toLowerCase().startsWith('<iframe')) {{
                     return `\\n<div style="margin-top: 20px; position:relative; width:100%; padding-bottom:56.25%; border-radius:12px; overflow:hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.3); background: #000;">${{input.replace('<iframe', '<iframe style="position:absolute; top:0; left:0; width:100%; height:100%; border:none;"')}}</div>`;
                  }}
                  const ytMatch = input.match(/(?:youtube\\\\.com\\\\/(?:[^\\\\/]+\\\\/.+\\\\/|(?:v|e(?:mbed)?)\\\\/|.*[?&]v=)|youtu\\\\.be\\\\/)([^"&?\\\\/\\\\s]{{11}})/i);
                  if (ytMatch && ytMatch[1]) {{
                    embedUrl = `https://www.youtube.com/embed/${{ytMatch[1]}}?autoplay=1&mute=1`;
                  }} else if (input.includes('facebook.com') && input.includes('/videos/')) {{
                    embedUrl = `https://www.facebook.com/plugins/video.php?href=${{encodeURIComponent(input)}}&show_text=false&width=auto`;
                  }}
                  return `\\n<div style="margin-top: 20px; position:relative; width:100%; padding-bottom:56.25%; border-radius:12px; overflow:hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.3); background: #000;">\\n  <iframe src="${{embedUrl}}" style="position:absolute; top:0; left:0; width:100%; height:100%; border:none;" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>\\n</div>`;
                }})()}}
"""
    
    return player_js

# The pattern is matching from the end of the flex container (closing </div>) and the <a> tag until its closing </a>.
# We'll replace the <a> tag entirely.
# Let's match `<div style="display: flex; align-items: center; gap: ...;">...</div>` 
# followed by `<a href="${(ev...` until `</a>`
# Actually, the block we want to replace is exactly the `</a>` and the whitespace before it.

pattern = r'\s*<a href="\$\{\((ev|evObj)\?\.switchStates.*?</a\>'

# Let's see how many matches we get
matches = list(re.finditer(pattern, content, re.DOTALL))
print(f"Found {len(matches)} occurrences to replace.")

new_content = re.sub(pattern, replacer, content, flags=re.DOTALL)

with open(path, 'w', encoding='utf-8') as f:
    f.write(new_content)
