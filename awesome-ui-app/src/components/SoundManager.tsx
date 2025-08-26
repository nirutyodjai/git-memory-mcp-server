import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

interface SoundContextType {
  playSound: (soundName: string, volume?: number) => void;
  toggleMute: () => void;
  isMuted: boolean;
  setVolume: (volume: number) => void;
  volume: number;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

// Sound effects using Web Audio API for better performance
const createSoundEffect = (frequency: number, duration: number, type: OscillatorType = 'sine') => {
  return (audioContext: AudioContext, volume: number = 0.1) => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    oscillator.type = type;
    
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
  };
};

// Predefined sound effects
const soundEffects = {
  hover: createSoundEffect(800, 0.1, 'sine'),
  click: createSoundEffect(1000, 0.15, 'square'),
  success: createSoundEffect(523.25, 0.3, 'sine'), // C5 note
  error: createSoundEffect(220, 0.5, 'sawtooth'), // A3 note
  notification: createSoundEffect(659.25, 0.2, 'triangle'), // E5 note
  whoosh: createSoundEffect(400, 0.4, 'sawtooth'),
  pop: createSoundEffect(1200, 0.1, 'square'),
  chime: createSoundEffect(880, 0.6, 'sine'), // A5 note
};

interface SoundManagerProps {
  children: React.ReactNode;
  defaultVolume?: number;
  defaultMuted?: boolean;
}

export const SoundManager: React.FC<SoundManagerProps> = ({ 
  children, 
  defaultVolume = 0.3,
  defaultMuted = false 
}) => {
  const [isMuted, setIsMuted] = useState(defaultMuted);
  const [volume, setVolumeState] = useState(defaultVolume);
  const audioContextRef = useRef<AudioContext | null>(null);
  const lastPlayTimeRef = useRef<{ [key: string]: number }>({});

  useEffect(() => {
    // Initialize AudioContext on first user interaction
    const initAudioContext = () => {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }
    };

    const handleFirstInteraction = () => {
      initAudioContext();
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
    };

    document.addEventListener('click', handleFirstInteraction);
    document.addEventListener('keydown', handleFirstInteraction);

    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const playSound = useCallback((soundName: string, customVolume?: number) => {
    if (isMuted || !audioContextRef.current) return;

    // Throttle rapid sound plays
    const now = Date.now();
    const lastPlayTime = lastPlayTimeRef.current[soundName] || 0;
    if (now - lastPlayTime < 50) return; // 50ms throttle
    lastPlayTimeRef.current[soundName] = now;

    const soundEffect = soundEffects[soundName as keyof typeof soundEffects];
    if (soundEffect) {
      try {
        const effectiveVolume = (customVolume ?? volume) * 0.5; // Scale down for comfort
        soundEffect(audioContextRef.current, effectiveVolume);
      } catch (error) {
        console.warn('Failed to play sound:', error);
      }
    }
  }, [isMuted, volume]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  const setVolume = useCallback((newVolume: number) => {
    setVolumeState(Math.max(0, Math.min(1, newVolume)));
  }, []);

  const contextValue: SoundContextType = {
    playSound,
    toggleMute,
    isMuted,
    setVolume,
    volume
  };

  return (
    <SoundContext.Provider value={contextValue}>
      {children}
    </SoundContext.Provider>
  );
};

// Hook to use sound context
export const useSound = () => {
  const context = useContext(SoundContext);
  if (context === undefined) {
    throw new Error('useSound must be used within a SoundManager');
  }
  return context;
};

// HOC to add sound effects to components
export const withSoundEffects = <P extends object>(
  Component: React.ComponentType<P>,
  soundMap?: { [key: string]: string }
) => {
  return React.forwardRef<any, P & { onSoundTrigger?: (soundName: string) => void }>(
    (props, ref) => {
      const { playSound } = useSound();
      
      const handleSoundTrigger = useCallback((soundName: string) => {
        playSound(soundName);
        props.onSoundTrigger?.(soundName);
      }, [playSound, props]);

      return (
        <Component 
          {...props} 
          ref={ref}
          onSoundTrigger={handleSoundTrigger}
        />
      );
    }
  );
};

// Sound control component
export const SoundControls: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { isMuted, toggleMute, volume, setVolume } = useSound();

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <button
        onClick={toggleMute}
        className="p-2 rounded-lg bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-colors"
        title={isMuted ? 'Unmute sounds' : 'Mute sounds'}
      >
        {isMuted ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          </svg>
        )}
      </button>
      
      <div className="flex items-center space-x-2">
        <span className="text-xs text-gray-400">Volume</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          className="w-16 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
        />
      </div>
    </div>
  );
};

export default SoundManager;