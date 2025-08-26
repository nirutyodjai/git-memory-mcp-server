import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Rocket, Zap, Star, Heart, Smile } from 'lucide-react';

const AppContent: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { playSound } = useSound();

  const carouselItems = [
    {
      id: '1',
      title: 'Amazing Animations',
      description: 'Experience smooth and beautiful animations powered by Framer Motion',
      color: 'bg-gradient-to-br from-purple-600 to-pink-600'
    },
    {
      id: '2',
      title: '3D Effects',
      description: 'Immersive 3D elements that bring your interface to life',
      color: 'bg-gradient-to-br from-blue-600 to-cyan-600'
    },
    {
      id: '3',
      title: 'Interactive Components',
      description: 'Engaging UI components that respond to user interactions',
      color: 'bg-gradient-to-br from-green-600 to-teal-600'
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 transition-colors duration-300 relative overflow-hidden">
      <ParticleBackground />
      <FloatingElements />
      <div className="relative z-20">

        
        {/* Main Content */}
        <main>
          <HeroSection />
          
          <LazySection animationDelay={0.2}>
            <FeaturesSection />
          </LazySection>
          
          <LazySection animationDelay={0.4}>
            <StatsSection />
          </LazySection>
          
          <LazySection animationDelay={0.6}>
            {/* Interactive Demo Section */}
            <section className="py-24 px-6 relative">
              <div className="max-w-7xl mx-auto text-center">
                <motion.h2 
                  className="text-4xl md:text-6xl font-bold mb-12 bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent"
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true }}
                >
                  Interactive Demo
                </motion.h2>
              
              {/* Carousel Demo */}
              <motion.div 
                className="mb-16"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Carousel Component</h3>
                <Carousel items={carouselItems} className="max-w-4xl mx-auto" />
              </motion.div>
              
              {/* Interactive Buttons */}
              <motion.div 
                className="flex flex-wrap justify-center gap-6"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                viewport={{ once: true }}
              >
                <Tooltip content="Click to open a beautiful modal!" position="top">
                   <motion.button
                     onClick={() => {
                       playSound('click');
                       setIsModalOpen(true);
                     }}
                     onMouseEnter={() => playSound('hover')}
                     className="flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-full font-semibold shadow-lg"
                     whileHover={{ 
                       scale: 1.05,
                       boxShadow: '0 20px 40px rgba(139, 92, 246, 0.4)'
                     }}
                     whileTap={{ scale: 0.95 }}
                   >
                     <Sparkles className="w-5 h-5" />
                     <span>Open Modal</span>
                   </motion.button>
                 </Tooltip>
                
                <Tooltip content="This button has amazing hover effects!" position="top">
                   <motion.button
                     onClick={() => playSound('whoosh')}
                     onMouseEnter={() => playSound('hover')}
                     className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-8 py-4 rounded-full font-semibold shadow-lg"
                     whileHover={{ 
                       scale: 1.05,
                       rotate: 5,
                       boxShadow: '0 20px 40px rgba(59, 130, 246, 0.4)'
                     }}
                     whileTap={{ scale: 0.95 }}
                   >
                     <Rocket className="w-5 h-5" />
                     <span>Hover Me</span>
                   </motion.button>
                 </Tooltip>
                
                <Tooltip content="Interactive elements everywhere!" position="top">
                   <motion.button
                     onClick={() => playSound('pop')}
                     onMouseEnter={() => playSound('hover')}
                     className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-teal-500 text-white px-8 py-4 rounded-full font-semibold shadow-lg"
                     whileHover={{ 
                       scale: 1.05,
                       y: -5,
                       boxShadow: '0 25px 50px rgba(34, 197, 94, 0.4)'
                     }}
                     whileTap={{ scale: 0.95 }}
                   >
                     <Zap className="w-5 h-5" />
                     <span>Try Me</span>
                   </motion.button>
                 </Tooltip>
              </motion.div>
            </div>
          </section>
          </LazySection>
        </main>
        
        {/* Footer */}
        <Footer />
      </div>
      
      {/* Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title="Welcome to the Future!"
        size="lg"
      >
        <div className="text-center text-gray-900 dark:text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-12 h-12 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-4">Amazing Modal Component</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
              This modal demonstrates smooth animations, backdrop blur effects, and responsive design. 
              It's built with Framer Motion for buttery smooth transitions and modern UI patterns.
            </p>
            <motion.button
               onClick={() => {
                 playSound('success');
                 setIsModalOpen(false);
               }}
               onMouseEnter={() => playSound('hover')}
               className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-full font-semibold"
               whileHover={{ scale: 1.05 }}
               whileTap={{ scale: 0.95 }}
             >
               Close Modal
             </motion.button>
          </motion.div>
        </div>
      </Modal>
      
      {/* Performance Monitor */}
       <PerformanceMonitor />
       
       {/* Sound Controls */}
       <div className="fixed bottom-4 left-4 z-50">
         <SoundControls />
       </div>
     </div>
   );
 };

function App() {
  return (
    <SoundManager defaultVolume={0.3} defaultMuted={false}>
      <AppContent />
    </SoundManager>
  );
}

export default App;
