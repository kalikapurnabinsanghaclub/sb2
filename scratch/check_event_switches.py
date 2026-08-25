import urllib.request
import json

url_events = "https://mmbtfbxxnprtzpzdklot.supabase.co/rest/v1/events?select=id,name,switch_states"
headers = {
    "apikey": "sb_publishable_-WELjPDVV1Bnpee712Hn7Q_9MDwQmSA",
    "Authorization": "Bearer sb_publishable_-WELjPDVV1Bnpee712Hn7Q_9MDwQmSA"
}

try:
    # Check events table
    req_events = urllib.request.Request(url_events, headers=headers)
    with urllib.request.urlopen(req_events) as response:
        data = json.loads(response.read().decode())
        print("Events in Table:")
        for ev in data:
            print(f" - ID: {ev.get('id')}, Name: {ev.get('name')}, switch_states: {ev.get('switch_states')}")
            
    # Check sync_state payload
    url_sync = "https://mmbtfbxxnprtzpzdklot.supabase.co/rest/v1/sync_state?id=eq.knsdc_global_sync"
    req_sync = urllib.request.Request(url_sync, headers=headers)
    with urllib.request.urlopen(req_sync) as response:
        rows = json.loads(response.read().decode())
        if rows:
            payload = rows[0].get("payload", {})
            print("Active Event ID in sync_state:", payload.get("activeEventId"))
            print("eventSwitches in sync_state:", payload.get("eventSwitches"))
            print("switchStates in sync_state:", payload.get("switchStates"))
except Exception as e:
    print("Error:", e)
