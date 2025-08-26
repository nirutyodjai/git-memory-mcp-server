import React from 'react';
import { motion } from 'framer-motion';
import AnimatedSection from './AnimatedSection';
import InteractiveCard from './InteractiveCard';
import ParallaxSection from './ParallaxSection';

const FeaturesSection: React.FC = () => {
  const features = [
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      title: 'Modern Design',
      description: 'ออกแบบด้วยหลักการ UI/UX ที่ทันสมัย เน้นความสวยงามและใช้งานง่าย',
      color: 'from-yellow-400 to-orange-500'
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      title: 'High Performance',
      description: 'ใช้เทคโนโลยี React และ Vite เพื่อประสิทธิภาพที่เร็วและเสถียร',
      color: 'from-blue-400 to-blue-600'
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
      title: 'Mobile First',
      description: 'ออกแบบให้ใช้งานได้ดีบนมือถือก่อน แล้วขยายไปยังหน้าจอใหญ่',
      color: 'from-green-400 to-green-600'
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      ),
      title: 'Dark Mode Support',
      description: 'รองรับโหมดมืดและสว่าง สลับได้ตามความชอบของผู้ใช้',
      color: 'from-purple-400 to-purple-600'
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
      title: 'User Experience',
      description: 'เน้นประสบการณ์ผู้ใช้ที่ดี ด้วย Animation และ Interaction ที่ลื่นไหล',
      color: 'from-pink-400 to-red-500'
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      title: 'Customizable',
      description: 'ปรับแต่งได้ง่าย ด้วย Tailwind CSS และ Component-based Architecture',
      color: 'from-indigo-400 to-indigo-600'
    }
  ];

  return (
    <section className="py-20 px-6 bg-white dark:bg-slate-900 relative overflow-hidden">
      <ParallaxSection speed={0.3}>
        <div className="absolute inset-0 opacity-5 dark:opacity-10">
          <motion.div 
            className="absolute inset-0" 
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
            animate={{ opacity: [0.05, 0.1, 0.05] }}
            transition={{ duration: 4, repeat: Infinity }}
          />
        </div>
      </ParallaxSection>
      
      <div className="max-w-7xl mx-auto relative z-10">
        <AnimatedSection className="text-center mb-16">
          <motion.h2 
            className="text-4xl md:text-5xl font-bold text-slate-800 dark:text-slate-100 mb-6"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            ฟีเจอร์ที่
            <span className="bg-gradient-to-r from-primary-500 to-purple-500 bg-clip-text text-transparent"> เจ๋งๆ</span>
          </motion.h2>
          <motion.p 
            className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            ทุกฟีเจอร์ถูกออกแบบมาเพื่อให้คุณสร้างเว็บแอปพลิเคชันที่สวยงาม ทันสมัย และใช้งานง่าย
          </motion.p>
        </AnimatedSection>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <InteractiveCard
              key={index}
              className="h-full"
              hoverScale={1.05}
              rotateOnHover={true}
            >
              <motion.div 
                className="p-8 h-full flex flex-col bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700 overflow-hidden cursor-pointer"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                viewport={{ once: true }}
              >
                <motion.div 
                  className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg`}
                  whileHover={{ 
                    scale: 1.1, 
                    rotate: 6,
                    boxShadow: '0 0 30px rgba(139, 92, 246, 0.5)'
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="animate-bounce-slow">{feature.icon}</div>
                </motion.div>
                
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-3">
                  {feature.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed flex-grow">
                  {feature.description}
                </p>
              </motion.div>
            </InteractiveCard>
          ))}
        </div>
        
        <AnimatedSection className="text-center mt-16">
          <div className="inline-flex items-center justify-center p-1 bg-gradient-to-r from-primary-500 to-purple-500 rounded-full">
            <motion.button 
              className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-8 py-3 rounded-full font-semibold"
              whileHover={{ 
                scale: 1.05,
                boxShadow: '0 10px 30px rgba(139, 92, 246, 0.3)'
              }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              เริ่มสร้างโปรเจคของคุณ
            </motion.button>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
};

export default FeaturesSection;