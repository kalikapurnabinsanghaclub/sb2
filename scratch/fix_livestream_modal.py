import sys

path = r'c:\Users\sourav pc\Desktop\kalikapur\index.html'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

target_str = "            <!-- ★ Public Rating Slider (Inside renderLiveUI) ★ -->"

live_stream_html = """            <!-- ★ Live Broadcast Section (Inside renderLiveUI) ★ -->
            ${((ev.switchStates?.liveStream || state.switchStates?.liveStream) && (ev.switchStates?.liveStreamUrl || state.switchStates?.liveStreamUrl)) ? `
              <div style="margin-bottom: 40px; background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%); border-radius: 24px; padding: 30px 40px; border: 2px solid rgba(255,255,255,0.2); position: relative; overflow: hidden; box-shadow: 0 8px 32px rgba(239, 68, 68, 0.3);">
                <div style="position:absolute; top:-40px; right:-40px; font-size:120px; opacity:0.1; pointer-events:none;">🎥</div>
                <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 20px;">
                  <div style="display: flex; align-items: center; gap: 20px;">
                    <div style="width: 56px; height: 56px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.8rem; box-shadow: 0 4px 15px rgba(0,0,0,0.2); animation: pulse 2s infinite;">🔴</div>
                    <div style="position:relative; z-index:1; text-align: left;">
                      <h4 style="color: white; font-family: 'Cinzel Decorative', cursive; font-size: 1.4rem; margin: 0; letter-spacing: 1.5px; text-transform: uppercase;">Live Broadcast</h4>
                      <p style="color: rgba(255,255,255,0.9); font-size: 1rem; margin: 4px 0 0; font-weight: 600;">Stream to YouTube / Facebook Live is on!</p>
                    </div>
                  </div>
                  <a href="${(ev.switchStates?.liveStreamUrl || state.switchStates?.liveStreamUrl || '').replace(/'/g, '&apos;').replace(/\"/g, '&quot;')}" target="_blank" style="background: white; color: #dc2626; padding: 16px 32px; border-radius: 12px; font-weight: 900; text-decoration: none; font-size: 1.1rem; box-shadow: 0 4px 15px rgba(0,0,0,0.2); display: inline-block; position: relative; z-index: 1; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">▶ Watch Live Streaming</a>
                </div>
              </div>
            ` : ''}

"""

if target_str in content:
    content = content.replace(target_str, live_stream_html + target_str)
    print("Injected into renderLiveUI modal.")
else:
    print("Could not find renderLiveUI target.")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
