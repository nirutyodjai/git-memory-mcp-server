import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import * as Tone from 'tone';
import './App.css';

const AppContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0f0f0f 100%);
  color: white;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
`;

const Navigation = styled.nav`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  
  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const NavBrand = styled.h1`
  font-size: 1.8rem;
  font-weight: 800;
  margin: 0;
  background: linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4);
  background-size: 400% 400%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: gradientShift 8s ease-in-out infinite;
`;

const NavLinks = styled.div`
  display: flex;
  gap: 2rem;
  
  @media (max-width: 768px) {
    gap: 1rem;
  }
`;

const NavLink = styled.button`
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  padding: 0.5rem 1rem;
  border-radius: 25px;
  transition: all 0.3s ease;
  
  &:hover {
    color: white;
    background: rgba(255, 255, 255, 0.05);
  }
  
  &.active {
    color: #4ecdc4;
    background: rgba(78, 205, 196, 0.1);
  }
`;

const SectionTitle = styled.h2`
  color: white;
  font-size: 1.5rem;
  font-weight: 600;
  margin: 2rem 2rem 1rem 2rem;
  
  @media (max-width: 768px) {
    margin: 1.5rem 1rem 0.8rem 1rem;
    font-size: 1.3rem;
  }
`;

const MainContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  min-height: 100vh;
  padding: 2rem;
`;

const HeroSection = styled(motion.div)`
  text-align: center;
  max-width: 800px;
  margin-bottom: 3rem;
`;

const Title = styled(motion.h1)`
  font-size: 4rem;
  font-weight: 800;
  background: linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4);
  background-size: 400% 400%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 1rem;
  animation: gradientShift 8s ease-in-out infinite;
  
  @keyframes gradientShift {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
  }
`;

const Subtitle = styled(motion.p)`
  font-size: 1.5rem;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 3rem;
  line-height: 1.6;
`;

const PromptContainer = styled(motion.div)`
  width: 100%;
  max-width: 600px;
  margin-bottom: 2rem;
`;

const PromptInput = styled.textarea`
  width: 100%;
  min-height: 120px;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 1.5rem;
  color: white;
  font-size: 1.1rem;
  font-family: inherit;
  resize: vertical;
  transition: all 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: #4ecdc4;
    box-shadow: 0 0 20px rgba(78, 205, 196, 0.2);
    background: rgba(255, 255, 255, 0.08);
  }
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
`;

const GenerateButton = styled(motion.button)`
  background: linear-gradient(45deg, #4ecdc4, #44a08d);
  border: none;
  border-radius: 50px;
  padding: 1rem 3rem;
  color: white;
  font-size: 1.2rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 8px 32px rgba(78, 205, 196, 0.3);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 40px rgba(78, 205, 196, 0.4);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const SongsGrid = styled(motion.div)`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
  width: 100%;
  max-width: 1200px;
  margin-top: 3rem;
`;

const SongCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 1.5rem;
  backdrop-filter: blur(20px);
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(78, 205, 196, 0.3);
    transform: translateY(-4px);
  }
`;

const SongHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.8rem;
`;

const SongMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 500;
`;

const SongActions = styled.div`
  display: flex;
  gap: 0.8rem;
  margin-top: 1rem;
  flex-wrap: wrap;
`;

const ActionButton = styled.button`
  padding: 0.6rem 1rem;
  border: none;
  border-radius: 25px;
  background: rgba(255, 255, 255, 0.05);
  color: white;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.1);
  
  &:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.2);
    transform: translateY(-1px);
  }
`;

const SongTitle = styled.h3`
  color: white;
  margin-bottom: 0.5rem;
  font-size: 1.2rem;
`;

const SongPrompt = styled.p`
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
  margin-bottom: 1rem;
  line-height: 1.4;
