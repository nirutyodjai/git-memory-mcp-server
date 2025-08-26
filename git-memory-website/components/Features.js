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
  },
  {
    name: 'Semantic Code Search',
    description:
      'Find code by meaning, not just keywords. Search across your entire repository history with natural language queries.',
    icon: MagnifyingGlassIcon,
  },
  {
    name: 'Memory Intelligence',
    description:
      'Persistent memory system that learns from your coding patterns and provides contextual suggestions based on your project history.',
    icon: CpuChipIcon,
  },
  {
    name: 'MCP Protocol Integration',
    description:
      'Built on the Model Context Protocol for seamless integration with AI assistants and development tools.',
    icon: CodeBracketIcon,
  },
  {
    name: 'Enterprise Security',
    description:
      'SOC 2 compliant with end-to-end encryption, on-premises deployment options, and zero data retention policies.',
    icon: ShieldCheckIcon,
  },
  {
    name: 'Cloud & On-Premise',
    description:
      'Deploy anywhere - cloud SaaS, private cloud, or fully on-premises to meet your security and compliance requirements.',
    icon: CloudArrowUpIcon,
  },
  {
    name: 'Privacy First',
    description:
      'Your code stays private. Zero data retention, no training on your code, and complete control over your data.',
    icon: LockClosedIcon,
  },
  {
    name: 'High Performance',
    description:
      'Optimized for large repositories with real-time indexing, fast search, and minimal resource usage.',
    icon: ServerIcon,
  },
]

export default function Features() {
  return (
    <div id="features" className="py-24 sm:py-32 bg-gray-50">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-base font-semibold leading-7"
            style={{color: '#2563eb'}}
          >
            Powerful Features
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl"
          >
            Everything you need for intelligent Git workflows
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="mt-6 text-lg leading-8 text-gray-600"
          >
            Git Memory MCP Server combines the power of Git with AI intelligence, 
            providing developers with unprecedented insights into their codebase and development patterns.
          </motion.p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none feature-grid lg:gap-y-16">
            {features.map((feature, index) => (
              <motion.div
                key={feature.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="relative pl-16"
              >
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 hover-scale hover-glow transition-all">
                    <feature.icon className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  {feature.name}
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">{feature.description}</dd>
              </motion.div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  )
}