import React from 'react';
import { motion } from 'framer-motion';
import ParticleBackground from './ParticleBackground';
import FloatingElements from './FloatingElements';
import AnimatedText from './AnimatedText';
import AnimatedSection from './AnimatedSection';


const HeroSection: React.FC = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-blue-900 dark:to-purple-900" />
      
      {/* Enhanced Animated Background Shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-primary-400/30 to-purple-600/30 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-blue-400/30 to-cyan-600/30 rounded-full blur-3xl animate-bounce-slow" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-gradient-to-r from-pink-400/20 to-yellow-400/20 rounded-full blur-2xl animate-pulse" />
        <div className="absolute top-20 right-1/3 w-64 h-64 bg-gradient-to-br from-emerald-400/20 to-teal-600/20 rounded-full blur-2xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
        
        {/* Animated Gradient Mesh */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/5 to-transparent animate-pulse" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/5 to-transparent animate-pulse-slow" style={{ animationDelay: '3s' }} />
      </div>
      
      <ParticleBackground />
      <FloatingElements />
      
      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        <AnimatedText 
          className="text-6xl md:text-8xl font-bold bg-gradient-to-r from-primary-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-6 leading-tight"
          type="char"
          stagger={0.1}
        >
          สร้าง UI ที่เจ๋งๆ
        </AnimatedText>
        
        <AnimatedSection delay={0.5}>
          <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 mb-8 leading-relaxed">
            <span className="bg-gradient-to-r from-slate-600 to-slate-800 dark:from-slate-300 dark:to-slate-100 bg-clip-text text-transparent font-medium">
              ออกแบบและพัฒนาเว็บแอปพลิเคชันที่สวยงาม ทันสมัย และใช้งานง่าย
            </span>
            <br />
            <span className="text-primary-500 font-semibold bg-gradient-to-r from-primary-500 to-purple-600 bg-clip-text text-transparent">ด้วยเทคโนโลยีล่าสุด</span>
          </p>
        </AnimatedSection>
        
        <AnimatedSection delay={0.8} className="mb-16">
          <Scene3D className="mx-auto" />
        </AnimatedSection>
        
        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <button className="btn-primary group">
            เริ่มต้นใช้งาน
            <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
          <button className="btn-secondary group">
            <svg className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            ดูตัวอย่าง
          </button>
        </div>
        
        {/* Feature Cards Preview */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <div className="glass rounded-2xl p-6 hover:scale-105 transition-all duration-300">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center mb-4 mx-auto">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">รวดเร็ว</h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm">ประสิทธิภาพสูงด้วย React และ Vite</p>
          </div>
          
          <div className="glass rounded-2xl p-6 hover:scale-105 transition-all duration-300">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 mx-auto">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">Responsive</h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm">ใช้งานได้ทุกอุปกรณ์อย่างลื่นไหล</p>
          </div>
          
          <div className="glass rounded-2xl p-6 hover:scale-105 transition-all duration-300">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center mb-4 mx-auto">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">Dark Mode</h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm">สลับโหมดสีได้ตามความต้องการ</p>
          </div>
        </div>
      </div>
      
      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
    </section>
  );
};

export default HeroSection;