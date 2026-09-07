import urllib.request
import json

url = "https://fjscpohgysbelzkrkrxm.supabase.co/rest/v1/sync_state?id=eq.knsdc_global_sync"
headers = {
    "apikey": "sb_publishable_veI5vYBOXffm4FSPjobycA_95FiB6a5",
    "Authorization": "Bearer sb_publishable_veI5vYBOXffm4FSPjobycA_95FiB6a5"
}

req = urllib.request.Request(url, headers=headers)
try:
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode())
        if data:
            row = data[0]
            print("Payload Keys:", row.get("payload", {}).keys())
            print("Judge Agreements in Payload:", row.get("payload", {}).get("judgeAgreements"))
        else:
            print("No data found")
except Exception as e:
    print("Error:", e)
