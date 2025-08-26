import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode, useState, useRef, useEffect } from 'react';

interface TooltipProps {
  children: ReactNode;
  content: string | ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  className?: string;
}

const Tooltip = ({ 
  children, 
  content, 
  position = 'top', 
  delay = 0.5, 
  className = '' 
}: TooltipProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
      setShowTooltip(true);
    }, delay * 1000);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
    setTimeout(() => setShowTooltip(false), 150);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const getPositionClasses = () => {
    switch (position) {
      case 'top':
        return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2';
      case 'bottom':
        return 'top-full left-1/2 transform -translate-x-1/2 mt-2';
      case 'left':
        return 'right-full top-1/2 transform -translate-y-1/2 mr-2';
      case 'right':
        return 'left-full top-1/2 transform -translate-y-1/2 ml-2';
      default:
        return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2';
    }
  };

  const getArrowClasses = () => {
    switch (position) {
      case 'top':
        return 'top-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-gray-800';
      case 'bottom':
        return 'bottom-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-gray-800';
      case 'left':
        return 'left-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-gray-800';
      case 'right':
        return 'right-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-gray-800';
      default:
        return 'top-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-gray-800';
    }
  };

  const getInitialPosition = () => {
    switch (position) {
      case 'top':
        return { opacity: 0, y: 10, scale: 0.8 };
      case 'bottom':
        return { opacity: 0, y: -10, scale: 0.8 };
      case 'left':
        return { opacity: 0, x: 10, scale: 0.8 };
      case 'right':
        return { opacity: 0, x: -10, scale: 0.8 };
      default:
        return { opacity: 0, y: 10, scale: 0.8 };
    }
  };

  return (
    <div 
      className={`relative inline-block ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            className={`absolute z-50 ${getPositionClasses()}`}
            initial={getInitialPosition()}
            animate={{ 
              opacity: isVisible ? 1 : 0, 
              y: 0, 
              x: 0, 
              scale: isVisible ? 1 : 0.8 
            }}
            exit={getInitialPosition()}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 20,
              duration: 0.2 
            }}
          >
            <div className="bg-gray-800 text-white text-sm px-3 py-2 rounded-lg shadow-lg backdrop-blur-sm border border-gray-700 whitespace-nowrap max-w-xs">
              {content}
              
              {/* Arrow */}
              <div 
                className={`absolute w-0 h-0 border-4 ${getArrowClasses()}`}
                style={{ borderWidth: '4px' }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Tooltip;