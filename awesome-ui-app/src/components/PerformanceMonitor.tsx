import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PerformanceMetrics {
  fps: number;
  memoryUsage: number;
  loadTime: number;
  renderTime: number;
}

interface PerformanceMonitorProps {
  enabled?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({ 
  enabled = process.env.NODE_ENV === 'development',
  position = 'top-right'
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 0,
    memoryUsage: 0,
    loadTime: 0,
    renderTime: 0
  });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    let frameCount = 0;
    let lastTime = performance.now();
    let animationId: number;

    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime >= lastTime + 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        
        setMetrics(prev => ({
          ...prev,
          fps,
          memoryUsage: (performance as any).memory ? 
            Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024) : 0,
          loadTime: Math.round(performance.now()),
          renderTime: Math.round(currentTime - lastTime)
        }));
        
        frameCount = 0;
        lastTime = currentTime;
      }
      
      animationId = requestAnimationFrame(measureFPS);
    };

    measureFPS();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [enabled]);

  if (!enabled) return null;

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4'
  };

  const getPerformanceColor = (fps: number) => {
    if (fps >= 55) return 'text-green-400';
    if (fps >= 30) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className={`fixed ${positionClasses[position]} z-50`}>
      <motion.button
        onClick={() => setIsVisible(!isVisible)}
        className="bg-black/80 backdrop-blur-sm text-white px-3 py-2 rounded-lg text-sm font-mono border border-gray-600 hover:bg-black/90 transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <span className={getPerformanceColor(metrics.fps)}>
          {metrics.fps} FPS
        </span>
      </motion.button>

      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full mt-2 bg-black/90 backdrop-blur-sm text-white p-4 rounded-lg border border-gray-600 min-w-[200px] font-mono text-sm"
          >
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-300">FPS:</span>
                <span className={getPerformanceColor(metrics.fps)}>
                  {metrics.fps}
                </span>
              </div>
              
              {(performance as any).memory && (
                <div className="flex justify-between">
                  <span className="text-gray-300">Memory:</span>
                  <span className="text-blue-400">
                    {metrics.memoryUsage} MB
                  </span>
                </div>
              )}
              
              <div className="flex justify-between">
                <span className="text-gray-300">Load Time:</span>
                <span className="text-purple-400">
                  {metrics.loadTime} ms
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-300">Render:</span>
                <span className="text-cyan-400">
                  {metrics.renderTime} ms
                </span>
              </div>
            </div>
            
            <div className="mt-3 pt-2 border-t border-gray-600">
              <div className="text-xs text-gray-400">
                Performance Monitor
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PerformanceMonitor;