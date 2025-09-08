import requests

class McpSdk:
    def __init__(self, base_url):
        self.base_url = base_url
        self.session = requests.Session()

    def login(self, username, password):
        response = self.session.post(f'{self.base_url}/auth/login', json={'username': username, 'password': password})
        response.raise_for_status()
        data = response.json()
        self.session.headers.update({'Authorization': f'Bearer {data["accessToken"]}'})
        return data

    def get_analytics(self):
        response = self.session.get(f'{self.base_url}/api/analytics')
        response.raise_for_status()
        return response.json()

    def get_branding(self):
        response = self.session.get(f'{self.base_url}/api/branding')
        response.raise_for_status()
        return response.json()

    def get_plans(self):
        response = self.session.get(f'{self.base_url}/portal/plans')
        response.raise_for_status()
        return response.json()