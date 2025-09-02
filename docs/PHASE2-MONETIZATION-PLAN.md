# 🚀 เฟส 2: Monetization Phase - แผนการพัฒนา

## 📋 ภาพรวมโครงการ

**ระยะเวลา:** 4 สัปดาห์  
**เป้าหมายหลัก:** สร้างระบบ monetization ที่สมบูรณ์สำหรับ Git Memory MCP Server  
**KPIs เป้าหมาย:**
- 💰 $50K MRR (Monthly Recurring Revenue)
- 👥 500 paying customers
- ⚡ 99.9% payment processing uptime

---

## 💼 Business Model และ Pricing Strategy

### 🎯 Pricing Tiers

#### 🆓 **Free Tier**
- **ราคา:** $0/month
- **เป้าหมาย:** Individual developers
- **ข้อจำกัด:**
  - 5 repositories
  - 1GB storage
  - 100 API calls/hour
  - Basic support

#### ⭐ **Pro Tier**
- **ราคา:** $19/month
- **เป้าหมาย:** Small teams (2-10 developers)
- **คุณสมบัติ:**
  - Unlimited repositories
  - 50GB storage
  - 10,000 API calls/hour
  - Advanced memory analytics
  - Email support
  - Team collaboration features

#### 🏢 **Enterprise Tier**
- **ราคา:** $99/month
- **เป้าหมาย:** Large organizations (10+ developers)
- **คุณสมบัติ:**
  - Unlimited everything
  - SSO integration
  - RBAC (Role-Based Access Control)
  - Priority support
  - Custom integrations
  - SLA guarantee
  - Dedicated account manager

### 📊 Usage-Based Pricing
- **Additional Storage:** $0.10/GB/month
- **Extra API Calls:** $0.001 per call above limit
- **Premium Support:** $500/month for 24/7 support

---

## 🏗️ Technical Architecture

### 🔧 Core Services

#### 1. **Payment Service**
```typescript
class PaymentService {
  // Stripe integration
  async createSubscription(userId: string, planId: string)
  async updateSubscription(subscriptionId: string, newPlanId: string)
  async cancelSubscription(subscriptionId: string)
  async processWebhook(event: StripeEvent)
}
```

#### 2. **Billing Service**
```typescript
class BillingService {
  // Usage calculation and invoicing
  async calculateUsage(userId: string, period: DateRange)
  async generateInvoice(userId: string)
  async handleProration(subscriptionId: string)
}
```

#### 3. **Subscription Service**
```typescript
class SubscriptionService {
  // Subscription management
  async getCurrentPlan(userId: string)
  async upgradePlan(userId: string, newPlanId: string)
  async downgradePlan(userId: string, newPlanId: string)
}
```

#### 4. **Usage Tracking Service**
```typescript
class UsageTrackingService {
  // Real-time usage monitoring
  async trackApiCall(userId: string)
  async trackStorageUsage(userId: string, bytes: number)
  async getCurrentUsage(userId: string)
}
```

### 🗄️ Database Schema

```sql
-- Subscription Plans
CREATE TABLE plans (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  interval VARCHAR(20) NOT NULL, -- 'month' or 'year'
  features JSON NOT NULL,
  max_repositories INTEGER,
  max_storage_gb INTEGER,
  max_api_calls_per_month INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Subscriptions
CREATE TABLE subscriptions (
  id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  stripe_subscription_id VARCHAR(100) UNIQUE,
  plan_id VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL, -- 'active', 'canceled', 'past_due'
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (plan_id) REFERENCES plans(id)
);

-- Usage Records
CREATE TABLE usage_records (
  id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  date DATE NOT NULL,
  api_calls INTEGER DEFAULT 0,
  storage_used_gb DECIMAL(10,3) DEFAULT 0,
  repositories_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(user_id, date)
);

-- Invoices
CREATE TABLE invoices (
  id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  stripe_invoice_id VARCHAR(100) UNIQUE,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(20) NOT NULL, -- 'draft', 'open', 'paid', 'void'
  due_date TIMESTAMP,
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Payment Methods
CREATE TABLE payment_methods (
  id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  stripe_payment_method_id VARCHAR(100) UNIQUE,
  type VARCHAR(20) NOT NULL, -- 'card', 'bank_account'
  last4 VARCHAR(4),
  brand VARCHAR(20),
  exp_month INTEGER,
  exp_year INTEGER,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## 🔌 API Endpoints

### 📋 Plans Management
```typescript
// GET /api/v1/plans
// List all available subscription plans
interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  limits: {
    repositories: number | null;
    storageGB: number | null;
    apiCallsPerMonth: number | null;
  };
}
```

### 💳 Subscription Management
```typescript
// POST /api/v1/subscriptions
// Create new subscription
interface CreateSubscriptionRequest {
  planId: string;
  paymentMethodId: string;
}

