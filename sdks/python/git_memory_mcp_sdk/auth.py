import requests

class Auth:
    def __init__(self, base_url, username=None, password=None):
        self.base_url = base_url
        self.username = username
        self.password = password
        self.token = None

    def get_token(self):
        if not self.token:
            self.login()
        return self.token

    def login(self):
        if not self.username or not self.password:
            return
        try:
            response = requests.post(f'{self.base_url}/auth/login', json={
                'username': self.username,
                'password': self.password
            })
            response.raise_for_status()
            self.token = response.json().get('token')
        except requests.exceptions.RequestException as e:
            print(f'Failed to login: {e}')
            raise ConnectionError('Authentication failed')