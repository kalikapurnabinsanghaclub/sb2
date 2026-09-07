import urllib.request
import json

url = "https://fjscpohgysbelzkrkrxm.supabase.co/rest/v1/events?id=eq.1781271255289"
headers = {
    "apikey": "sb_publishable_veI5vYBOXffm4FSPjobycA_95FiB6a5",
    "Authorization": "Bearer sb_publishable_veI5vYBOXffm4FSPjobycA_95FiB6a5"
}

req = urllib.request.Request(url, headers=headers)
try:
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode())
        print(json.dumps(data, indent=2))
except Exception as e:
    print("Error:", e)
