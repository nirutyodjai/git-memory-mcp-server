import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import * as Tone from 'tone';

const PianoRollContainer = styled.div`
  flex: 1;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const PianoRollHeader = styled.div`
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

const Controls = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
`;

const ControlButton = styled(motion.button)`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  padding: 6px 12px;
  color: white;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.3);
  }

  &.active {
    background: linear-gradient(45deg, #4ecdc4, #44a08d);
    border-color: #4ecdc4;
  }
`;

const PianoRollContent = styled.div`
  flex: 1;
  display: flex;
  overflow: hidden;
`;

const PianoKeys = styled.div`
  width: 80px;
  background: rgba(0, 0, 0, 0.4);
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  overflow-y: auto;
`;

const PianoKey = styled.div`
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 500;
  cursor: pointer;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.2s ease;
  
  background: ${props => {
    if (props.$isBlackKey) {
      return props.$isActive ? '#4ecdc4' : '#2c3e50';
    }
    return props.$isActive ? '#4ecdc4' : '#34495e';
  }};
  
  color: ${props => props.$isActive ? 'white' : 'rgba(255, 255, 255, 0.7)'};

  &:hover {
    background: ${props => props.$isBlackKey ? '#34495e' : '#3d566e'};
    color: white;
  }
`;

const Grid = styled.div`
  flex: 1;
  position: relative;
  overflow: auto;
  background: linear-gradient(
    to right,
    transparent 0%,
    transparent 24px,
    rgba(255, 255, 255, 0.05) 25px,
    rgba(255, 255, 255, 0.05) 25px
  );
  background-size: 100px 20px;
`;

const GridLines = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: 
      linear-gradient(to right, rgba(255, 255, 255, 0.1) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
    background-size: 25px 20px;
  }
`;

const Note = styled(motion.div)`
  position: absolute;
  background: linear-gradient(45deg, #ff6b6b, #ee5a52);
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: white;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  
  &:hover {
    background: linear-gradient(45deg, #ee5a52, #ff4757);
    transform: scale(1.02);
  }
`;

const PlayheadLine = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  background: linear-gradient(to bottom, #4ecdc4, #44a08d);
  box-shadow: 0 0 10px rgba(78, 205, 196, 0.5);
  z-index: 10;
  transition: left 0.1s linear;
  left: ${props => props.position}px;
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

// Piano notes from C8 to C0 (88 keys)
const PIANO_NOTES = [];
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

for (let octave = 8; octave >= 0; octave--) {
  for (let i = NOTE_NAMES.length - 1; i >= 0; i--) {
    if (octave === 0 && i < 9) break; // Stop at A0
    if (octave === 8 && i > 0) continue; // Start at C8
    
    const noteName = NOTE_NAMES[i];
    const isBlackKey = noteName.includes('#');
    PIANO_NOTES.push({
      name: `${noteName}${octave}`,
      isBlackKey,
      frequency: Tone.Frequency(`${noteName}${octave}`).toFrequency()
    });
  }
}

function PianoRoll({ currentTrack, isPlaying }) {
  const [notes, setNotes] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [playheadPosition, setPlayheadPosition] = useState(0);
  const [synth, setSynth] = useState(null);
  const gridRef = useRef(null);
  const [dragStart, setDragStart] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    // Initialize synthesizer
    const newSynth = new Tone.Synth({
      oscillator: {
        type: 'triangle'
      },
      envelope: {
        attack: 0.02,
        decay: 0.1,
        sustain: 0.3,
        release: 1
      }
    }).toDestination();
    
    setSynth(newSynth);
    
    return () => {
      newSynth.dispose();
    };
  }, []);

  useEffect(() => {
    if (currentTrack && currentTrack.notes) {
      setNotes(currentTrack.notes);
    } else {
      setNotes([]);
    }
  }, [currentTrack]);

  const playNote = (noteName) => {
    if (synth && Tone.context.state === 'running') {
      synth.triggerAttackRelease(noteName, '8n');
    }
  };

  const handleGridClick = (e) => {
    if (!currentTrack || isDragging) return;
    
    const rect = gridRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const time = Math.floor(x / 25) * 0.25; // 16th note grid
    const noteIndex = Math.floor(y / 20);
    
    if (noteIndex >= 0 && noteIndex < PIANO_NOTES.length) {
      const newNote = {
        id: Date.now(),
        note: PIANO_NOTES[noteIndex].name,
        time: time,
        duration: 0.25,
        velocity: 80
      };
      
      setNotes([...notes, newNote]);
      playNote(newNote.note);
    }
  };

  const handleNoteDelete = (noteId) => {
    setNotes(notes.filter(note => note.id !== noteId));
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
  };

  return (
    <PianoRollContainer>
      <PianoRollHeader>
        <Title>
          🎹 Piano Roll {currentTrack ? `- ${currentTrack.name}` : ''}
        </Title>
        <Controls>
          <ControlButton
            className={isRecording ? 'active' : ''}
            onClick={toggleRecording}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isRecording ? '⏹️ Stop Recording' : '🔴 Record'}
          </ControlButton>
          <ControlButton
            onClick={() => setNotes([])}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            🗑️ Clear
          </ControlButton>
        </Controls>
      </PianoRollHeader>
      
      <PianoRollContent>
        <PianoKeys>
          {PIANO_NOTES.map((note, index) => (
            <PianoKey
              key={note.name}
              $isBlackKey={note.isBlackKey}
              onClick={() => playNote(note.name)}
            >
              {note.name}
            </PianoKey>
          ))}
        </PianoKeys>
        
        <Grid ref={gridRef} onClick={handleGridClick}>
          <GridLines />
          
          {isPlaying && (
            <PlayheadLine position={playheadPosition} />
          )}
          
          {notes.length === 0 && !currentTrack && (
            <EmptyState>
              <EmptyIcon>🎼</EmptyIcon>
              <EmptyText>Select a track to start composing</EmptyText>
              <EmptySubtext>Click on the grid to add notes</EmptySubtext>
            </EmptyState>
          )}
          
          {notes.length === 0 && currentTrack && (
            <EmptyState>
              <EmptyIcon>🎵</EmptyIcon>
              <EmptyText>Click to add notes</EmptyText>
              <EmptySubtext>Use the piano keys to preview sounds</EmptySubtext>
            </EmptyState>
          )}
          
          {notes.map((note) => {
            const noteIndex = PIANO_NOTES.findIndex(n => n.name === note.note);
            if (noteIndex === -1) return null;
            
            return (
              <Note
                key={note.id}
                style={{
                  left: `${note.time * 100}px`,
                  top: `${noteIndex * 20}px`,
                  width: `${note.duration * 100}px`,
                  height: '18px'
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleNoteDelete(note.id);
                }}
                whileHover={{ scale: 1.02 }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              >
                {note.note}
              </Note>
            );
          })}
        </Grid>
      </PianoRollContent>
    </PianoRollContainer>
  );
}

export default PianoRoll;