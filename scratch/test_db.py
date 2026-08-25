import os
import json
import urllib.request

env = {}
with open('.env', 'r', encoding='utf-8') as f:
    for line in f:
        if '=' in line:
            k, v = line.strip().split('=', 1)
            env[k] = v.strip('\"\'')

url = env.get('VITE_SUPABASE_URL')
key = env.get('VITE_SUPABASE_ANON_KEY')

headers = {
    'apikey': key,
    'Authorization': f'Bearer ' + key,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
}

def make_req(endpoint, method='GET', data=None):
    req = urllib.request.Request(url + endpoint, headers=headers, method=method)
    if data:
        req.data = json.dumps(data).encode('utf-8')
    try:
        with urllib.request.urlopen(req) as response:
            return response.status, response.read().decode('utf-8')
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode('utf-8')

print('admin_list_staff:', make_req('/rest/v1/rpc/admin_list_staff', 'POST'))

test_payload = {
    'p_email': 'testhost99@example.com',
    'p_password': 'password123',
    'p_name': 'Test Host 99',
    'p_role': 'host'
}
print('admin_upsert_staff:', make_req('/rest/v1/rpc/admin_upsert_staff', 'POST', test_payload))
print('table read:', make_req('/rest/v1/staff_credentials?select=email,name,role', 'GET'))
