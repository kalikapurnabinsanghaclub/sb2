import urllib.request
import json

# 1. Fetch sync_state payload to see what status is recorded there
sync_url = "https://mmbtfbxxnprtzpzdklot.supabase.co/rest/v1/sync_state?id=eq.knsdc_global_sync"
headers = {
    "apikey": "sb_publishable_-WELjPDVV1Bnpee712Hn7Q_9MDwQmSA",
    "Authorization": "Bearer sb_publishable_-WELjPDVV1Bnpee712Hn7Q_9MDwQmSA",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

try:
    # Get state
    req = urllib.request.Request(sync_url, headers=headers)
    with urllib.request.urlopen(req) as response:
        rows = json.loads(response.read().decode())
        if not rows:
            print("No sync state found.")
            exit(1)
        payload = rows[0].get("payload", {})
        judge_agreements = payload.get("judgeAgreements", [])
        
        print("Judge Agreements in sync_state JSON payload:")
        for a in judge_agreements:
            print(f" - ID: {a.get('id')}, Name: {a.get('name')}, Status: {a.get('status')}, Submitted: {a.get('submitted')}")
            
            # If the status is verified/submitted in JSON payload, let's update the database table row!
            if a.get('status') == 'verified' or a.get('submitted') is True:
                id_val = a.get('id')
                update_url = f"https://mmbtfbxxnprtzpzdklot.supabase.co/rest/v1/judge_agreements?id=eq.{id_val}"
                db_obj = {
                    "status": "verified",
                    "submitted": True,
                    "agreed_tc": True,
                    "advance": a.get("advance") or a.get("judgeAdvance") or 0
                }
                
                req_patch = urllib.request.Request(
                    update_url,
                    data=json.dumps(db_obj).encode('utf-8'),
                    headers=headers,
                    method="PATCH"
                )
                with urllib.request.urlopen(req_patch) as patch_response:
                    print(f"   --> Successfully updated table row for ID {id_val} to verified!")

except Exception as e:
    print("Error:", e)
