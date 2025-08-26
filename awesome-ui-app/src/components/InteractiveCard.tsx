import { motion } from 'framer-motion';
import { ReactNode, useState } from 'react';

interface InteractiveCardProps {
  children: ReactNode;
  className?: string;
  hoverScale?: number;
  tapScale?: number;
  rotateOnHover?: boolean;
}

const InteractiveCard = ({ 
  children, 
  className = '', 
  hoverScale = 1.05,
  tapScale = 0.95,
  rotateOnHover = true
}: InteractiveCardProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      className={`${className} cursor-pointer`}
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      whileHover={{ 
        scale: hoverScale,
        rotateY: rotateOnHover ? 5 : 0,
        rotateX: rotateOnHover ? 5 : 0,
        transition: { duration: 0.3 }
      }}
      whileTap={{ scale: tapScale }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      style={{
        transformStyle: 'preserve-3d',
        perspective: 1000
      }}
      transition={{
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      viewport={{ once: true }}
    >
      <motion.div
        animate={{
          boxShadow: isHovered 
            ? '0 25px 50px -12px rgba(139, 92, 246, 0.25)'
            : '0 10px 25px -3px rgba(0, 0, 0, 0.1)'
        }}
        transition={{ duration: 0.3 }}
        className="h-full w-full rounded-xl bg-white/10 backdrop-blur-sm border border-white/20"
      >
        {children}
      </motion.div>
    </motion.div>
  );
};

export default InteractiveCard;