// GET /api/v1/subscriptions/current
// Get current subscription details
interface CurrentSubscription {
  id: string;
  plan: Plan;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

// PUT /api/v1/subscriptions/plan
// Change subscription plan
interface ChangePlanRequest {
  newPlanId: string;
  prorationBehavior?: 'create_prorations' | 'none';
}

// DELETE /api/v1/subscriptions
// Cancel subscription
interface CancelSubscriptionRequest {
  cancelAtPeriodEnd: boolean;
}
```

### 📊 Billing และ Usage
```typescript
// GET /api/v1/billing/usage
// Get current usage statistics
interface UsageStats {
  currentPeriod: {
    start: string;
    end: string;
  };
  usage: {
    apiCalls: number;
    storageGB: number;
    repositories: number;
  };
  limits: {
    apiCalls: number | null;
    storageGB: number | null;
    repositories: number | null;
  };
  percentageUsed: {
    apiCalls: number;
    storage: number;
    repositories: number;
  };
}

// GET /api/v1/billing/invoices
// List user invoices
interface Invoice {
  id: string;
  amount: number;
  currency: string;
  status: string;
  dueDate: string;
  paidAt?: string;
  downloadUrl: string;
}
```

### 💰 Payment Methods
```typescript
// POST /api/v1/billing/payment-methods
// Add new payment method
interface AddPaymentMethodRequest {
  paymentMethodId: string; // From Stripe Elements
  setAsDefault?: boolean;
}

// GET /api/v1/billing/payment-methods
// List payment methods
interface PaymentMethod {
  id: string;
  type: string;
  last4: string;
  brand?: string;
  expMonth?: number;
  expYear?: number;
  isDefault: boolean;
}
```

---

## 🛡️ Middleware และ Security

### 🚦 Usage Tracking Middleware
```typescript
class UsageTrackingMiddleware {
  async trackApiCall(req: Request, res: Response, next: NextFunction) {
    const userId = req.user.id;
    const endpoint = req.path;
    
    // Track API call
    await this.usageService.incrementApiCall(userId, endpoint);
    
    // Check rate limits
    const usage = await this.usageService.getCurrentUsage(userId);
    const subscription = await this.subscriptionService.getCurrentPlan(userId);
    
    if (this.isRateLimitExceeded(usage, subscription)) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        upgradeUrl: '/billing/upgrade'
      });
    }
    
    next();
  }
}
```

### 🔒 Feature Gate Middleware
```typescript
class FeatureGateMiddleware {
  requiresPlan(requiredPlan: 'pro' | 'enterprise') {
    return async (req: Request, res: Response, next: NextFunction) => {
      const userId = req.user.id;
      const subscription = await this.subscriptionService.getCurrentPlan(userId);
      
      if (!this.hasAccess(subscription.plan, requiredPlan)) {
        return res.status(403).json({
          error: 'Feature requires upgrade',
          currentPlan: subscription.plan.name,
          requiredPlan,
          upgradeUrl: '/billing/upgrade'
        });
      }
      
      next();
    };
  }
}
```

---

## 🎨 Frontend Components

### 📊 Billing Dashboard
```typescript
interface BillingDashboardProps {
  subscription: CurrentSubscription;
  usage: UsageStats;
  invoices: Invoice[];
}

const BillingDashboard: React.FC<BillingDashboardProps> = ({
  subscription,
  usage,
  invoices
}) => {
  return (
    <div className="billing-dashboard">
      <SubscriptionCard subscription={subscription} />
      <UsageChart usage={usage} />
      <InvoiceList invoices={invoices} />
      <PaymentMethodManager />
    </div>
  );
};
```

### 🎯 Plan Selector
```typescript
interface PlanSelectorProps {
  plans: Plan[];
  currentPlan?: Plan;
  onSelectPlan: (planId: string) => void;
}

