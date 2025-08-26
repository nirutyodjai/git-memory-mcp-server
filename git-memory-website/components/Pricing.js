import { motion } from 'framer-motion'
import { CheckIcon, StarIcon, SparklesIcon } from '@heroicons/react/24/outline'
import { event } from '../lib/gtag'

const tiers = [
  {
    name: 'Free',
    id: 'tier-free',
    href: '#',
    priceMonthly: '$0',
    description: 'Perfect for individual developers getting started.',
    badge: 'Get Started',
    icon: SparklesIcon,
    gradient: 'from-gray-50 to-gray-100',
    borderGradient: 'from-gray-200 to-gray-300',
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
    badge: 'Most Popular',
    icon: StarIcon,
    gradient: 'from-blue-50 via-indigo-50 to-purple-50',
    borderGradient: 'from-blue-400 via-indigo-500 to-purple-600',
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
    badge: 'Enterprise',
    icon: SparklesIcon,
    gradient: 'from-slate-50 to-gray-100',
    borderGradient: 'from-slate-300 to-gray-400',
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
        {/* Background Elements */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-40 -right-32 w-96 h-96 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-full opacity-20 blur-3xl animate-float" />
          <div className="absolute -bottom-40 -left-32 w-96 h-96 bg-gradient-to-tr from-purple-100 to-pink-200 rounded-full opacity-20 blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        </div>
        
        <div className="mx-auto max-w-4xl text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 mb-6"
          >
            <SparklesIcon className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-semibold text-blue-700">Simple & Transparent Pricing</span>
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl lg:text-7xl"
          >
            Choose the{' '}
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent animate-gradient-x">
              perfect plan
            </span>
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="mt-6 text-xl leading-8 text-gray-600 max-w-3xl mx-auto"
          >
            Start free and scale as you grow. All plans include our core AI-enhanced Git features with{' '}
            <span className="font-semibold text-gray-900">no hidden costs</span>.
          </motion.p>
        </div>
        <div className="isolate mx-auto mt-20 grid max-w-md grid-cols-1 gap-8 sm:mt-24 lg:mx-0 lg:max-w-none lg:grid-cols-3 lg:gap-8 xl:gap-12">
          {tiers.map((tier, index) => {
            const IconComponent = tier.icon;
            return (
              <motion.div
                key={tier.id}
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                whileInView={{ 
                  opacity: 1, 
                  y: 0,
                  scale: 1,
                  transition: {
                    duration: 0.7, 
                    delay: index * 0.15,
                    ease: "easeOut",
                    onComplete: () => handlePricingView(tier.name)
                  }
                }}
                whileHover={{ 
                  y: -8,
                  scale: 1.02,
                  transition: { duration: 0.3, ease: "easeOut" }
                }}
                viewport={{ once: true }}
                className={`relative group overflow-hidden rounded-3xl p-8 shadow-xl transition-all duration-500 ${
                  tier.mostPopular 
                    ? 'bg-gradient-to-br from-white via-blue-50 to-indigo-100 border-2 border-transparent bg-clip-padding' 
                    : `bg-gradient-to-br ${tier.gradient} border border-gray-200`
                } hover:shadow-2xl`}
                style={{
                  background: tier.mostPopular 
                    ? 'linear-gradient(135deg, #ffffff 0%, #eff6ff 50%, #e0e7ff 100%)'
                    : undefined
                }}
              >
                {/* Gradient Border for Popular Plan */}
                {tier.mostPopular && (
                  <div className="absolute inset-0 rounded-3xl p-[2px] bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-600 -z-10">
                    <div className="h-full w-full rounded-3xl bg-gradient-to-br from-white via-blue-50 to-indigo-100" />
                  </div>
                )}
                
                {/* Hover Glow Effect */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-400/10 via-indigo-500/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />
                
                {/* Popular Badge */}
                {tier.mostPopular && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5, duration: 0.3 }}
                    className="absolute -top-4 left-1/2 -translate-x-1/2 z-10"
                  >
                    <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-2 text-sm font-semibold text-white shadow-lg animate-pulse-slow">
                      <StarIcon className="w-4 h-4" />
                      {tier.badge}
                    </div>
                  </motion.div>
                )}
                
                {/* Plan Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-2xl ${
                      tier.mostPopular 
                        ? 'bg-gradient-to-br from-blue-100 to-indigo-200' 
                        : 'bg-white shadow-sm'
                    }`}>
                      <IconComponent className={`w-6 h-6 ${
                        tier.mostPopular ? 'text-blue-600' : 'text-gray-600'
                      }`} />
                    </div>
                    <div>
                      <h3 className={`text-xl font-bold ${
                        tier.mostPopular ? 'text-gray-900' : 'text-gray-900'
                      }`}>
                        {tier.name}
                      </h3>
                      {!tier.mostPopular && (
                        <span className="text-sm text-gray-500 font-medium">{tier.badge}</span>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Description */}
                <p className="text-gray-600 text-base leading-relaxed mb-8">
                  {tier.description}
                </p>
                
                {/* Pricing */}
                <div className="mb-8">
                  <div className="flex items-baseline gap-2">
                    <span className={`text-5xl font-bold tracking-tight ${
                      tier.mostPopular ? 'text-gray-900' : 'text-gray-900'
                    }`}>
                      {tier.priceMonthly}
                    </span>
                    {tier.priceMonthly !== 'Custom' && (
                      <span className="text-lg font-semibold text-gray-500">/month</span>
                    )}
                  </div>
                  {tier.priceMonthly !== 'Custom' && (
                    <p className="text-sm text-gray-500 mt-1">Billed monthly, cancel anytime</p>
                  )}
                </div>
                
                {/* Features */}
                <ul className="space-y-4 mb-8">
                  {tier.features.map((feature, featureIndex) => (
                    <motion.li 
                      key={feature} 
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 + featureIndex * 0.05 }}
                      viewport={{ once: true }}
                      className="flex items-start gap-3"
                    >
                      <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${
                        tier.mostPopular 
                          ? 'bg-gradient-to-r from-blue-500 to-indigo-600' 
                          : 'bg-gray-200'
                      }`}>
                        <CheckIcon className={`w-3 h-3 ${
                          tier.mostPopular ? 'text-white' : 'text-gray-600'
                        }`} />
                      </div>
                      <span className="text-gray-700 text-sm leading-relaxed">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                {/* CTA Button */}
                <motion.button
                  onClick={() => handlePricingClick(tier.name, tier.priceMonthly)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full py-4 px-6 rounded-2xl font-semibold text-base transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-offset-2 ${
                    tier.mostPopular
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-indigo-700 focus:ring-blue-500'
                      : 'bg-white text-gray-900 border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 focus:ring-gray-500 shadow-sm'
                  }`}
                >
                  {tier.name === 'Enterprise' ? 'Contact Sales' : 'Get Started'}
                  {tier.mostPopular && (
                    <SparklesIcon className="inline-block w-4 h-4 ml-2" />
                  )}
                </motion.button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  )
}