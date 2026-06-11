import urllib.request
import json

url = "https://mmbtfbxxnprtzpzdklot.supabase.co/rest/v1/sync_state?id=eq.knsdc_global_sync"
headers = {
    "apikey": "sb_publishable_-WELjPDVV1Bnpee712Hn7Q_9MDwQmSA",
    "Authorization": "Bearer sb_publishable_-WELjPDVV1Bnpee712Hn7Q_9MDwQmSA"
}

req = urllib.request.Request(url, headers=headers)
try:
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode())
        if data:
            payload = data[0].get('payload', {})
            print(f"systemStatus in DB: {payload.get('systemStatus', 'NOT SET')}")
        else:
            print("No data found")
except Exception as e:
    print(f"Error: {e}")