const PlanSelector: React.FC<PlanSelectorProps> = ({
  plans,
  currentPlan,
  onSelectPlan
}) => {
  return (
    <div className="plan-selector">
      {plans.map(plan => (
        <PlanCard
          key={plan.id}
          plan={plan}
          isCurrentPlan={currentPlan?.id === plan.id}
          onSelect={() => onSelectPlan(plan.id)}
        />
      ))}
    </div>
  );
};
```

---

## 📅 Implementation Timeline

### 📅 **สัปดาห์ที่ 1: Foundation Setup**

#### 🎯 **วันที่ 1-2: Stripe Integration**
- [ ] ตั้งค่า Stripe account และ webhooks
- [ ] สร้าง PaymentService class
- [ ] Implement basic subscription creation
- [ ] Test payment flow

#### 🎯 **วันที่ 3-4: Database Schema**
- [ ] สร้าง migration files สำหรับ billing tables
- [ ] Update Prisma schema
- [ ] Seed initial plan data
- [ ] Test database operations

#### 🎯 **วันที่ 5-7: Core APIs**
- [ ] Implement subscription management APIs
- [ ] Create billing endpoints
- [ ] Add payment method management
- [ ] Write API tests

### 📅 **สัปดาห์ที่ 2: Usage Tracking & Limits**

#### 🎯 **วันที่ 8-10: Usage Middleware**
- [ ] สร้าง UsageTrackingMiddleware
- [ ] Implement rate limiting logic
- [ ] Add Redis caching for performance
- [ ] Test usage tracking accuracy

#### 🎯 **วันที่ 11-12: Feature Gates**
- [ ] สร้าง FeatureGateMiddleware
- [ ] Implement plan-based access control
- [ ] Add storage limit enforcement
- [ ] Test feature restrictions

#### 🎯 **วันที่ 13-14: Webhook Handling**
- [ ] Implement Stripe webhook handlers
- [ ] Handle subscription updates
- [ ] Process payment failures
- [ ] Test webhook reliability

### 📅 **สัปดาห์ที่ 3: Frontend Development**

#### 🎯 **วันที่ 15-17: Billing Dashboard**
- [ ] สร้าง BillingDashboard component
- [ ] Implement UsageChart visualization
- [ ] Add subscription management UI
- [ ] Style responsive design

#### 🎯 **วันที่ 18-19: Payment Management**
- [ ] สร้าง PaymentMethodManager
- [ ] Implement plan upgrade/downgrade UI
- [ ] Add invoice download functionality
- [ ] Test payment flows

#### 🎯 **วันที่ 20-21: Plan Selection**
- [ ] สร้าง PlanSelector component
- [ ] Implement pricing comparison
- [ ] Add upgrade prompts
- [ ] Test user experience

### 📅 **สัปดาห์ที่ 4: Testing & Deployment**

#### 🎯 **วันที่ 22-24: Comprehensive Testing**
- [ ] Unit tests สำหรับ billing services
- [ ] Integration tests สำหรับ payment flow
- [ ] End-to-end tests สำหรับ subscription management
- [ ] Load testing สำหรับ usage tracking

#### 🎯 **วันที่ 25-26: Security Audit**
- [ ] Security review สำหรับ payment handling
- [ ] Penetration testing
- [ ] Compliance check (PCI DSS)
- [ ] Fix security issues

#### 🎯 **วันที่ 27-28: Deployment & Documentation**
- [ ] Deploy to production environment
- [ ] Update API documentation
- [ ] Create billing user guide
- [ ] Monitor system performance

---

## 📈 Success Metrics

### 💰 **Revenue Metrics**
- **MRR Growth:** Target $50K by end of phase
- **Customer Acquisition:** 500 paying customers
- **Conversion Rate:** 15% from free to paid
- **Churn Rate:** <5% monthly

### ⚡ **Technical Metrics**
- **Payment Success Rate:** >99.5%
- **API Response Time:** <100ms for billing endpoints
- **System Uptime:** 99.9%
- **Usage Tracking Accuracy:** 99.99%

### 👥 **User Experience Metrics**
- **Billing Dashboard Load Time:** <2 seconds
- **Payment Flow Completion:** >95%
- **Customer Support Tickets:** <10 per week
- **User Satisfaction Score:** >4.5/5

---

## 🚨 Risk Management

### ⚠️ **Technical Risks**
1. **Stripe Integration Issues**
   - **Mitigation:** Thorough testing, backup payment processor
2. **Usage Tracking Accuracy**
   - **Mitigation:** Multiple validation layers, audit logs
3. **Performance Impact**
   - **Mitigation:** Caching, async processing, monitoring

### 💼 **Business Risks**
1. **Low Conversion Rate**
   - **Mitigation:** A/B test pricing, improve free tier value
2. **High Churn Rate**
   - **Mitigation:** Better onboarding, customer success program
3. **Competitive Pressure**
   - **Mitigation:** Unique features, superior UX, customer lock-in

---

## 🎯 Next Steps

1. **เริ่มต้นการพัฒนา:** ตั้งค่า Stripe account และเริ่ม implementation
2. **Team Assignment:** มอบหมายงานตาม expertise ของแต่ละคน
3. **Daily Standups:** ติดตามความคืบหน้าและแก้ไขปัญหา
4. **Weekly Reviews:** ประเมินผลและปรับแผนตามความจำเป็น

**🚀 พร้อมเริ่มต้นเฟส 2: Monetization Phase!**