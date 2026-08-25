import sys

path = r'c:\Users\sourav pc\Desktop\kalikapur\index.html'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the first instance (dynamicLiveContainer)
old_cond_1 = "${(ev.switchStates && ev.switchStates.liveStream && ev.switchStates.liveStreamUrl) ? `"
new_cond_1 = "${((ev.switchStates?.liveStream || state.switchStates?.liveStream) && (ev.switchStates?.liveStreamUrl || state.switchStates?.liveStreamUrl)) ? `"

# Also need to fix the URL inside it
old_href_1 = """href="${ev.switchStates.liveStreamUrl.replace(/'/g, '&apos;').replace(/\"/g, '&quot;')}\""""
new_href_1 = """href="${(ev.switchStates?.liveStreamUrl || state.switchStates?.liveStreamUrl || '').replace(/'/g, '&apos;').replace(/\"/g, '&quot;')}\""""

if old_cond_1 in content:
    content = content.replace(old_cond_1, new_cond_1)
    content = content.replace(old_href_1, new_href_1)
    print("Fixed dynamicLiveContainer condition")

# Replace the second instance (standalone)
old_cond_2 = "const liveStreamHtml = (evObj?.switchStates?.liveStream && evObj?.switchStates?.liveStreamUrl) ? `"
new_cond_2 = "const liveStreamHtml = ((evObj?.switchStates?.liveStream || state.switchStates?.liveStream) && (evObj?.switchStates?.liveStreamUrl || state.switchStates?.liveStreamUrl)) ? `"

old_href_2 = """href="${evObj.switchStates.liveStreamUrl.replace(/'/g, '&apos;').replace(/\"/g, '&quot;')}\""""
new_href_2 = """href="${(evObj?.switchStates?.liveStreamUrl || state.switchStates?.liveStreamUrl || '').replace(/'/g, '&apos;').replace(/\"/g, '&quot;')}\""""

if old_cond_2 in content:
    content = content.replace(old_cond_2, new_cond_2)
    content = content.replace(old_href_2, new_href_2)
    print("Fixed standalone condition")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
