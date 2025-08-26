import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';

const SequencerContainer = styled.div`
  flex: 2;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const SequencerHeader = styled.div`
  padding: 15px 20px;
  background: rgba(0, 0, 0, 0.2);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Title = styled.h3`
  margin: 0;
  color: white;
  font-size: 16px;
  font-weight: 600;
`;

const TimelineControls = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
`;

const ZoomControl = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  background: rgba(255, 255, 255, 0.1);
  padding: 5px 10px;
  border-radius: 15px;
`;

const ZoomButton = styled(motion.button)`
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 12px;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`;

const ZoomLevel = styled.span`
  color: rgba(255, 255, 255, 0.8);
  font-size: 12px;
  min-width: 30px;
  text-align: center;
`;

const SequencerContent = styled.div`
  flex: 1;
  display: flex;
  overflow: hidden;
`;

const TrackLabels = styled.div`
  width: 150px;
  background: rgba(0, 0, 0, 0.4);
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  overflow-y: auto;
`;

const TrackLabel = styled.div`
  height: 60px;
  padding: 10px 15px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  flex-direction: column;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  
  background: ${props => props.$isSelected ? 
    'linear-gradient(45deg, rgba(78, 205, 196, 0.2), rgba(68, 160, 141, 0.2))' :
    'transparent'};

  &:hover {
    background: rgba(255, 255, 255, 0.05);
  }
`;

const TrackName = styled.div`
  color: white;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 5px;
`;

const TrackInfo = styled.div`
  color: rgba(255, 255, 255, 0.6);
  font-size: 11px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Timeline = styled.div`
  flex: 1;
  position: relative;
  overflow: auto;
  background: linear-gradient(
    to right,
    transparent 0%,
    transparent 99px,
    rgba(255, 255, 255, 0.1) 100px,
    rgba(255, 255, 255, 0.1) 100px
  );
  background-size: ${props => props.zoom * 100}px 60px;
`;

const TimelineRuler = styled.div`
  position: sticky;
  top: 0;
  height: 30px;
  background: rgba(0, 0, 0, 0.6);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  z-index: 5;
`;

const TimeMarker = styled.div`
  position: absolute;
  height: 100%;
  display: flex;
  align-items: center;
  padding-left: 5px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.7);
  border-left: 1px solid rgba(255, 255, 255, 0.2);
  left: ${props => props.position}px;
`;

const TrackLane = styled.div`
  height: 60px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  position: relative;
  cursor: pointer;
  
  &:hover {
    background: rgba(255, 255, 255, 0.02);
  }
