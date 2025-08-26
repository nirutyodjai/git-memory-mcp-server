# Analytics Setup Guide

This guide will help you set up comprehensive analytics tracking for the Git Memory MCP Server website.

## 🎯 Analytics Overview

We've implemented a dual analytics approach:
- **Google Analytics 4 (GA4)**: For comprehensive web analytics
- **Mixpanel** (Optional): For detailed event tracking and user behavior analysis

## 📊 What We Track

### Page Analytics
- Page views and unique visitors
- Session duration and bounce rate
- Traffic sources and referrers
- Device and browser information
- Geographic data

### User Interactions
- Pricing plan views and clicks
- Feature section interactions
- Button clicks and form submissions
- Download attempts
- Navigation patterns

### Conversion Funnel
- Landing page → Pricing view
- Pricing view → Plan selection
- Plan selection → Sign up intent
- Contact form submissions

## 🚀 Setup Instructions

### 1. Google Analytics 4 Setup

#### Step 1: Create GA4 Property
1. Go to [Google Analytics](https://analytics.google.com/)
2. Create a new GA4 property
3. Get your Measurement ID (format: `G-XXXXXXXXXX`)

#### Step 2: Configure Environment Variables
1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Add your GA4 Measurement ID:
   ```env
   NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
   NEXT_PUBLIC_ENABLE_ANALYTICS=true
   ```

#### Step 3: Verify Installation
1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open your website and check:
   - Browser Developer Tools → Network tab
   - Look for requests to `google-analytics.com`
   - Use [GA Debugger Chrome Extension](https://chrome.google.com/webstore/detail/google-analytics-debugger/jnkmfdileelhofjcijamephohjechhna)

### 2. Mixpanel Setup (Optional)

#### Step 1: Create Mixpanel Project
1. Go to [Mixpanel](https://mixpanel.com/)
2. Create a new project
3. Get your Project Token

#### Step 2: Install Mixpanel
```bash
npm install mixpanel-browser
```

#### Step 3: Configure Environment Variables
```env
NEXT_PUBLIC_MIXPANEL_TOKEN=your_mixpanel_token_here
NEXT_PUBLIC_ENABLE_MIXPANEL=true
```

## 📈 Analytics Dashboard

We've created a custom analytics dashboard component that you can use to view key metrics:

### Accessing the Dashboard
1. The dashboard is available at `/analytics` (you'll need to create this route)
2. Key metrics displayed:
   - Page views and unique visitors
   - Conversion rates
   - Revenue tracking
   - Top performing pages
   - User engagement metrics
   - Pricing plan interactions

### Creating the Analytics Route
Create `pages/analytics.js`:
```javascript
import AnalyticsDashboard from '../components/AnalyticsDashboard';

export default function AnalyticsPage() {
  return <AnalyticsDashboard />;
}
```

## 🔍 Event Tracking

### Automatic Tracking
The following events are tracked automatically:
- Page views on route changes
- User engagement time
- Pricing plan views (when they come into viewport)
- Pricing plan clicks

### Custom Event Tracking
You can track custom events using our helper functions:

```javascript
import { event } from '../lib/gtag';
import { trackEvent } from '../lib/mixpanel';

// Track button clicks
const handleButtonClick = () => {
  event({
    action: 'click',
    category: 'Button',
    label: 'Header CTA',
  });
  
  trackEvent('Button Click', {
    button_name: 'Header CTA',
    location: 'header',
  });
};

// Track feature interactions
const handleFeatureClick = (featureName) => {
  event({
    action: 'interact',
    category: 'Feature',
    label: featureName,
  });
  
  trackEvent('Feature Interaction', {
    feature: featureName,
    action: 'click',
  });
};
```

## 📊 Key Metrics to Monitor

### Traffic Metrics
- **Page Views**: Total number of pages viewed
- **Unique Visitors**: Number of individual users
- **Session Duration**: Average time spent on site
- **Bounce Rate**: Percentage of single-page sessions
- **Pages per Session**: Average pages viewed per visit

### Conversion Metrics
- **Pricing Page Views**: How many people view pricing
- **Plan Click Rate**: Percentage who click on pricing plans
- **Contact Form Submissions**: Lead generation metric
- **Download Attempts**: Interest in the product

### Engagement Metrics
- **Feature Section Views**: Which features get attention
- **Scroll Depth**: How far users scroll on pages
- **Time on Pricing Page**: Engagement with pricing content
- **Return Visitors**: User retention

## 🎯 Conversion Funnel Analysis

### Funnel Steps
1. **Landing**: User arrives on homepage
2. **Interest**: User scrolls to features or pricing
3. **Consideration**: User views pricing plans
4. **Intent**: User clicks on a pricing plan
5. **Action**: User submits contact form or signs up

### Tracking Funnel Steps
```javascript
import { trackFunnelStep } from '../lib/mixpanel';

// Track when user reaches pricing section
trackFunnelStep(3, 'Pricing View', {
  source_page: 'homepage',
  scroll_depth: '75%',
});

// Track plan selection
trackFunnelStep(4, 'Plan Selection', {
  plan_name: 'Pro',
  plan_price: '$19',
});
```

## 🔒 Privacy and Compliance

### GDPR Compliance
- Analytics are configured to respect user privacy
- No personally identifiable information is tracked
- Users can opt-out of tracking

### Data Retention
- Google Analytics: 14 months (configurable)
- Mixpanel: 5 years (configurable)

## 🚨 Troubleshooting

### Common Issues

#### Analytics Not Working
1. Check environment variables are set correctly
2. Verify GA4 Measurement ID format
3. Check browser console for errors
4. Ensure ad blockers aren't interfering

#### Events Not Firing
1. Check network tab for analytics requests
2. Verify event parameters are correct
3. Test in incognito mode
4. Use GA Debugger extension

#### Dashboard Not Loading
1. Check if analytics data is available
2. Verify API permissions
3. Check for JavaScript errors
4. Ensure proper authentication

## 📚 Additional Resources

- [Google Analytics 4 Documentation](https://developers.google.com/analytics/devguides/collection/ga4)
- [Mixpanel Documentation](https://developer.mixpanel.com/)
- [Next.js Analytics Guide](https://nextjs.org/docs/basic-features/built-in-css-support)
- [Web Analytics Best Practices](https://web.dev/analytics/)

## 🔄 Regular Maintenance

### Weekly Tasks
- Review key metrics in GA4 dashboard
- Check for any tracking errors
- Monitor conversion funnel performance

### Monthly Tasks
- Analyze traffic trends and patterns
- Review and optimize conversion rates
- Update tracking for new features
- Generate performance reports

### Quarterly Tasks
- Review and update analytics goals
- Audit tracking implementation
- Analyze user behavior patterns
- Plan improvements based on data

---

*Last Updated: January 2025*
*Next Review: April 2025*