import requests

class API:
    def __init__(self, auth):
        self.auth = auth
        self.client = requests.Session()
        self.client.headers.update({'Content-Type': 'application/json'})

    def _get_headers(self):
        token = self.auth.get_token()
        if token:
            return {'Authorization': f'Bearer {token}'}
        return {}

    def get(self, endpoint):
        headers = self._get_headers()
        response = self.client.get(f'{self.auth.base_url}{endpoint}', headers=headers)
        response.raise_for_status()
        return response.json()

    def post(self, endpoint, data=None):
        headers = self._get_headers()
        response = self.client.post(f'{self.auth.base_url}{endpoint}', json=data, headers=headers)
        response.raise_for_status()
        return response.json()

    def put(self, endpoint, data=None):
        headers = self._get_headers()
        response = self.client.put(f'{self.auth.base_url}{endpoint}', json=data, headers=headers)
        response.raise_for_status()
        return response.json()

    def delete(self, endpoint):
        headers = self._get_headers()
        response = self.client.delete(f'{self.auth.base_url}{endpoint}', headers=headers)
        response.raise_for_status()
        return response.json()