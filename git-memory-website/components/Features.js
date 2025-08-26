import { motion } from 'framer-motion'
import {
  BoltIcon,
  MagnifyingGlassIcon,
  CpuChipIcon,
  ShieldCheckIcon,
  CodeBracketIcon,
  CloudArrowUpIcon,
  LockClosedIcon,
  ServerIcon,
} from '@heroicons/react/24/outline'

const features = [
  {
    name: 'AI-Enhanced Git Operations',
    description:
      'Intelligent commit suggestions, automated branch management, and smart merge conflict resolution powered by advanced AI models.',
    icon: BoltIcon,
    category: 'AI-Powered',
    highlight: true,
    benefits: ['Smart commits', 'Auto-merge', 'Conflict resolution']
  },
  {
    name: 'Semantic Code Search',
    description:
      'Find code by meaning, not just keywords. Search across your entire repository history with natural language queries.',
    icon: MagnifyingGlassIcon,
    category: 'Search & Discovery',
    highlight: false,
    benefits: ['Natural language', 'Repository-wide', 'Instant results']
  },
  {
    name: 'Memory Intelligence',
    description:
      'Persistent memory system that learns from your coding patterns and provides contextual suggestions based on your project history.',
    icon: CpuChipIcon,
    category: 'AI-Powered',
    highlight: true,
    benefits: ['Pattern learning', 'Context-aware', 'Personalized']
  },
  {
    name: 'MCP Protocol Integration',
    description:
      'Built on the Model Context Protocol for seamless integration with AI assistants and development tools.',
    icon: CodeBracketIcon,
    category: 'Integration',
    highlight: false,
    benefits: ['Universal compatibility', 'Easy setup', 'Future-proof']
  },
  {
    name: 'Enterprise Security',
    description:
      'SOC 2 compliant with end-to-end encryption, on-premises deployment options, and zero data retention policies.',
    icon: ShieldCheckIcon,
    category: 'Security',
    highlight: false,
    benefits: ['SOC 2 compliant', 'End-to-end encryption', 'Zero retention']
  },
  {
    name: 'Cloud & On-Premise',
    description:
      'Deploy anywhere - cloud SaaS, private cloud, or fully on-premises to meet your security and compliance requirements.',
    icon: CloudArrowUpIcon,
    category: 'Deployment',
    highlight: false,
    benefits: ['Flexible deployment', 'Compliance ready', 'Scalable']
  },
  {
    name: 'Privacy First',
    description:
      'Your code stays private. Zero data retention, no training on your code, and complete control over your data.',
    icon: LockClosedIcon,
    category: 'Security',
    highlight: true,
    benefits: ['Private by design', 'No training', 'Full control']
  },
  {
    name: 'High Performance',
    description:
      'Optimized for large repositories with real-time indexing, fast search, and minimal resource usage.',
    icon: ServerIcon,
    category: 'Performance',
    highlight: false,
    benefits: ['Real-time indexing', 'Fast search', 'Low resource usage']
  },
]

export default function Features() {
  return (
    <div id="features" className="relative py-24 sm:py-32 bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-100 rounded-full opacity-20 animate-pulse-slow"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-100 rounded-full opacity-20 animate-pulse-slow" style={{animationDelay: '1s'}}></div>
      </div>
      
      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 mb-6"
          >
            <span className="text-sm font-semibold text-blue-700">✨ Powerful Features</span>
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl"
          >
            Everything you need for{' '}
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
              intelligent Git workflows
            </span>
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="mt-6 text-xl leading-8 text-gray-600 max-w-3xl mx-auto"
          >
            Git Memory MCP Server combines the power of Git with AI intelligence, 
            providing developers with unprecedented insights into their codebase and development patterns.
          </motion.p>
        </div>
        
        <div className="mx-auto mt-20 max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -8, scale: 1.02 }}
                className={`group relative p-8 rounded-2xl border transition-all duration-300 cursor-pointer ${
                  feature.highlight 
                    ? 'bg-gradient-to-br from-white to-blue-50 border-blue-200 shadow-lg hover:shadow-2xl hover:border-blue-300' 
                    : 'bg-white border-gray-200 shadow-md hover:shadow-xl hover:border-gray-300'
                }`}
              >
                {/* Category badge */}
                <div className="absolute top-4 right-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    feature.category === 'AI-Powered' ? 'bg-purple-100 text-purple-800' :
                    feature.category === 'Security' ? 'bg-green-100 text-green-800' :
                    feature.category === 'Performance' ? 'bg-orange-100 text-orange-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {feature.category}
                  </span>
                </div>
                
                {/* Highlight indicator */}
                {feature.highlight && (
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"></div>
                  </div>
                )}
                
                {/* Icon */}
                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl mb-6 transition-all duration-300 group-hover:scale-110 ${
                  feature.highlight 
                    ? 'bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg group-hover:shadow-xl' 
                    : 'bg-gradient-to-br from-gray-600 to-gray-700 group-hover:from-blue-500 group-hover:to-purple-600'
                }`}>
                  <feature.icon className="h-7 w-7 text-white" aria-hidden="true" />
                </div>
                
                {/* Content */}
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-900 transition-colors">
                    {feature.name}
                  </h3>
                  
                  <p className="text-gray-600 leading-relaxed text-sm">
                    {feature.description}
                  </p>
                  
                  {/* Benefits */}
                  <div className="space-y-2">
                    {feature.benefits.map((benefit, benefitIndex) => (
                      <div key={benefitIndex} className="flex items-center text-sm text-gray-500">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2 flex-shrink-0"></div>
                        <span>{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Hover effect overlay */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}