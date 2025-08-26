import React from 'react';

const FloatingElements: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden">
      {/* Floating Circles */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full animate-bounce-slow blur-sm" />
      <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-br from-pink-400/20 to-red-600/20 rounded-full animate-pulse-slow" />
      <div className="absolute bottom-32 left-1/4 w-20 h-20 bg-gradient-to-br from-green-400/20 to-blue-600/20 rounded-full animate-bounce" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/3 right-1/3 w-16 h-16 bg-gradient-to-br from-yellow-400/20 to-orange-600/20 rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
      
      {/* Floating Squares */}
      <div className="absolute top-60 left-1/2 w-12 h-12 bg-gradient-to-br from-indigo-400/30 to-purple-600/30 rotate-45 animate-spin" style={{ animationDuration: '20s' }} />
      <div className="absolute bottom-40 right-1/4 w-8 h-8 bg-gradient-to-br from-cyan-400/30 to-blue-600/30 rotate-12 animate-bounce" style={{ animationDelay: '0.5s' }} />
      
      {/* Floating Triangles */}
      <div className="absolute top-1/4 left-1/3 w-0 h-0 border-l-[20px] border-r-[20px] border-b-[35px] border-l-transparent border-r-transparent border-b-purple-400/20 animate-pulse-slow" style={{ animationDelay: '1.5s' }} />
      <div className="absolute bottom-1/3 right-10 w-0 h-0 border-l-[15px] border-r-[15px] border-b-[26px] border-l-transparent border-r-transparent border-b-blue-400/20 animate-bounce" style={{ animationDelay: '3s' }} />
      
      {/* Glowing Orbs */}
      <div className="absolute top-1/2 left-20 w-6 h-6 bg-blue-500/40 rounded-full animate-ping" style={{ animationDelay: '2s' }} />
      <div className="absolute bottom-20 right-1/2 w-4 h-4 bg-purple-500/40 rounded-full animate-ping" style={{ animationDelay: '4s' }} />
      <div className="absolute top-80 right-40 w-8 h-8 bg-pink-500/30 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
      
      {/* Floating Lines */}
      <div className="absolute top-1/3 left-10 w-32 h-0.5 bg-gradient-to-r from-transparent via-blue-400/30 to-transparent rotate-12 animate-pulse-slow" />
      <div className="absolute bottom-1/4 right-20 w-24 h-0.5 bg-gradient-to-r from-transparent via-purple-400/30 to-transparent -rotate-12 animate-pulse" style={{ animationDelay: '2.5s' }} />
      
      {/* Morphing Shapes */}
      <div className="absolute top-40 left-2/3 w-10 h-10 bg-gradient-to-br from-emerald-400/20 to-teal-600/20 rounded-lg animate-spin" style={{ animationDuration: '15s', animationDelay: '1s' }} />
      <div className="absolute bottom-60 left-1/5 w-14 h-14 bg-gradient-to-br from-rose-400/20 to-pink-600/20 rounded-full animate-bounce-slow" style={{ animationDelay: '3.5s' }} />
      
      {/* Gradient Blobs */}
      <div className="absolute top-10 right-1/3 w-40 h-40 bg-gradient-to-br from-blue-400/10 to-purple-600/10 rounded-full blur-xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
      <div className="absolute bottom-10 left-1/2 w-32 h-32 bg-gradient-to-br from-pink-400/10 to-red-600/10 rounded-full blur-xl animate-bounce-slow" style={{ animationDelay: '4s' }} />
      
      {/* Sparkle Effects */}
      <div className="absolute top-32 right-1/4 w-2 h-2 bg-white/60 rounded-full animate-ping" style={{ animationDelay: '1s' }} />
      <div className="absolute bottom-32 left-1/3 w-1 h-1 bg-yellow-300/80 rounded-full animate-ping" style={{ animationDelay: '3s' }} />
      <div className="absolute top-2/3 right-1/5 w-1.5 h-1.5 bg-blue-300/70 rounded-full animate-ping" style={{ animationDelay: '5s' }} />
      <div className="absolute bottom-1/5 left-2/3 w-2 h-2 bg-purple-300/60 rounded-full animate-ping" style={{ animationDelay: '2.5s' }} />
    </div>
  );
};

export default FloatingElements;