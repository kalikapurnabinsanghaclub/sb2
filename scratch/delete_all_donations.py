import urllib.request
import urllib.parse
import json

url = "https://mmbtfbxxnprtzpzdklot.supabase.co/rest/v1/donations?id=not.is.null"
headers = {
    "apikey": "sb_publishable_-WELjPDVV1Bnpee712Hn7Q_9MDwQmSA",
    "Authorization": "Bearer sb_publishable_-WELjPDVV1Bnpee712Hn7Q_9MDwQmSA"
}

req = urllib.request.Request(url, method="DELETE", headers=headers)
try:
    with urllib.request.urlopen(req) as response:
        print(f"Status: {response.status}")
        print("Response:", response.read().decode())
except urllib.error.HTTPError as e:
    print(f"Error {e.code}: {e.read().decode()}")
except Exception as e:
    print(f"Error: {e}")
