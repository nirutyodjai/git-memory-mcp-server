import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';

const HeaderContainer = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px 30px;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
`;

const Logo = styled.div`
  font-size: 24px;
  font-weight: bold;
  background: linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const TransportControls = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
`;

const PlayButton = styled(motion.button)`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: none;
  background: ${props => props.isPlaying ? 
    'linear-gradient(45deg, #ff4757, #ff3838)' : 
    'linear-gradient(45deg, #2ed573, #1dd1a1)'};
  color: white;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
  }

  &:active {
    transform: scale(0.95);
  }
`;

const StopButton = styled(motion.button)`
  width: 40px;
  height: 40px;
  border-radius: 8px;
  border: none;
  background: linear-gradient(45deg, #747d8c, #57606f);
  color: white;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;

  &:hover {
    transform: scale(1.05);
    background: linear-gradient(45deg, #57606f, #3d4454);
  }
`;

const BpmControl = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(255, 255, 255, 0.1);
  padding: 8px 15px;
  border-radius: 20px;
  backdrop-filter: blur(5px);
`;

const BpmInput = styled.input`
  width: 60px;
  background: transparent;
  border: none;
  color: white;
  font-size: 16px;
  font-weight: bold;
  text-align: center;
  outline: none;

  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  &[type=number] {
    -moz-appearance: textfield;
  }
`;

const BpmLabel = styled.span`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
`;

const ProjectInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 5px;
`;

const ProjectName = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: white;
`;

const ProjectStatus = styled.div`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
`;

function Header({ isPlaying, onPlay, onStop, bpm, onBpmChange }) {
  return (
    <HeaderContainer>
      <Logo>🎵 Music Composer Pro</Logo>
      
      <TransportControls>
        <PlayButton
          isPlaying={isPlaying}
          onClick={onPlay}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {isPlaying ? '⏸️' : '▶️'}
        </PlayButton>
        
        <StopButton
          onClick={onStop}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          ⏹️
        </StopButton>
        
        <BpmControl>
          <BpmInput
            type="number"
            value={bpm}
            onChange={(e) => onBpmChange(parseInt(e.target.value) || 120)}
            min="60"
            max="200"
          />
          <BpmLabel>BPM</BpmLabel>
        </BpmControl>
      </TransportControls>
      
      <ProjectInfo>
        <ProjectName>Untitled Project</ProjectName>
        <ProjectStatus>Ready to compose</ProjectStatus>
      </ProjectInfo>
    </HeaderContainer>
  );
}

export default Header;