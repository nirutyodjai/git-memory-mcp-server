import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { TrendingUp, Users, Award, Zap } from 'lucide-react';
import AnimatedSection from './AnimatedSection';
import InteractiveCard from './InteractiveCard';

interface StatType {
  icon: React.ComponentType<any>;
  value: string;
  label: string;
}

const StatItem: React.FC<{ stat: StatType; index: number }> = ({ stat, index }) => {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView && !hasAnimated) {
      const timer = setTimeout(() => {
        let start = 0;
        const end = parseInt(stat.value.replace(/[^0-9]/g, ''));
        const duration = 2000;
        const increment = end / (duration / 50);

        const counter = setInterval(() => {
          start += increment;
          if (start >= end) {
            setCount(end);
            clearInterval(counter);
            setHasAnimated(true);
          } else {
            setCount(Math.floor(start));
          }
        }, 50);
      }, index * 200);

      return () => clearTimeout(timer);
    }
  }, [stat.value, index, hasAnimated, isInView]);

  const formatValue = (value: number) => {
    if (stat.value.includes('K')) return `${value}K+`;
    if (stat.value.includes('M')) return `${value}M+`;
    if (stat.value.includes('%')) return `${value}%`;
    if (stat.value.includes('/7')) return `${value}/7`;
    return value.toString();
  };

  return (
    <InteractiveCard className="h-full" hoverScale={1.08} rotateOnHover={true}>
      <motion.div 
        ref={ref}
        className="p-8 text-center h-full flex flex-col justify-center"
        initial={{ opacity: 0, scale: 0.8 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ delay: index * 0.1, duration: 0.6 }}
        viewport={{ once: true }}
      >
        <motion.div 
          className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg"
          whileHover={{ 
            scale: 1.2, 
            rotate: 12,
            boxShadow: '0 0 40px rgba(139, 92, 246, 0.6)'
          }}
          transition={{ duration: 0.3 }}
        >
          <stat.icon className="w-8 h-8 text-white" />
        </motion.div>
        
        <motion.div 
          className="text-4xl md:text-5xl font-bold text-slate-800 dark:text-white mb-2"
          animate={{ 
            scale: [1, 1.05, 1],
            textShadow: [
              '0 0 0px rgba(139, 92, 246, 0)',
              '0 0 20px rgba(139, 92, 246, 0.5)',
              '0 0 0px rgba(139, 92, 246, 0)'
            ]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span className="bg-gradient-to-r from-primary-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            {formatValue(count)}
          </span>
        </motion.div>
        
        <p className="text-slate-600 dark:text-slate-300 text-lg font-medium">
          {stat.label}
        </p>
      </motion.div>
    </InteractiveCard>
  );
};

const StatsSection: React.FC = () => {
  const stats: StatType[] = [
    {
      icon: Users,
      value: '10000+',
      label: 'Happy Users'
    },
    {
      icon: TrendingUp,
      value: '500+',
      label: 'Projects Created'
    },
    {
      icon: Award,
      value: '99%',
      label: 'Satisfaction Rate'
    },
    {
      icon: Zap,
      value: '24/7',
      label: 'Support Available'
    }
  ];

  return (
    <AnimatedSection className="py-20 px-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 relative overflow-hidden">
      {/* Background Elements */}
      <motion.div 
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 1 }}
        viewport={{ once: true }}
      >
        <motion.div 
          className="absolute top-10 left-10 w-72 h-72 bg-primary-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="absolute bottom-10 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.6, 0.3, 0.6]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
        />
      </motion.div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <motion.h2 
            className="text-4xl md:text-5xl font-bold text-slate-800 dark:text-slate-100 mb-6"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            ตัวเลขที่
            <span className="bg-gradient-to-r from-primary-500 to-purple-500 bg-clip-text text-transparent"> พูดแทนเรา</span>
          </motion.h2>
          <motion.p 
            className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
          >
            ความสำเร็จของเราวัดได้จากความพึงพอใจของผู้ใช้และคุณภาพของงาน
          </motion.p>
        </motion.div>
        
        {/* Stats Grid */}
        <motion.div 
          className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          viewport={{ once: true }}
        >
          {stats.map((stat, index) => (
            <StatItem key={index} stat={stat} index={index} />
          ))}
        </motion.div>
        
        {/* Additional Info */}
        <motion.div 
          className="mt-16 text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1 }}
          viewport={{ once: true }}
        >
          <motion.div 
            className="inline-flex items-center space-x-2 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-full px-6 py-3 border border-slate-200 dark:border-slate-700"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            <motion.svg 
              className="w-5 h-5 text-green-500" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </motion.svg>
            <span className="text-slate-700 dark:text-slate-300 font-medium">
              อัปเดตข้อมูลแบบเรียลไทม์
            </span>
          </motion.div>
        </motion.div>
      </div>
    </AnimatedSection>
  );
};

export default StatsSection;