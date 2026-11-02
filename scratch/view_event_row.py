import urllib.request
import json

url = "https://cquterfxuwafvhnlfjob.supabase.co/rest/v1/events?id=eq.1781271255289"
headers = {
    "apikey": "sb_publishable_7sreVLnqfdTxN3d_4-Jd6w_lzXrleIo",
    "Authorization": "Bearer sb_publishable_7sreVLnqfdTxN3d_4-Jd6w_lzXrleIo"
}

req = urllib.request.Request(url, headers=headers)
try:
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode())
        print(json.dumps(data, indent=2))
except Exception as e:
    print("Error:", e)
