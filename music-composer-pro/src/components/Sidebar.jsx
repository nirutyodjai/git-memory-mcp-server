import React, { useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';

const SidebarContainer = styled.div`
  width: 300px;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(10px);
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const SidebarHeader = styled.div`
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const SidebarTitle = styled.h3`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: white;
`;

const AddTrackButton = styled(motion.button)`
  background: linear-gradient(45deg, #4ecdc4, #44a08d);
  border: none;
  border-radius: 20px;
  padding: 8px 16px;
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  }
`;

const TracksList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 10px;
`;

const TrackItem = styled(motion.div)`
  background: ${props => props.$isSelected ? 
    'linear-gradient(45deg, rgba(78, 205, 196, 0.3), rgba(68, 160, 141, 0.3))' :
    'rgba(255, 255, 255, 0.05)'};
  border: 1px solid ${props => props.$isSelected ? 
    'rgba(78, 205, 196, 0.5)' : 'rgba(255, 255, 255, 0.1)'};
  border-radius: 12px;
  padding: 15px;
  margin-bottom: 10px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.2);
    transform: translateX(5px);
  }
`;

const TrackHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
`;

const TrackName = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: white;
`;

const TrackControls = styled.div`
  display: flex;
  gap: 5px;
`;

const TrackButton = styled.button`
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  font-size: 12px;
  transition: all 0.2s ease;

  &:hover {
    color: white;
    background: rgba(255, 255, 255, 0.1);
  }
`;

const TrackInfo = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
`;

const TrackType = styled.span`
  background: linear-gradient(45deg, #ff6b6b, #ee5a52);
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 500;
  color: white;
`;

const VolumeSlider = styled.input`
  width: 60px;
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  outline: none;
  -webkit-appearance: none;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 12px;
    height: 12px;
    background: #4ecdc4;
    border-radius: 50%;
    cursor: pointer;
  }

  &::-moz-range-thumb {
    width: 12px;
    height: 12px;
    background: #4ecdc4;
    border-radius: 50%;
    cursor: pointer;
    border: none;
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: rgba(255, 255, 255, 0.5);
  text-align: center;
  padding: 20px;
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

function Sidebar({ tracks, currentTrack, onTrackSelect, onTracksChange }) {
  const [nextTrackId, setNextTrackId] = useState(1);

  const addTrack = () => {
    const newTrack = {
      id: nextTrackId,
      name: `Track ${nextTrackId}`,
      type: 'MIDI',
      volume: 80,
      muted: false,
      solo: false,
      notes: []
    };
    
    onTracksChange([...tracks, newTrack]);
    setNextTrackId(nextTrackId + 1);
    onTrackSelect(newTrack);
  };

  const deleteTrack = (trackId) => {
    const updatedTracks = tracks.filter(track => track.id !== trackId);
    onTracksChange(updatedTracks);
    
    if (currentTrack && currentTrack.id === trackId) {
      onTrackSelect(updatedTracks.length > 0 ? updatedTracks[0] : null);
    }
  };

  const updateTrack = (trackId, updates) => {
    const updatedTracks = tracks.map(track => 
      track.id === trackId ? { ...track, ...updates } : track
    );
    onTracksChange(updatedTracks);
  };

  return (
    <SidebarContainer>
      <SidebarHeader>
        <SidebarTitle>Tracks</SidebarTitle>
        <AddTrackButton
          onClick={addTrack}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          ➕ Add Track
        </AddTrackButton>
      </SidebarHeader>
      
      <TracksList>
        <AnimatePresence>
          {tracks.length === 0 ? (
            <EmptyState>
              <EmptyIcon>🎼</EmptyIcon>
              <EmptyText>No tracks yet</EmptyText>
              <EmptySubtext>Click "Add Track" to start composing</EmptySubtext>
            </EmptyState>
          ) : (
            tracks.map((track) => (
              <TrackItem
                key={track.id}
                $isSelected={currentTrack && currentTrack.id === track.id}
                onClick={() => onTrackSelect(track)}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <TrackHeader>
                  <TrackName>{track.name}</TrackName>
                  <TrackControls>
                    <TrackButton
                      onClick={(e) => {
                        e.stopPropagation();
                        updateTrack(track.id, { muted: !track.muted });
                      }}
                      style={{ color: track.muted ? '#ff6b6b' : 'inherit' }}
                    >
                      {track.muted ? '🔇' : '🔊'}
                    </TrackButton>
                    <TrackButton
                      onClick={(e) => {
                        e.stopPropagation();
                        updateTrack(track.id, { solo: !track.solo });
                      }}
                      style={{ color: track.solo ? '#4ecdc4' : 'inherit' }}
                    >
                      S
                    </TrackButton>
                    <TrackButton
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteTrack(track.id);
                      }}
                    >
                      🗑️
                    </TrackButton>
                  </TrackControls>
                </TrackHeader>
                
                <TrackInfo>
                  <TrackType>{track.type}</TrackType>
                  <VolumeSlider
                    type="range"
                    min="0"
                    max="100"
                    value={track.volume}
                    onChange={(e) => {
                      e.stopPropagation();
                      updateTrack(track.id, { volume: parseInt(e.target.value) });
                    }}
                  />
                </TrackInfo>
              </TrackItem>
            ))
          )}
        </AnimatePresence>
      </TracksList>
    </SidebarContainer>
  );
}

export default Sidebar;