`;

const PlayButton = styled.button`
  background: linear-gradient(45deg, #ff6b6b, #ee5a52);
  border: none;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  transition: all 0.3s ease;
  
  &:hover {
    transform: scale(1.1);
    box-shadow: 0 8px 25px rgba(255, 107, 107, 0.4);
  }
`;

function App() {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('create');
  const [songs, setSongs] = useState([
    {
      id: 1,
      title: "Sunset Dreams",
      prompt: "A dreamy pop song about watching the sunset by the ocean",
      duration: "3:24",
      genre: "Pop",
      isPlaying: false
    },
    {
      id: 2,
      title: "Neon Nights",
      prompt: "Synthwave track with retro 80s vibes and neon lights",
      duration: "4:12",
      genre: "Synthwave",
      isPlaying: false
    },
    {
      id: 3,
      title: "Coffee Shop Jazz",
      prompt: "Smooth jazz for a cozy coffee shop atmosphere",
      duration: "2:58",
      genre: "Jazz",
      isPlaying: false
    },
    {
      id: 4,
      title: "Mountain Echo",
      prompt: "Ambient folk song inspired by mountain landscapes",
      duration: "5:03",
      genre: "Folk",
      isPlaying: false
    }
  ]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    
    // Simulate AI generation
    setTimeout(() => {
      const genres = ['Pop', 'Rock', 'Jazz', 'Electronic', 'Folk', 'Hip-Hop', 'Classical'];
      const randomGenre = genres[Math.floor(Math.random() * genres.length)];
      const randomDuration = `${Math.floor(Math.random() * 3) + 2}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`;
      
      const newSong = {
        id: Date.now(),
        title: `Generated Song ${songs.length + 1}`,
        prompt: prompt,
        duration: randomDuration,
        genre: randomGenre,
        isPlaying: false
      };
      setSongs([newSong, ...songs]);
      setPrompt('');
      setIsGenerating(false);
    }, 3000);
  };

  const handlePlay = (songId) => {
    setSongs(songs.map(song => ({
      ...song,
      isPlaying: song.id === songId ? !song.isPlaying : false
    })));
  };

  const handleDownload = (song, format = 'json') => {
    const fileName = song.title.replace(/[^a-zA-Z0-9]/g, '_');
    
    if (format === 'json') {
      // สร้างไฟล์ข้อมูลเพลงในรูปแบบ JSON
      const songData = {
        title: song.title,
        prompt: song.prompt,
        duration: song.duration,
        genre: song.genre,
        createdAt: new Date().toISOString(),
        format: 'mp3',
        sampleRate: '44100 Hz',
        bitRate: '320 kbps'
      };
      
      const jsonString = JSON.stringify(songData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${fileName}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      alert(`ดาวน์โหลดข้อมูลเพลง "${song.title}" เรียบร้อยแล้ว!`);
    } else if (format === 'mp3') {
      // สร้างไฟล์เสียง MP3 จำลอง (ในการใช้งานจริงจะต้องมี audio data)
      generateAudioFile(song, 'mp3', fileName);
    } else if (format === 'wav') {
      // สร้างไฟล์เสียง WAV จำลอง
      generateAudioFile(song, 'wav', fileName);
    } else if (format === 'mp4') {
      // สร้างไฟล์วิดีโอ MP4 จำลอง (audio only)
      generateAudioFile(song, 'mp4', fileName);
    }
  };

  const generateAudioFile = async (song, format, fileName) => {
    try {
      // สร้างไฟล์เสียงจำลองที่ไพเราะขึ้น
      await Tone.start();
      
      // สร้าง AudioContext สำหรับการสร้างเสียง
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const sampleRate = audioContext.sampleRate;
      const duration = 15; // เพิ่มเป็น 15 วินาที
      const numSamples = sampleRate * duration;
      
      // สร้าง buffer สำหรับเสียง
      const audioBuffer = audioContext.createBuffer(2, numSamples, sampleRate);
      
      // สร้างเสียงจำลองตาม genre
      const notes = getNotesForGenre(song.genre);
      const frequencies = notes.map(note => {
        // แปลงโน้ตเป็นความถี่
        const noteMap = {
          'C3': 130.81, 'D3': 146.83, 'E3': 164.81, 'F3': 174.61, 'G3': 196.00, 'A3': 220.00, 'B3': 246.94,
          'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23, 'G4': 392.00, 'A4': 440.00, 'B4': 493.88,
          'C5': 523.25, 'D5': 587.33, 'E5': 659.25, 'F5': 698.46, 'G5': 783.99
        };
        return noteMap[note] || 440;
      });
      
      // สร้างเสียงในแต่ละช่อง
      for (let channel = 0; channel < 2; channel++) {
        const channelData = audioBuffer.getChannelData(channel);
        
        for (let i = 0; i < numSamples; i++) {
          const time = i / sampleRate;
          let sample = 0;
          
          // สร้างเสียงที่ไพเราะขึ้นด้วย harmonics และ chord progression
          frequencies.forEach((freq, index) => {
            const noteTime = (index * duration) / frequencies.length;
            const noteDuration = duration / frequencies.length;
            
            if (time >= noteTime && time < noteTime + noteDuration) {
              const noteProgress = (time - noteTime) / noteDuration;
              
              // สร้าง chord แทนการเล่นโน้ตเดี่ยว
              const fundamental = freq;
              const third = freq * 1.25; // major third
              const fifth = freq * 1.5;  // perfect fifth
              
              // ใช้ sine wave ผสมกับ harmonics
              const wave1 = Math.sin(2 * Math.PI * fundamental * (time - noteTime)) * 0.4;
              const wave2 = Math.sin(2 * Math.PI * third * (time - noteTime)) * 0.2;
              const wave3 = Math.sin(2 * Math.PI * fifth * (time - noteTime)) * 0.15;
              
              // เพิ่ม subtle harmonics
              const harmonic2 = Math.sin(2 * Math.PI * fundamental * 2 * (time - noteTime)) * 0.05;
              const harmonic3 = Math.sin(2 * Math.PI * fundamental * 3 * (time - noteTime)) * 0.03;
              
              sample += wave1 + wave2 + wave3 + harmonic2 + harmonic3;
              
              // ADSR envelope สำหรับเสียงที่นุ่มนวล
              let envelope = 1;
              if (noteProgress < 0.1) {
                // Attack
                envelope = noteProgress / 0.1;
              } else if (noteProgress < 0.3) {
                // Decay
                envelope = 1 - (noteProgress - 0.1) / 0.2 * 0.3;
              } else if (noteProgress < 0.8) {
                // Sustain
                envelope = 0.7;
              } else {
                // Release
                envelope = 0.7 * (1 - (noteProgress - 0.8) / 0.2);
              }
              
              sample *= envelope;
            }
          });
          
          // เพิ่ม reverb effect แบบง่าย
          if (i > sampleRate * 0.1) {
            const delayIndex = Math.floor(i - sampleRate * 0.1);
            sample += channelData[delayIndex] * 0.15;
          }
          
          // Soft limiting เพื่อป้องกันการ clip
          sample = Math.tanh(sample * 0.8) * 0.6;
          
          channelData[i] = sample;
        }
      }
      
      // แปลง AudioBuffer เป็น WAV
      const wavData = audioBufferToWav(audioBuffer);
      const blob = new Blob([wavData], { 
        type: format === 'mp4' ? 'video/mp4' : 
              format === 'wav' ? 'audio/wav' : 'audio/mpeg' 
      });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${fileName}.${format === 'mp4' ? 'wav' : format}`; // MP4 จะบันทึกเป็น WAV
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      alert(`ดาวน์โหลดไฟล์เสียง "${song.title}.${format}" เรียบร้อยแล้ว!`);
      
    } catch (error) {
      console.error('Error generating audio:', error);
      alert('เกิดข้อผิดพลาดในการสร้างไฟล์เสียง: ' + error.message);
    }
  };

  // ฟังก์ชันแปลง AudioBuffer เป็น WAV
  const audioBufferToWav = (buffer) => {
    const length = buffer.length;
    const numberOfChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const arrayBuffer = new ArrayBuffer(44 + length * numberOfChannels * 2);
    const view = new DataView(arrayBuffer);
    
    // WAV header
    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * numberOfChannels * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numberOfChannels * 2, true);
    view.setUint16(32, numberOfChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length * numberOfChannels * 2, true);
    
    // PCM data
    let offset = 44;
    for (let i = 0; i < length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
        view.setInt16(offset, sample * 0x7FFF, true);
        offset += 2;
      }
    }
    
    return arrayBuffer;
  };

  const getNotesForGenre = (genre) => {
    const notePatterns = {
      'Pop': ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'],
      'Rock': ['E3', 'G3', 'A3', 'C4', 'D4', 'E4', 'G4', 'A4'],
      'Jazz': ['C4', 'E4', 'G4', 'B4', 'D5', 'F4', 'A4', 'C5'],
      'Electronic': ['C3', 'C4', 'G3', 'G4', 'F3', 'F4', 'A3', 'A4'],
      'Folk': ['G3', 'C4', 'D4', 'G4', 'B3', 'E4', 'A3', 'D4'],
      'Hip-Hop': ['C3', 'D3', 'F3', 'G3', 'A3', 'C4', 'D4', 'F4'],
      'Classical': ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'],
      'Synthwave': ['A3', 'C4', 'E4', 'G4', 'A4', 'C5', 'E5', 'G5']
    };
    return notePatterns[genre] || notePatterns['Pop'];
  };

  const showDownloadOptions = (song) => {
     const options = [
       { label: '📄 JSON (ข้อมูลเพลง)', value: 'json' },
       { label: '🎵 MP3 (เสียงคุณภาพสูง)', value: 'mp3' },
       { label: '🎶 WAV (เสียงไม่บีบอัด)', value: 'wav' },
       { label: '🎬 MP4 (วิดีโอเสียง)', value: 'mp4' }
     ];
     
     const choice = window.prompt(
       `เลือกรูปแบบไฟล์ที่ต้องการดาวน์โหลด:\n\n` +
       options.map((opt, index) => `${index + 1}. ${opt.label}`).join('\n') +
       `\n\nกรุณาใส่หมายเลข (1-${options.length}):`
     );
     
     const selectedIndex = parseInt(choice) - 1;
     if (selectedIndex >= 0 && selectedIndex < options.length) {
       handleDownload(song, options[selectedIndex].value);
     }
   };

  return (
    <AppContainer>
      <Navigation>
        <NavBrand>Suno AI</NavBrand>
        <NavLinks>
          <NavLink className={activeTab === 'create' ? 'active' : ''} onClick={() => setActiveTab('create')}>Create</NavLink>
          <NavLink className={activeTab === 'explore' ? 'active' : ''} onClick={() => setActiveTab('explore')}>Explore</NavLink>
          <NavLink className={activeTab === 'library' ? 'active' : ''} onClick={() => setActiveTab('library')}>Library</NavLink>
        </NavLinks>
      </Navigation>

      <MainContent>
        {activeTab === 'create' && (
          <>
            <HeroSection
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <Title
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                What music will you create today?
              </Title>
              <Subtitle
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                Describe your music and our AI will generate it for you
              </Subtitle>
            </HeroSection>
        
            <PromptContainer
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <PromptInput
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the song you want to create... \n\nFor example: 'A chill lo-fi hip hop beat with soft piano and rain sounds' or 'An upbeat pop song about summer adventures'"
                disabled={isGenerating}
              />
              
              <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                <GenerateButton
                  onClick={handleGenerate}
                  disabled={isGenerating || !prompt.trim()}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isGenerating ? 'Generating...' : 'Create Song'}
                </GenerateButton>
              </div>
            </PromptContainer>
          </>
        )}
        
        {activeTab === 'create' && (
          <SectionTitle>Your Creations</SectionTitle>
        )}
        {activeTab === 'explore' && (
          <SectionTitle>Trending Music</SectionTitle>
        )}
        {activeTab === 'library' && (
          <SectionTitle>Your Library</SectionTitle>
        )}
        
        <SongsGrid
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          <AnimatePresence>
            {songs.map((song, index) => (
              <SongCard
                key={song.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
              >
                <SongHeader>
                  <SongTitle>{song.title}</SongTitle>
                  <SongMeta>
                    <span>{song.duration}</span>
                    <span>•</span>
                    <span>{song.genre}</span>
                  </SongMeta>
                </SongHeader>
                <SongPrompt>{song.prompt}</SongPrompt>
                <SongActions>
                  <PlayButton onClick={() => handlePlay(song.id)}>
                    {song.isPlaying ? '⏸️' : '▶️'}
                  </PlayButton>
                  <ActionButton onClick={() => showDownloadOptions(song)}>
                    📥 Download
                  </ActionButton>
                  <ActionButton>
                    💾 Save
                  </ActionButton>
                  <ActionButton>
                    🔗 Share
                  </ActionButton>
                </SongActions>
              </SongCard>
            ))}
          </AnimatePresence>
        </SongsGrid>
      </MainContent>
    </AppContainer>
  );
}

export default App;
