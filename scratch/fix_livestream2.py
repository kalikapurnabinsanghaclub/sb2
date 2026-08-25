import sys

path = r'c:\Users\sourav pc\Desktop\kalikapur\index.html'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

target_str = "            ratingBox.innerHTML = `"

replacement = """            // Build the live stream HTML if it's on
            const liveStreamHtml = (evObj?.switchStates?.liveStream && evObj?.switchStates?.liveStreamUrl) ? `
              <div style="margin-bottom: 24px; background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%); border-radius: 20px; padding: 24px 32px; border: 2px solid rgba(255,255,255,0.2); position: relative; overflow: hidden; box-shadow: 0 8px 32px rgba(239, 68, 68, 0.3);">
                <div style="position:absolute; top:-40px; right:-40px; font-size:120px; opacity:0.1; pointer-events:none;">🎥</div>
                <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 20px;">
                  <div style="display: flex; align-items: center; gap: 16px;">
                    <div style="width: 50px; height: 50px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; box-shadow: 0 4px 15px rgba(0,0,0,0.2); animation: pulse 2s infinite;">🔴</div>
                    <div style="position:relative; z-index:1;">
                      <h4 style="color: white; font-family: 'Cinzel Decorative', cursive; font-size: 1.3rem; margin: 0; letter-spacing: 1.5px; text-transform: uppercase;">Live Broadcast</h4>
                      <p style="color: rgba(255,255,255,0.9); font-size: 0.9rem; margin: 4px 0 0; font-weight: 600;">Stream to YouTube / Facebook Live is on!</p>
                    </div>
                  </div>
                  <a href="${evObj.switchStates.liveStreamUrl.replace(/'/g, '&apos;').replace(/\"/g, '&quot;')}" target="_blank" style="background: white; color: #dc2626; padding: 14px 28px; border-radius: 12px; font-weight: 900; text-decoration: none; font-size: 1rem; box-shadow: 0 4px 15px rgba(0,0,0,0.2); display: inline-block; position: relative; z-index: 1;">▶ Watch Live Streaming</a>
                </div>
              </div>
            ` : '';

            ratingBox.innerHTML = `
              ${liveStreamHtml}"""

if target_str in content:
    content = content.replace(target_str, replacement, 1)
    print("Injected into Standalone Rating Section.")
else:
    print("Could not find Standalone Rating Section target.")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
