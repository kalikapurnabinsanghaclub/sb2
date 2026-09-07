import urllib.request
import json

url = "https://fjscpohgysbelzkrkrxm.supabase.co/rest/v1/judge_agreements?select=id,name,email,status,submitted"
headers = {
    "apikey": "sb_publishable_veI5vYBOXffm4FSPjobycA_95FiB6a5",
    "Authorization": "Bearer sb_publishable_veI5vYBOXffm4FSPjobycA_95FiB6a5"
}

req = urllib.request.Request(url, headers=headers)
try:
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode())
        print("Judge Agreements in Table:")
        for row in data:
            print(f" - ID: {row.get('id')}, Name: {row.get('name')}, Email: {row.get('email')}, Status: {row.get('status')}, Submitted: {row.get('submitted')}")
except Exception as e:
    print("Error:", e)
