import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  PlayIcon,
  PauseIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
} from '@heroicons/react/24/solid';
import { event } from '../lib/gtag';

const VideoDemo = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const videoRef = useRef(null);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        event({
          action: 'pause',
          category: 'Video',
          label: 'Demo Video',
          value: Math.round(currentTime),
        });
      } else {
        videoRef.current.play();
        event({
          action: 'play',
          category: 'Video',
          label: 'Demo Video',
          value: Math.round(currentTime),
        });
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleMuteToggle = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
      event({
        action: isMuted ? 'unmute' : 'mute',
        category: 'Video',
        label: 'Demo Video',
      });
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const time = pos * duration;
    
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleVideoEnd = () => {
    setIsPlaying(false);
    event({
      action: 'complete',
      category: 'Video',
      label: 'Demo Video',
      value: Math.round(duration),
    });
  };

  return (
    <div id="demo" className="py-24 sm:py-32 bg-gray-50">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-base font-semibold leading-7"
            style={{color: '#2563eb'}}
          >
            See It In Action
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            className="mt-2 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl"
          >
            Watch Git Memory MCP Server in Action
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="mt-6 text-lg leading-8 text-gray-600"
          >
            See how Git Memory MCP Server transforms your development workflow with intelligent code memory and AI-powered assistance.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="mx-auto mt-16 max-w-4xl"
        >
          <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Video Container */}
            <div className="relative aspect-video bg-gray-900">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={handleVideoEnd}
                poster="/demo-thumbnail.jpg"
              >
                <source src="/demo-video.mp4" type="video/mp4" />
                <source src="/demo-video.webm" type="video/webm" />
                Your browser does not support the video tag.
              </video>

              {/* Video Overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300">
                <button
                  onClick={handlePlayPause}
                  className="bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full p-4 transition-all duration-200 transform hover:scale-110"
                >
                  {isPlaying ? (
                    <PauseIcon className="h-8 w-8 text-gray-900" />
                  ) : (
                    <PlayIcon className="h-8 w-8 text-gray-900 ml-1" />
                  )}
                </button>
              </div>

              {/* Video Controls */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                {/* Progress Bar */}
                <div
                  className="w-full h-2 bg-gray-600 rounded-full cursor-pointer mb-3"
                  onClick={handleSeek}
                >
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-100"
                    style={{ width: `${(currentTime / duration) * 100}%` }}
                  />
                </div>

                {/* Control Buttons */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={handlePlayPause}
                      className="text-white hover:text-blue-400 transition-colors"
                    >
                      {isPlaying ? (
                        <PauseIcon className="h-6 w-6" />
                      ) : (
                        <PlayIcon className="h-6 w-6" />
                      )}
                    </button>
                    
                    <button
                      onClick={handleMuteToggle}
                      className="text-white hover:text-blue-400 transition-colors"
                    >
                      {isMuted ? (
                        <SpeakerXMarkIcon className="h-6 w-6" />
                      ) : (
                        <SpeakerWaveIcon className="h-6 w-6" />
                      )}
                    </button>

                    <span className="text-white text-sm">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-white text-sm">HD</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Video Description */}
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Complete Git Memory MCP Server Demo
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">What You'll See:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Installation and setup process</li>
                    <li>• AI-powered code suggestions</li>
                    <li>• Intelligent memory features</li>
                    <li>• Git integration capabilities</li>
                    <li>• MCP protocol in action</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Key Features Demonstrated:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Context-aware code completion</li>
                    <li>• Repository memory and learning</li>
                    <li>• Multi-model AI integration</li>
                    <li>• Real-time code analysis</li>
                    <li>• Seamless workflow integration</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center mt-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
              className="space-y-4"
            >
              <p className="text-lg text-gray-600">
                Ready to transform your development workflow?
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => {
                    event({
                      action: 'click',
                      category: 'CTA',
                      label: 'Get Started - Video Section',
                    });
                  }}
                  className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Get Started Free
                </button>
                <button
                  onClick={() => {
                    event({
                      action: 'click',
                      category: 'CTA',
                      label: 'View Pricing - Video Section',
                    });
                    document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="bg-white px-8 py-3 rounded-lg font-semibold transition-colors"
                  style={{
                    color: '#2563eb',
                    border: '1px solid #2563eb'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#eff6ff'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#ffffff'}
                >
                  View Pricing
                </button>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default VideoDemo;