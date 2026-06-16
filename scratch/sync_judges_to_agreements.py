import urllib.request
import json

url_sync = "https://mmbtfbxxnprtzpzdklot.supabase.co/rest/v1/sync_state?id=eq.knsdc_global_sync"
headers = {
    "apikey": "sb_publishable_-WELjPDVV1Bnpee712Hn7Q_9MDwQmSA",
    "Authorization": "Bearer sb_publishable_-WELjPDVV1Bnpee712Hn7Q_9MDwQmSA",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

try:
    # 1. Fetch sync_state
    req_sync = urllib.request.Request(url_sync, headers=headers)
    with urllib.request.urlopen(req_sync) as response:
        rows = json.loads(response.read().decode())
        if not rows:
            print("No sync state found.")
            exit(1)
        
        row = rows[0]
        payload = row.get("payload", {})
        judges = payload.get("judges", [])
        judge_agreements = payload.get("judgeAgreements", [])
        
        print("Judges in sync_state:", [j.get('name') for j in judges])
        
        # 2. Match and update agreements
        updated_any = False
        for judge in judges:
            judge_name = judge.get("name", "").lower().strip()
            judge_email = judge.get("email", "").lower().strip()
            
            # Find matching agreement in JSON payload
            for a in judge_agreements:
                a_name = a.get("name", "").lower().strip()
                a_email = a.get("email", "").lower().strip()
                
                if (judge_email and judge_email == a_email) or (judge_name and judge_name == a_name):
                    if a.get("status") != "verified" or not a.get("submitted"):
                        print(f"Updating agreement for {a.get('name')} to verified in payload...")
                        a["status"] = "verified"
                        a["submitted"] = True
                        a["agreedTc"] = True
                        updated_any = True
                        
                        # Update in database table judge_agreements
                        id_val = a.get('id')
                        update_url = f"https://mmbtfbxxnprtzpzdklot.supabase.co/rest/v1/judge_agreements?id=eq.{id_val}"
                        db_obj = {
                            "status": "verified",
                            "submitted": True,
                            "agreed_tc": True
                        }
                        req_patch = urllib.request.Request(
                            update_url,
                            data=json.dumps(db_obj).encode('utf-8'),
                            headers=headers,
                            method="PATCH"
                        )
                        with urllib.request.urlopen(req_patch) as patch_response:
                            print(f"  --> Successfully updated table row for ID {id_val} to verified!")

        if updated_any:
            # Save payload back to Supabase
            payload["judgeAgreements"] = judge_agreements
            req_save = urllib.request.Request(
                url_sync,
                data=json.dumps({"payload": payload}).encode('utf-8'),
                headers=headers,
                method="PATCH"
            )
            with urllib.request.urlopen(req_save) as save_response:
                print("Successfully updated sync_state payload.")
        else:
            print("No pending agreements needed updates.")

except Exception as e:
    print("Error:", e)
