import sys

path = r'c:\Users\sourav pc\Desktop\kalikapur\index.html'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# The target area to insert is right before the rating section
target_comment = "              <!-- ★ Public Rating Submission Section (Below On Stage Now) ★ -->"

live_broadcast_html = """
              <!-- ★ Live Broadcast Section ★ -->
              ${(ev.switchStates && ev.switchStates.liveStream && ev.switchStates.liveStreamUrl) ? `
              <div style="margin-top: 24px; background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%); border-radius: 20px; padding: 24px 32px; border: 2px solid rgba(255,255,255,0.2); position: relative; overflow: hidden; box-shadow: 0 8px 32px rgba(239, 68, 68, 0.3);">
                <div style="position:absolute; top:-40px; right:-40px; font-size:120px; opacity:0.1; pointer-events:none;">🎥</div>
                <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 20px;">
                  <div style="display: flex; align-items: center; gap: 16px;">
                    <div style="width: 50px; height: 50px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; box-shadow: 0 4px 15px rgba(0,0,0,0.2); animation: pulse 2s infinite;">🔴</div>
                    <div style="position:relative; z-index:1;">
                      <h4 style="color: white; font-family: 'Cinzel Decorative', cursive; font-size: 1.3rem; margin: 0; letter-spacing: 1.5px; text-transform: uppercase;">Live Broadcast</h4>
                      <p style="color: rgba(255,255,255,0.9); font-size: 0.9rem; margin: 4px 0 0; font-weight: 600;">Stream to YouTube / Facebook Live is on!</p>
                    </div>
                  </div>
                  <a href="${ev.switchStates.liveStreamUrl.replace(/'/g, '&apos;').replace(/\"/g, '&quot;')}" target="_blank" style="background: white; color: #dc2626; padding: 14px 28px; border-radius: 12px; font-weight: 900; text-decoration: none; font-size: 1rem; box-shadow: 0 4px 15px rgba(0,0,0,0.2); display: inline-block; position: relative; z-index: 1;">▶ Watch Live Streaming</a>
                </div>
              </div>
              ` : ''}
"""

if target_comment in content:
    content = content.replace(target_comment, live_broadcast_html + "\n" + target_comment)
    print("Injected into dynamicLiveContainer (On Stage event).")
else:
    print("Could not find dynamicLiveContainer target.")

# Let's also add it to the standalone rating section just in case they don't have anyone on stage but want to stream.
target_comment_2 = "                <!-- --- Standalone Public Rating Section (white area below results) --- -->"
# Wait, the comment in code is: "        // --- Standalone Public Rating Section (white area below results) ---"
standalone_target = "        // --- Standalone Public Rating Section (white area below results) ---"

if standalone_target in content:
    # Actually, standalone has a different variable for active event. `evObj` or `activeEv`.
    # I can just put it above `ratingBox.style.display = 'block';` or directly in the HTML.
    # It's better to just keep it in the dynamicLiveContainer where the stage is shown, since Live stream is usually tied to the stage.
    pass

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
