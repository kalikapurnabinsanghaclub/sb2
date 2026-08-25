import urllib.request
import json

url = "https://mmbtfbxxnprtzpzdklot.supabase.co/rest/v1/judge_agreements?id=eq.133491957"
headers = {
    "apikey": "sb_publishable_-WELjPDVV1Bnpee712Hn7Q_9MDwQmSA",
    "Authorization": "Bearer sb_publishable_-WELjPDVV1Bnpee712Hn7Q_9MDwQmSA",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

payload = {
    "status": "verified",
    "submitted": True,
    "agreed_tc": True
}

req = urllib.request.Request(url, data=json.dumps(payload).encode(), headers=headers, method="PATCH")
try:
    with urllib.request.urlopen(req) as response:
        print("Response Code:", response.status)
        print("Response Body:", response.read().decode())
except Exception as e:
    print("Error:", e)
    if hasattr(e, "read"):
        print("Error Body:", e.read().decode())
