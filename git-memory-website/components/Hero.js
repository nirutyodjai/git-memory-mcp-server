import { motion } from 'framer-motion'
import { ChevronRightIcon, PlayIcon, SparklesIcon } from '@heroicons/react/24/outline'

export default function Hero() {
  return (
    <div className="relative isolate px-6 pt-14 lg:px-8 overflow-hidden">
      {/* Modern Gradient Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-cyan-50" />
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-3/4 right-1/4 w-80 h-80 bg-gradient-to-r from-cyan-400/20 to-blue-600/20 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-gradient-to-r from-purple-400/15 to-pink-600/15 rounded-full blur-2xl animate-pulse delay-2000" />
        </div>
      </div>
      
      {/* Floating Elements */}
      <div className="absolute inset-0 -z-5">
        <motion.div
          animate={{ y: [-20, 20, -20] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/6 w-4 h-4 bg-blue-500/30 rounded-full blur-sm"
        />
        <motion.div
          animate={{ y: [20, -20, 20] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/3 right-1/5 w-6 h-6 bg-purple-500/30 rounded-full blur-sm"
        />
        <motion.div
          animate={{ y: [-15, 15, -15] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-1/3 left-1/3 w-3 h-3 bg-cyan-500/30 rounded-full blur-sm"
        />
      </div>
      <div className="mx-auto max-w-5xl py-32 sm:py-48 lg:py-56">
        <div className="hidden sm:mb-8 sm:flex sm:justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="group relative rounded-full px-4 py-2 text-sm leading-6 text-gray-700 bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-lg hover:shadow-xl hover:border-blue-300/50 transition-all duration-300"
          >
            <SparklesIcon className="inline w-4 h-4 mr-2 text-blue-500" />
            🚀 Now supporting MCP Protocol 2.0{' '}
            <a href="#" className="font-semibold text-blue-600 hover:text-blue-700 transition-colors">
              <span className="absolute inset-0" aria-hidden="true" />
              Learn more <ChevronRightIcon className="inline w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
            </a>
          </motion.div>
        </div>
        <div className="text-center">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="hero-title font-bold tracking-tight text-gray-900 relative"
          >
            <span className="relative z-10">
              AI-Enhanced Git with
              <span className="block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 animate-gradient-x">
                Memory Intelligence
              </span>
            </span>
            {/* Glow effect */}
            <div className="absolute inset-0 blur-3xl opacity-20 bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 -z-10" />
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-8 hero-subtitle leading-8 text-gray-700 max-w-4xl mx-auto font-medium"
          >
            Transform your Git workflow with our revolutionary AI-powered memory system. 
            Experience intelligent code suggestions, semantic search across repository history, 
            and context-aware development assistance through the cutting-edge Model Context Protocol.
          </motion.p>
          
          {/* Feature highlights */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-6 flex flex-wrap justify-center gap-4 text-sm text-gray-600"
          >
            <div className="flex items-center bg-white/60 backdrop-blur-sm px-3 py-1 rounded-full border border-gray-200/50">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
              Real-time Intelligence
            </div>
            <div className="flex items-center bg-white/60 backdrop-blur-sm px-3 py-1 rounded-full border border-gray-200/50">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse" />
              Semantic Search
            </div>
            <div className="flex items-center bg-white/60 backdrop-blur-sm px-3 py-1 rounded-full border border-gray-200/50">
              <div className="w-2 h-2 bg-purple-500 rounded-full mr-2 animate-pulse" />
              Context Awareness
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6"
          >
            <motion.a
              href="#get-started"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
            >
              <span className="relative z-10 flex items-center">
                <SparklesIcon className="w-5 h-5 mr-2" />
                Get Started Free
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl" />
            </motion.a>
            
            <motion.a
              href="#demo"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="group flex items-center px-6 py-4 text-base font-semibold text-gray-700 bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-xl hover:bg-white hover:border-blue-300/50 hover:text-blue-600 transition-all duration-300 shadow-sm hover:shadow-md"
            >
              <div className="relative mr-3">
                <PlayIcon className="h-5 w-5 transition-colors" />
                <div className="absolute inset-0 bg-blue-500/20 rounded-full scale-0 group-hover:scale-150 transition-transform duration-300" />
              </div>
              Watch Demo
              <ChevronRightIcon className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
            </motion.a>
          </motion.div>
        </div>
      </div>
    </div>
  )
}