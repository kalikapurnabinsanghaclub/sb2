import urllib.request
import urllib.parse
import json

url = "https://cquterfxuwafvhnlfjob.supabase.co/rest/v1/donations?id=not.is.null"
headers = {
    "apikey": "sb_publishable_7sreVLnqfdTxN3d_4-Jd6w_lzXrleIo",
    "Authorization": "Bearer sb_publishable_7sreVLnqfdTxN3d_4-Jd6w_lzXrleIo"
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
