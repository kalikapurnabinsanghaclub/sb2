import urllib.request
import json

url = "https://mmbtfbxxnprtzpzdklot.supabase.co/rest/v1/sync_state?id=eq.knsdc_global_sync"
headers = {
    "apikey": "sb_publishable_-WELjPDVV1Bnpee712Hn7Q_9MDwQmSA",
    "Authorization": "Bearer sb_publishable_-WELjPDVV1Bnpee712Hn7Q_9MDwQmSA",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

try:
    # 1. Fetch current sync state
    req_get = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req_get) as response:
        rows = json.loads(response.read().decode())
        if not rows:
            print("No sync state found.")
            exit(1)
        row = rows[0]
        payload = row.get("payload", {})
        
        # Remove agreements keys
        if "agreements" in payload:
            del payload["agreements"]
            print("Deleted 'agreements' key from payload.")
        if "judgeAgreements" in payload:
            del payload["judgeAgreements"]
            print("Deleted 'judgeAgreements' key from payload.")
            
        # 2. Save back to Supabase
        req_patch = urllib.request.Request(
            url,
            data=json.dumps({"payload": payload}).encode('utf-8'),
            headers=headers,
            method="PATCH"
        )
        with urllib.request.urlopen(req_patch) as patch_response:
            print("Successfully cleaned up sync_state payload.")
            
except Exception as e:
    print("Error:", e)
