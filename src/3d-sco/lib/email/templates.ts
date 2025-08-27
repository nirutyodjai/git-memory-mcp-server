export interface EmailTemplateData {
  id: string;
  name: string;
  subject: string;
  category: 'newsletter' | 'marketing' | 'transactional' | 'welcome' | 'notification';
  htmlContent: string;
  textContent?: string;
  variables: string[];
  preview?: string;
}

export const EMAIL_TEMPLATES: EmailTemplateData[] = [
  {
    id: 'welcome-newsletter',
    name: 'Welcome Newsletter',
    subject: 'Welcome to Our Newsletter! 🎉',
    category: 'welcome',
    variables: ['firstName', 'lastName', 'email'],
    preview: 'Thank you for subscribing to our newsletter...',
    htmlContent: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Our Newsletter</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Welcome to Our Newsletter! 🎉</h1>
        <p>Thank you for joining our community</p>
    </div>
    <div class="content">
        <h2>Hello {{firstName}}!</h2>
        <p>We're thrilled to have you as part of our community. You've successfully subscribed to our newsletter with the email address: <strong>{{email}}</strong></p>
        
        <p>Here's what you can expect from us:</p>
        <ul>
            <li>📰 Weekly updates on the latest trends</li>
            <li>🎯 Exclusive content and insights</li>
            <li>🎁 Special offers and promotions</li>
            <li>💡 Tips and tutorials</li>
        </ul>
        
        <p>We promise to deliver valuable content directly to your inbox and respect your privacy.</p>
        
        <a href="#" class="button">Explore Our Website</a>
        
        <p>If you have any questions, feel free to reply to this email. We'd love to hear from you!</p>
        
        <p>Best regards,<br>The Team</p>
    </div>
    <div class="footer">
        <p>You received this email because you subscribed to our newsletter.</p>
        <p><a href="#">Unsubscribe</a> | <a href="#">Update Preferences</a></p>
    </div>
</body>
</html>
    `,
    textContent: `
Welcome to Our Newsletter!

Hello {{firstName}}!

We're thrilled to have you as part of our community. You've successfully subscribed to our newsletter with the email address: {{email}}

Here's what you can expect from us:
- Weekly updates on the latest trends
- Exclusive content and insights
- Special offers and promotions
- Tips and tutorials

We promise to deliver valuable content directly to your inbox and respect your privacy.

If you have any questions, feel free to reply to this email. We'd love to hear from you!

Best regards,
The Team

You received this email because you subscribed to our newsletter.
Unsubscribe: [link] | Update Preferences: [link]
    `
  },
  {
    id: 'monthly-newsletter',
    name: 'Monthly Newsletter',
    subject: '📰 Monthly Update - {{month}} {{year}}',
    category: 'newsletter',
    variables: ['firstName', 'month', 'year', 'featuredArticle', 'secondaryArticles'],
    preview: 'Your monthly dose of insights and updates...',
    htmlContent: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Monthly Newsletter</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2c3e50; color: white; padding: 30px; text-align: center; }
        .content { background: white; padding: 30px; }
        .article { border-left: 4px solid #3498db; padding-left: 20px; margin: 20px 0; }
        .button { display: inline-block; background: #3498db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; border-top: 1px solid #eee; padding-top: 20px; }
        .social { margin: 20px 0; }
        .social a { display: inline-block; margin: 0 10px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>📰 Monthly Update</h1>
        <p>{{month}} {{year}} Edition</p>
    </div>
    <div class="content">
        <h2>Hello {{firstName}}!</h2>
        <p>Welcome to our monthly newsletter! Here are the highlights from this month:</p>
        
        <div class="article">
            <h3>🌟 Featured Article</h3>
            <p>{{featuredArticle}}</p>
            <a href="#" class="button">Read More</a>
        </div>
        
        <div class="article">
            <h3>📚 More Articles</h3>
            <p>{{secondaryArticles}}</p>
            <a href="#" class="button">View All Articles</a>
        </div>
        
        <div class="social">
            <h3>Follow Us</h3>
            <a href="#">Facebook</a>
            <a href="#">Twitter</a>
            <a href="#">LinkedIn</a>
            <a href="#">Instagram</a>
        </div>
    </div>
    <div class="footer">
        <p>Thank you for being a valued subscriber!</p>
        <p><a href="#">Unsubscribe</a> | <a href="#">Update Preferences</a> | <a href="#">Forward to a Friend</a></p>
    </div>
</body>
</html>
    `
  },
  {
    id: 'product-announcement',
    name: 'Product Announcement',
    subject: '🚀 Introducing {{productName}} - You\'ll Love This!',
    category: 'marketing',
    variables: ['firstName', 'productName', 'productDescription', 'productPrice', 'productImage'],
    preview: 'Exciting news! We have something special for you...',
    htmlContent: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Product Announcement</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; padding: 30px; text-align: center; }
        .content { background: white; padding: 30px; }
        .product { text-align: center; margin: 30px 0; padding: 20px; border: 2px solid #f1f1f1; border-radius: 10px; }
        .product img { max-width: 100%; height: auto; border-radius: 5px; }
        .price { font-size: 24px; font-weight: bold; color: #e74c3c; margin: 15px 0; }
        .button { display: inline-block; background: #e74c3c; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-size: 18px; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀 Exciting News!</h1>
        <p>We have something special for you</p>
    </div>
    <div class="content">
        <h2>Hello {{firstName}}!</h2>
        <p>We're excited to introduce our latest product that we think you'll absolutely love!</p>
        
        <div class="product">
            <img src="{{productImage}}" alt="{{productName}}">
            <h3>{{productName}}</h3>
            <p>{{productDescription}}</p>
            <div class="price">{{productPrice}}</div>
            <a href="#" class="button">Get It Now</a>
        </div>
        
        <p>This is a limited-time offer, so don't miss out! Our customers are already loving it, and we can't wait for you to experience it too.</p>
        
        <p>Have questions? Just reply to this email - we're here to help!</p>
        
        <p>Best regards,<br>The Team</p>
    </div>
    <div class="footer">
        <p>You received this email because you're a valued subscriber.</p>
        <p><a href="#">Unsubscribe</a> | <a href="#">Update Preferences</a></p>
    </div>
</body>
</html>
    `
  },
  {
    id: 'event-invitation',
    name: 'Event Invitation',
    subject: '🎪 You\'re Invited: {{eventName}}',
    category: 'marketing',
    variables: ['firstName', 'eventName', 'eventDate', 'eventTime', 'eventLocation', 'eventDescription'],
    preview: 'Join us for an exciting event...',
    htmlContent: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Event Invitation</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #8e44ad 0%, #3498db 100%); color: white; padding: 30px; text-align: center; }
        .content { background: white; padding: 30px; }
        .event-details { background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0; }
        .detail-item { margin: 10px 0; }
        .detail-label { font-weight: bold; color: #8e44ad; }
        .button { display: inline-block; background: #8e44ad; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-size: 18px; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎪 You're Invited!</h1>
        <p>Join us for an amazing event</p>
    </div>
    <div class="content">
        <h2>Hello {{firstName}}!</h2>
        <p>We're excited to invite you to our upcoming event. It's going to be an incredible experience!</p>
        
        <div class="event-details">
            <h3>{{eventName}}</h3>
            <p>{{eventDescription}}</p>
            
            <div class="detail-item">
                <span class="detail-label">📅 Date:</span> {{eventDate}}
            </div>
            <div class="detail-item">
                <span class="detail-label">🕐 Time:</span> {{eventTime}}
            </div>
            <div class="detail-item">
                <span class="detail-label">📍 Location:</span> {{eventLocation}}
            </div>
        </div>
        
        <p>Don't miss this opportunity to connect, learn, and have fun with like-minded people!</p>
        
        <a href="#" class="button">RSVP Now</a>
        
        <p>Spaces are limited, so secure your spot today!</p>
        
        <p>Looking forward to seeing you there!</p>
        
        <p>Best regards,<br>The Event Team</p>
    </div>
    <div class="footer">
        <p>You received this invitation because you're part of our community.</p>
        <p><a href="#">Can't attend?</a> | <a href="#">Update Preferences</a></p>
    </div>
</body>
</html>
    `
  },
  {
    id: 'order-confirmation',
    name: 'Order Confirmation',
    subject: '✅ Order Confirmed - #{{orderNumber}}',
    category: 'transactional',
    variables: ['firstName', 'orderNumber', 'orderItems', 'orderTotal', 'shippingAddress', 'estimatedDelivery'],
    preview: 'Thank you for your order! Here are the details...',
    htmlContent: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Confirmation</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #27ae60; color: white; padding: 30px; text-align: center; }
        .content { background: white; padding: 30px; }
        .order-summary { background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0; }
        .order-item { border-bottom: 1px solid #eee; padding: 10px 0; }
        .total { font-size: 18px; font-weight: bold; color: #27ae60; margin-top: 15px; }
        .button { display: inline-block; background: #27ae60; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>✅ Order Confirmed!</h1>
        <p>Thank you for your purchase</p>
    </div>
    <div class="content">
        <h2>Hello {{firstName}}!</h2>
        <p>Great news! Your order has been confirmed and is being processed.</p>
        
        <div class="order-summary">
            <h3>Order #{{orderNumber}}</h3>
            <div class="order-item">
                {{orderItems}}
            </div>
            <div class="total">Total: {{orderTotal}}</div>
        </div>
        
        <p><strong>Shipping Address:</strong><br>{{shippingAddress}}</p>
        
        <p><strong>Estimated Delivery:</strong> {{estimatedDelivery}}</p>
        
        <a href="#" class="button">Track Your Order</a>
        
        <p>We'll send you another email when your order ships with tracking information.</p>
        
        <p>If you have any questions about your order, please don't hesitate to contact us.</p>
        
        <p>Thank you for choosing us!</p>
        
        <p>Best regards,<br>Customer Service Team</p>
    </div>
    <div class="footer">
        <p>This is an automated message regarding your order.</p>
        <p><a href="#">Contact Support</a> | <a href="#">Return Policy</a></p>
    </div>
</body>
</html>
    `
  },
  {
    id: 'password-reset',
    name: 'Password Reset',
    subject: '🔐 Reset Your Password',
    category: 'transactional',
    variables: ['firstName', 'resetLink', 'expiryTime'],
    preview: 'Click here to reset your password...',
    htmlContent: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #e74c3c; color: white; padding: 30px; text-align: center; }
        .content { background: white; padding: 30px; }
        .alert { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .button { display: inline-block; background: #e74c3c; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-size: 18px; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔐 Password Reset</h1>
        <p>Secure your account</p>
    </div>
    <div class="content">
        <h2>Hello {{firstName}}!</h2>
        <p>We received a request to reset your password. If you made this request, click the button below to reset your password:</p>
        
        <a href="{{resetLink}}" class="button">Reset Password</a>
        
        <div class="alert">
            <strong>⚠️ Important:</strong> This link will expire in {{expiryTime}}. If you don't reset your password within this time, you'll need to request a new reset link.
        </div>
        
        <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
        
        <p>For security reasons, this link can only be used once.</p>
        
        <p>If you're having trouble clicking the button, copy and paste this URL into your browser:</p>
        <p style="word-break: break-all; color: #666;">{{resetLink}}</p>
        
        <p>Best regards,<br>Security Team</p>
    </div>
    <div class="footer">
        <p>This is an automated security message.</p>
        <p><a href="#">Contact Support</a> | <a href="#">Security Center</a></p>
    </div>
</body>
</html>
    `
  }
];

export function getTemplate(id: string): EmailTemplateData | undefined {
  return EMAIL_TEMPLATES.find(template => template.id === id);
}

export function getTemplatesByCategory(category: EmailTemplateData['category']): EmailTemplateData[] {
  return EMAIL_TEMPLATES.filter(template => template.category === category);
}

export function getAllTemplates(): EmailTemplateData[] {
  return EMAIL_TEMPLATES;
}