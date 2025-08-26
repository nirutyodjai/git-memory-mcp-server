import { motion } from 'framer-motion'
import { CheckIcon } from '@heroicons/react/24/outline'
import { event } from '../lib/gtag'

const tiers = [
  {
    name: 'Free',
    id: 'tier-free',
    href: '#',
    priceMonthly: '$0',
    description: 'Perfect for individual developers getting started.',
    features: [
      'Up to 3 repositories',
      'Basic AI suggestions',
      'Standard memory features',
      'Community support',
      'MCP protocol integration',
      '500MB memory storage',
      '100 AI requests/month',
    ],
    mostPopular: false,
  },
  {
    name: 'Pro',
    id: 'tier-pro',
    href: '#',
    priceMonthly: '$19',
    description: 'Advanced features for professional developers and small teams.',
    features: [
      'Unlimited repositories',
      'Advanced AI models (GPT-4, Claude)',
      'Enhanced memory intelligence',
      'Priority support',
      'Custom integrations',
      '5GB memory storage',
      'Unlimited AI requests',
      'Code review assistance',
      'Advanced analytics',
    ],
    mostPopular: true,
  },
  {
    name: 'Enterprise',
    id: 'tier-enterprise',
    href: '#',
    priceMonthly: 'Custom',
    description: 'Tailored solutions for large organizations with advanced security needs.',
    features: [
      'Everything in Pro',
      'On-premises deployment',
      'Custom AI model training',
      'SOC 2 compliance',
      'Dedicated support manager',
      'Unlimited memory storage',
      'Advanced security features',
      'Custom integrations & APIs',
      'SLA guarantees (99.9% uptime)',
      'Team management dashboard',
    ],
    mostPopular: false,
  },
]

export default function Pricing() {
  const handlePricingClick = (tierName, tierPrice) => {
    event({
      action: 'click',
      category: 'Pricing',
      label: `${tierName} - ${tierPrice}`,
    });
  };

  const handlePricingView = (tierName) => {
    event({
      action: 'view',
      category: 'Pricing',
      label: tierName,
    });
  };

  return (
    <div id="pricing" className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-base font-semibold leading-7"
            style={{color: '#2563eb'}}
          >
            Pricing
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            className="mt-2 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl"
          >
            Choose the right plan for you
          </motion.p>
        </div>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="mx-auto mt-6 max-w-2xl text-center text-lg leading-8 text-gray-600"
        >
          Start free and scale as you grow. All plans include our core AI-enhanced Git features.
        </motion.p>
        <div className="isolate mx-auto mt-16 grid max-w-md grid-cols-1 gap-y-8 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-3 lg:gap-x-8 xl:gap-x-12">
          {tiers.map((tier, index) => (
            <motion.div
              key={tier.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ 
                opacity: 1, 
                y: 0,
                transition: {
                  duration: 0.6, 
                  delay: index * 0.1,
                  onComplete: () => handlePricingView(tier.name)
                }
              }}
              viewport={{ once: true }}
              className={`pricing-card ${
                tier.mostPopular ? 'popular' : ''
              }`}
            >
              {tier.mostPopular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center rounded-full bg-blue-600 px-4 py-1 text-sm font-medium text-white">
                    Most Popular
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between gap-x-4">
                <h3
                  id={tier.id}
                  className="text-lg font-semibold leading-8"
                  style={{color: tier.mostPopular ? '#2563eb' : '#111827'}}
                >
                  {tier.name}
                </h3>
              </div>
              <p className="mt-4 text-sm leading-6 text-gray-600">{tier.description}</p>
              <p className="mt-6 flex items-baseline gap-x-1">
                <span className="text-4xl font-bold tracking-tight text-gray-900">
                  {tier.priceMonthly}
                </span>
                {tier.priceMonthly !== 'Custom' && (
                  <span className="text-sm font-semibold leading-6 text-gray-600">/month</span>
                )}
              </p>
              <ul role="list" className="mt-8 space-y-3 text-sm leading-6 text-gray-600">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex gap-x-3">
                    <CheckIcon
                      className="h-6 w-5 flex-none"
                    style={{color: tier.mostPopular ? '#2563eb' : '#9ca3af'}}
                      aria-hidden="true"
                    />
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handlePricingClick(tier.name, tier.priceMonthly)}
                aria-describedby={tier.id}
                className="mt-8 block w-full rounded-md px-3 py-2 text-center text-sm font-semibold leading-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 transition-all duration-200 hover:scale-105"
                style={{
                  backgroundColor: tier.mostPopular ? '#2563eb' : '#ffffff',
                  color: tier.mostPopular ? '#ffffff' : '#2563eb',
                  border: tier.mostPopular ? 'none' : '1px solid #dbeafe',
                  boxShadow: tier.mostPopular ? '0 1px 2px 0 rgb(0 0 0 / 0.05)' : 'none'
                }}
                onMouseEnter={(e) => {
                  if (tier.mostPopular) {
                    e.target.style.backgroundColor = '#1d4ed8';
                  } else {
                    e.target.style.borderColor = '#93c5fd';
                  }
                }}
                onMouseLeave={(e) => {
                  if (tier.mostPopular) {
                    e.target.style.backgroundColor = '#2563eb';
                  } else {
                    e.target.style.borderColor = '#dbeafe';
                  }
                }}
              >
                {tier.name === 'Enterprise' ? 'Contact Sales' : 'Get Started'}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}