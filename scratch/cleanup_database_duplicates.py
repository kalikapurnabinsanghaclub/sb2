import urllib.request
import json

url = "https://mmbtfbxxnprtzpzdklot.supabase.co/rest/v1/sync_state?id=eq.knsdc_global_sync"
headers = {
    "apikey": "sb_publishable_-WELjPDVV1Bnpee712Hn7Q_9MDwQmSA",
    "Authorization": "Bearer sb_publishable_-WELjPDVV1Bnpee712Hn7Q_9MDwQmSA",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

# 1. Fetch current sync state
req_get = urllib.request.Request(url, headers=headers)
try:
    with urllib.request.urlopen(req_get) as response:
        rows = json.loads(response.read().decode())
        if not rows:
            print("No sync state found.")
            exit(1)
        row = rows[0]
        payload = row.get("payload", {})
        host_assignments = payload.get("hostAssignments", [])
        
        print("Original Host Assignments:", len(host_assignments))
        for h in host_assignments:
            print(f" - ID: {h.get('id')}, Name: {h.get('name')}, Email: {h.get('email')}")
        
        # Deduplicate
        deduped = {}
        for h in host_assignments:
            email = h.get("email", "").lower().strip()
            if not email:
                continue
            existing = deduped.get(email)
            if not existing or h.get("id", "") > existing.get("id", ""):
                deduped[email] = h
        
        new_assignments = list(deduped.values())
        print("Deduplicated Host Assignments:", len(new_assignments))
        for h in new_assignments:
            print(f" - ID: {h.get('id')}, Name: {h.get('name')}, Email: {h.get('email')}")
            
        # Update payload
        payload["hostAssignments"] = new_assignments
        
        # 2. Save back to Supabase
        req_patch = urllib.request.Request(
            url,
            data=json.dumps({"payload": payload}).encode('utf-8'),
            headers=headers,
            method="PATCH"
        )
        with urllib.request.urlopen(req_patch) as patch_response:
            print("Successfully updated database sync_state payload.")
            
except Exception as e:
    print("Error during update:", e)