`;

const AudioClip = styled(motion.div)`
  position: absolute;
  top: 5px;
  height: 50px;
  background: linear-gradient(45deg, #4ecdc4, #44a08d);
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 0 10px;
  color: white;
  font-size: 12px;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  
  left: ${props => props.$startTime * props.$zoom * 100}px;
  width: ${props => props.$duration * props.$zoom * 100}px;
  
  &:hover {
    background: linear-gradient(45deg, #44a08d, #4ecdc4);
    transform: translateY(-1px);
  }
`;

const PlayheadLine = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  background: linear-gradient(to bottom, #ff6b6b, #ee5a52);
  box-shadow: 0 0 10px rgba(255, 107, 107, 0.5);
  z-index: 10;
  transition: left 0.1s linear;
  left: ${props => props.$position * props.$zoom * 100}px;
`;

const EmptyState = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: rgba(255, 255, 255, 0.4);
  pointer-events: none;
`;

const EmptyIcon = styled.div`
  font-size: 48px;
  margin-bottom: 15px;
  opacity: 0.3;
`;

const EmptyText = styled.div`
  font-size: 16px;
  margin-bottom: 5px;
`;

const EmptySubtext = styled.div`
  font-size: 12px;
  opacity: 0.7;
`;

function Sequencer({ tracks, isPlaying, bpm }) {
  const [zoom, setZoom] = useState(1);
  const [playheadPosition, setPlayheadPosition] = useState(0);
  const [selectedTrack, setSelectedTrack] = useState(null);
  const timelineRef = useRef(null);

  useEffect(() => {
    let animationFrame;
    
    if (isPlaying) {
      const updatePlayhead = () => {
        // Calculate playhead position based on transport time
        const currentTime = Date.now() / 1000; // Simple time calculation
        setPlayheadPosition((currentTime * bpm / 60) % 16); // 16 beats loop
        animationFrame = requestAnimationFrame(updatePlayhead);
      };
      updatePlayhead();
    }
    
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [isPlaying, bpm]);

  const handleZoomIn = () => {
    setZoom(Math.min(zoom * 1.5, 4));
  };

  const handleZoomOut = () => {
    setZoom(Math.max(zoom / 1.5, 0.25));
  };

  const generateTimeMarkers = () => {
    const markers = [];
    for (let i = 0; i <= 32; i++) {
      markers.push(
        <TimeMarker key={i} position={i * zoom * 100}>
          {i + 1}
        </TimeMarker>
      );
    }
    return markers;
  };

  const handleTrackClick = (track) => {
    setSelectedTrack(track);
  };

  // Generate sample clips for demonstration
  const generateSampleClips = (track) => {
    if (!track.notes || track.notes.length === 0) return [];
    
    // Group notes into clips
    const clips = [];
    let currentClip = null;
    
    track.notes.forEach((note, index) => {
      if (!currentClip || note.time > currentClip.endTime + 1) {
        if (currentClip) clips.push(currentClip);
        currentClip = {
          id: `clip-${track.id}-${index}`,
          startTime: note.time,
          endTime: note.time + note.duration,
          name: `Clip ${clips.length + 1}`
        };
      } else {
        currentClip.endTime = Math.max(currentClip.endTime, note.time + note.duration);
      }
    });
    
    if (currentClip) clips.push(currentClip);
    return clips;
  };

  return (
    <SequencerContainer>
      <SequencerHeader>
        <Title>🎬 Sequencer</Title>
        <TimelineControls>
          <ZoomControl>
            <ZoomButton
              onClick={handleZoomOut}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              −
            </ZoomButton>
            <ZoomLevel>{Math.round(zoom * 100)}%</ZoomLevel>
            <ZoomButton
              onClick={handleZoomIn}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              +
            </ZoomButton>
          </ZoomControl>
        </TimelineControls>
      </SequencerHeader>
      
      <SequencerContent>
        <TrackLabels>
          {tracks.map((track) => (
            <TrackLabel
              key={track.id}
              $isSelected={selectedTrack && selectedTrack.id === track.id}
              onClick={() => handleTrackClick(track)}
            >
              <TrackName>{track.name}</TrackName>
              <TrackInfo>
                <span>{track.type}</span>
                <span>{track.notes ? track.notes.length : 0} notes</span>
              </TrackInfo>
            </TrackLabel>
          ))}
        </TrackLabels>
        
        <Timeline ref={timelineRef} zoom={zoom}>
          <TimelineRuler>
            {generateTimeMarkers()}
          </TimelineRuler>
          
          {isPlaying && (
            <PlayheadLine $position={playheadPosition} $zoom={zoom} />
          )}
          
          {tracks.length === 0 ? (
            <EmptyState>
              <EmptyIcon>🎵</EmptyIcon>
              <EmptyText>No tracks to sequence</EmptyText>
              <EmptySubtext>Add tracks from the sidebar to start</EmptySubtext>
            </EmptyState>
          ) : (
            tracks.map((track) => {
              const clips = generateSampleClips(track);
              return (
                <TrackLane key={track.id}>
                  {clips.map((clip) => (
                    <AudioClip
                      key={clip.id}
                      $startTime={clip.startTime}
                      $duration={clip.endTime - clip.startTime}
                      $zoom={zoom}
                      whileHover={{ scale: 1.02 }}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      {clip.name}
                    </AudioClip>
                  ))}
                  {clips.length === 0 && (
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '20px',
                      transform: 'translateY(-50%)',
                      color: 'rgba(255, 255, 255, 0.3)',
                      fontSize: '12px',
                      pointerEvents: 'none'
                    }}>
                      Empty track - add notes in Piano Roll
                    </div>
                  )}
                </TrackLane>
              );
            })
          )}
        </Timeline>
      </SequencerContent>
    </SequencerContainer>
  );
}

export default Sequencer;