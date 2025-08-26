import React, { useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';

const MixerContainer = styled.div`
  flex: 1;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const MixerHeader = styled.div`
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

const MasterControls = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
`;

const MasterVolume = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.1);
  padding: 5px 12px;
  border-radius: 15px;
`;

const VolumeLabel = styled.span`
  color: rgba(255, 255, 255, 0.8);
  font-size: 12px;
  min-width: 40px;
`;

const VolumeSlider = styled.input`
  width: 80px;
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  outline: none;
  -webkit-appearance: none;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 14px;
    height: 14px;
    background: linear-gradient(45deg, #4ecdc4, #44a08d);
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  }

  &::-moz-range-thumb {
    width: 14px;
    height: 14px;
    background: linear-gradient(45deg, #4ecdc4, #44a08d);
    border-radius: 50%;
    cursor: pointer;
    border: none;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  }
`;

const MixerContent = styled.div`
  flex: 1;
  padding: 20px;
  overflow-y: auto;
`;

const ChannelStrips = styled.div`
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
`;

const ChannelStrip = styled(motion.div)`
  width: 80px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 15px 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.2);
    transform: translateY(-2px);
  }
`;

const ChannelName = styled.div`
  color: white;
  font-size: 12px;
  font-weight: 600;
  text-align: center;
  word-break: break-word;
  line-height: 1.2;
`;

const EQSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
`;

const EQKnob = styled.div`
  position: relative;
  width: 40px;
  height: 40px;
  margin: 0 auto;
`;

const KnobBase = styled.div`
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: linear-gradient(135deg, #2c3e50, #34495e);
  border: 2px solid rgba(255, 255, 255, 0.1);
  position: relative;
  cursor: pointer;
  
  &::before {
    content: '';
    position: absolute;
    top: 3px;
    left: 50%;
    transform: translateX(-50%);
    width: 2px;
    height: 12px;
    background: #4ecdc4;
    border-radius: 1px;
    transform-origin: 50% 15px;
    transform: translateX(-50%) rotate(${props => (props.$value - 50) * 2.7}deg);
  }
`;

const EQLabel = styled.div`
  color: rgba(255, 255, 255, 0.6);
  font-size: 10px;
  text-align: center;
  margin-top: 5px;
`;

const FaderSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  height: 150px;
  width: 100%;
`;

const Fader = styled.input`
  writing-mode: bt-lr; /* IE */
  -webkit-appearance: slider-vertical; /* WebKit */
  width: 30px;
  height: 120px;
  background: rgba(255, 255, 255, 0.1);
  outline: none;
  border-radius: 15px;
  cursor: pointer;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 25px;
    height: 15px;
    background: linear-gradient(45deg, #4ecdc4, #44a08d);
    border-radius: 3px;
    cursor: pointer;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  }

  &::-moz-range-thumb {
    width: 25px;
    height: 15px;
    background: linear-gradient(45deg, #4ecdc4, #44a08d);
    border-radius: 3px;
    cursor: pointer;
    border: none;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  }
`;

const VolumeDisplay = styled.div`
  color: rgba(255, 255, 255, 0.8);
  font-size: 10px;
  font-weight: 500;
  min-height: 12px;
`;

const ChannelButtons = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
`;

const ChannelButton = styled(motion.button)`
  background: ${props => {
    if (props.$active && props.$type === 'mute') return 'linear-gradient(45deg, #ff6b6b, #ee5a52)';
    if (props.$active && props.$type === 'solo') return 'linear-gradient(45deg, #feca57, #ff9ff3)';
    if (props.$active && props.$type === 'record') return 'linear-gradient(45deg, #ff6b6b, #ee5a52)';
    return 'rgba(255, 255, 255, 0.1)';
  }};
  border: 1px solid ${props => props.$active ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.1)'};
  border-radius: 6px;
  padding: 6px;
  color: white;
  font-size: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.2);
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: rgba(255, 255, 255, 0.4);
  text-align: center;
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

function Mixer({ tracks, onTracksChange }) {
  const [masterVolume, setMasterVolume] = useState(80);
  const [eqValues, setEqValues] = useState({});

  const updateTrack = (trackId, updates) => {
    const updatedTracks = tracks.map(track => 
      track.id === trackId ? { ...track, ...updates } : track
    );
    onTracksChange(updatedTracks);
  };

  const handleEQChange = (trackId, eqType, value) => {
    setEqValues(prev => ({
      ...prev,
      [`${trackId}-${eqType}`]: value
    }));
  };

  const getEQValue = (trackId, eqType) => {
    return eqValues[`${trackId}-${eqType}`] || 50;
  };

  return (
    <MixerContainer>
      <MixerHeader>
        <Title>🎚️ Mixer</Title>
        <MasterControls>
          <MasterVolume>
            <VolumeLabel>Master</VolumeLabel>
            <VolumeSlider
              type="range"
              min="0"
              max="100"
              value={masterVolume}
              onChange={(e) => setMasterVolume(parseInt(e.target.value))}
            />
            <span style={{ color: 'white', fontSize: '12px', minWidth: '30px' }}>
              {masterVolume}
            </span>
          </MasterVolume>
        </MasterControls>
      </MixerHeader>
      
      <MixerContent>
        {tracks.length === 0 ? (
          <EmptyState>
            <EmptyIcon>🎛️</EmptyIcon>
            <EmptyText>No tracks to mix</EmptyText>
            <EmptySubtext>Add tracks to see mixer channels</EmptySubtext>
          </EmptyState>
        ) : (
          <ChannelStrips>
            {tracks.map((track) => (
              <ChannelStrip
                key={track.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                whileHover={{ scale: 1.02 }}
              >
                <ChannelName>{track.name}</ChannelName>
                
                <EQSection>
                  <EQKnob>
                    <KnobBase 
                      $value={getEQValue(track.id, 'high')}
                      onClick={() => handleEQChange(track.id, 'high', Math.random() * 100)}
                    />
                    <EQLabel>HIGH</EQLabel>
                  </EQKnob>
                  
                  <EQKnob>
                    <KnobBase 
                      $value={getEQValue(track.id, 'mid')}
                      onClick={() => handleEQChange(track.id, 'mid', Math.random() * 100)}
                    />
                    <EQLabel>MID</EQLabel>
                  </EQKnob>
                  
                  <EQKnob>
                    <KnobBase 
                      $value={getEQValue(track.id, 'low')}
                      onClick={() => handleEQChange(track.id, 'low', Math.random() * 100)}
                    />
                    <EQLabel>LOW</EQLabel>
                  </EQKnob>
                </EQSection>
                
                <FaderSection>
                  <Fader
                    type="range"
                    min="0"
                    max="100"
                    value={track.volume || 80}
                    onChange={(e) => updateTrack(track.id, { volume: parseInt(e.target.value) })}
                    orient="vertical"
                  />
                  <VolumeDisplay>{track.volume || 80}</VolumeDisplay>
                </FaderSection>
                
                <ChannelButtons>
                  <ChannelButton
                    $type="mute"
                    $active={track.muted}
                    onClick={() => updateTrack(track.id, { muted: !track.muted })}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    MUTE
                  </ChannelButton>
                  
                  <ChannelButton
                    $type="solo"
                    $active={track.solo}
                    onClick={() => updateTrack(track.id, { solo: !track.solo })}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    SOLO
                  </ChannelButton>
                  
                  <ChannelButton
                    $type="record"
                    $active={track.recording}
                    onClick={() => updateTrack(track.id, { recording: !track.recording })}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    REC
                  </ChannelButton>
                </ChannelButtons>
              </ChannelStrip>
            ))}
          </ChannelStrips>
        )}
      </MixerContent>
    </MixerContainer>
  );
}

export default Mixer;