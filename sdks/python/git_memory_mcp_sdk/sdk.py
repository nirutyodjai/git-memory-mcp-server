from .api import API
from .auth import Auth

class MCP_SDK:
    def __init__(self, base_url, username=None, password=None):
        self.auth = Auth(base_url, username, password)
        self.api = API(self.auth)

    # Subscription
    def get_subscription_plans(self):
        return self.api.get('/subscriptions/plans')

    def get_current_subscription(self):
        return self.api.get('/subscriptions/current')

    def create_subscription(self, plan_id):
        return self.api.post('/subscriptions/create', {'planId': plan_id})

    def cancel_subscription(self):
        return self.api.post('/subscriptions/cancel')

    # Payment
    def get_invoices(self):
        return self.api.get('/payments/invoices')

    def get_payment_history(self):
        return self.api.get('/payments/history')

    # Marketplace
    def get_marketplace_servers(self):
        return self.api.get('/community-marketplace/servers')

    # Professional Services
    def get_professional_services(self):
        return self.api.get('/api/professional-services')