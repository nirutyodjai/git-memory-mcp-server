/**
 * Advanced Collaboration Hub
 * Powerful real-time collaboration system
 * Supports live coding, voice/video chat, screen sharing, and AI meeting assistant
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { EventEmitter } from '../../utils/EventEmitter';
import { Logger } from '../../utils/Logger';
import { aiCodeAssistant } from '../../services/AICodeAssistant';
import { multiModelAI } from '../../services/MultiModelAI';

// Collaboration Types
export interface CollaborationUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  status: 'online' | 'away' | 'busy' | 'offline';
  cursor?: {
    file: string;
    line: number;
    column: number;
  };
  selection?: {
    file: string;
    start: { line: number; column: number };
    end: { line: number; column: number };
  };
  permissions: {
    canEdit: boolean;
    canComment: boolean;
    canShare: boolean;
    canManageUsers: boolean;
  };
  lastSeen: Date;
  color: string; // Color used to display cursor and selection
}

export interface CollaborationSession {
  id: string;
  name: string;
  description: string;
  owner: string;
  participants: CollaborationUser[];
  files: {
    [filePath: string]: {
      content: string;
      version: number;
      lastModified: Date;
      lockedBy?: string;
      comments: CollaborationComment[];
    };
  };
  settings: {
    allowAnonymous: boolean;
    requireApproval: boolean;
    maxParticipants: number;
    autoSave: boolean;
    conflictResolution: 'manual' | 'auto-merge' | 'last-writer-wins';
  };
  voice: {
    enabled: boolean;
    participants: string[];
    speaking?: string;
  };
  video: {
    enabled: boolean;
    participants: string[];
    screenSharing?: string;
  };
  ai: {
    enabled: boolean;
    assistant: {
      active: boolean;
      model: string;
      context: any;
    };
    suggestions: CollaborationSuggestion[];
  };
  created: Date;
  lastActivity: Date;
}

export interface CollaborationComment {
  id: string;
  author: string;
  content: string;
  position: {
    line: number;
    column?: number;
  };
  resolved: boolean;
  replies: CollaborationComment[];
  created: Date;
  updated?: Date;
}

export interface CollaborationSuggestion {
  id: string;
  type: 'code-improvement' | 'bug-fix' | 'optimization' | 'refactoring' | 'documentation';
  title: string;
  description: string;
  file: string;
  position: {
    start: { line: number; column: number };
    end: { line: number; column: number };
  };
  originalCode: string;
  suggestedCode: string;
  confidence: number;
  author: 'ai' | string;
  status: 'pending' | 'accepted' | 'rejected' | 'modified';
  votes: {
    up: string[];
    down: string[];
  };
  created: Date;
}

export interface CollaborationChange {
  id: string;
  type: 'insert' | 'delete' | 'replace';
  file: string;
  position: {
    start: { line: number; column: number };
    end: { line: number; column: number };
  };
  content: string;
  author: string;
  timestamp: Date;
  version: number;
}

// WebRTC Configuration
const WEBRTC_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

// Collaboration Hub Component
export const AdvancedCollaborationHub: React.FC<{
  sessionId?: string;
  currentUser: CollaborationUser;
  onSessionChange?: (session: CollaborationSession) => void;
}> = ({ sessionId, currentUser, onSessionChange }) => {
  const [session, setSession] = useState<CollaborationSession | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [participants, setParticipants] = useState<CollaborationUser[]>([]);
  const [comments, setComments] = useState<CollaborationComment[]>([]);
  const [suggestions, setSuggestions] = useState<CollaborationSuggestion[]>([]);
  const [activeFile, setActiveFile] = useState<string>('');
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{
    id: string;
    author: string;
    content: string;
    timestamp: Date;
    type: 'text' | 'code' | 'file' | 'system';
  }>>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [aiAssistantActive, setAiAssistantActive] = useState(false);
  
  const eventEmitter = useRef(new EventEmitter());
  const logger = Logger.getInstance();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideosRef = useRef<{ [userId: string]: HTMLVideoElement }>({});
  const peerConnections = useRef<{ [userId: string]: RTCPeerConnection }>({});
  const localStream = useRef<MediaStream | null>(null);

  // Initialize collaboration session
  useEffect(() => {
    if (sessionId) {
      initializeSession(sessionId);
    }
    
    return () => {
      cleanup();
    };
  }, [sessionId]);

  // Initialize WebSocket connection
  const initializeSession = useCallback(async (id: string) => {
    try {
      // Connect to collaboration server
      const newSocket = io('/collaboration', {
        query: { sessionId: id, userId: currentUser.id }
      });

      newSocket.on('connect', () => {
        setIsConnected(true);
        logger.info('Connected to collaboration session', { sessionId: id });
      });

      newSocket.on('disconnect', () => {
        setIsConnected(false);
        logger.info('Disconnected from collaboration session');
      });

      newSocket.on('session-updated', (updatedSession: CollaborationSession) => {
        setSession(updatedSession);
        setParticipants(updatedSession.participants);
        onSessionChange?.(updatedSession);
      });

      newSocket.on('user-joined', (user: CollaborationUser) => {
        setParticipants(prev => [...prev.filter(p => p.id !== user.id), user]);
        addChatMessage({
          id: `system_${Date.now()}`,
          author: 'System',
          content: `${user.name} joined the session`,
          timestamp: new Date(),
          type: 'system'
        });
      });

      newSocket.on('user-left', (userId: string) => {
        setParticipants(prev => prev.filter(p => p.id !== userId));
        const user = participants.find(p => p.id === userId);
        if (user) {
          addChatMessage({
            id: `system_${Date.now()}`,
            author: 'System',
            content: `${user.name} left the session`,
            timestamp: new Date(),
            type: 'system'
          });
        }
      });

      newSocket.on('cursor-moved', (data: { userId: string; file: string; line: number; column: number }) => {
        setParticipants(prev => prev.map(p => 
          p.id === data.userId 
            ? { ...p, cursor: { file: data.file, line: data.line, column: data.column } }
            : p
        ));
      });

      newSocket.on('selection-changed', (data: { 
        userId: string; 
        file: string; 
        start: { line: number; column: number }; 
        end: { line: number; column: number };
      }) => {
        setParticipants(prev => prev.map(p => 
          p.id === data.userId 
            ? { ...p, selection: { file: data.file, start: data.start, end: data.end } }
            : p
        ));
      });

      newSocket.on('file-changed', (change: CollaborationChange) => {
        eventEmitter.current.emit('file-change', change);
      });

      newSocket.on('comment-added', (comment: CollaborationComment) => {
        setComments(prev => [...prev, comment]);
      });

      newSocket.on('suggestion-added', (suggestion: CollaborationSuggestion) => {
        setSuggestions(prev => [...prev, suggestion]);
      });

      newSocket.on('chat-message', (message: any) => {
        addChatMessage(message);
      });

      newSocket.on('voice-state-changed', (data: { userId: string; enabled: boolean }) => {
        // Handle voice state changes
      });

      newSocket.on('video-state-changed', (data: { userId: string; enabled: boolean }) => {
        // Handle video state changes
      });

      newSocket.on('screen-share-started', (data: { userId: string }) => {
        // Handle screen sharing
      });

      newSocket.on('webrtc-offer', async (data: { from: string; offer: RTCSessionDescriptionInit }) => {
        await handleWebRTCOffer(data.from, data.offer);
      });

      newSocket.on('webrtc-answer', async (data: { from: string; answer: RTCSessionDescriptionInit }) => {
        await handleWebRTCAnswer(data.from, data.answer);
      });

      newSocket.on('webrtc-ice-candidate', async (data: { from: string; candidate: RTCIceCandidateInit }) => {
        await handleWebRTCIceCandidate(data.from, data.candidate);
      });

      setSocket(newSocket);

    } catch (error) {
      logger.error('Failed to initialize collaboration session', { error });
    }
  }, [currentUser, participants, onSessionChange, logger]);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (socket) {
      socket.disconnect();
    }
    
    // Close all peer connections
    Object.values(peerConnections.current).forEach(pc => pc.close());
    peerConnections.current = {};
    
    // Stop local stream
    if (localStream.current) {
      localStream.current.getTracks().forEach(track => track.stop());
      localStream.current = null;
    }
  }, [socket]);

  // WebRTC Functions
  const createPeerConnection = useCallback((userId: string): RTCPeerConnection => {
    const pc = new RTCPeerConnection(WEBRTC_CONFIG);
    
    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('webrtc-ice-candidate', {
          to: userId,
          candidate: event.candidate.toJSON()
        });
      }
    };
    
    pc.ontrack = (event) => {
      const remoteVideo = remoteVideosRef.current[userId];
      if (remoteVideo && event.streams[0]) {
        remoteVideo.srcObject = event.streams[0];
      }
    };
    
    // Add local stream if available
    if (localStream.current) {
      localStream.current.getTracks().forEach(track => {
        pc.addTrack(track, localStream.current!);
      });
    }
    
    peerConnections.current[userId] = pc;
    return pc;
  }, [socket]);

  const handleWebRTCOffer = useCallback(async (fromUserId: string, offer: RTCSessionDescriptionInit) => {
    try {
      const pc = createPeerConnection(fromUserId);
      await pc.setRemoteDescription(offer);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      
      if (socket) {
        socket.emit('webrtc-answer', {
          to: fromUserId,
          answer: answer
        });
      }
    } catch (error) {
      logger.error('Failed to handle WebRTC offer', { error });
    }
  }, [createPeerConnection, socket, logger]);

  const handleWebRTCAnswer = useCallback(async (fromUserId: string, answer: RTCSessionDescriptionInit) => {
    try {
      const pc = peerConnections.current[fromUserId];
      if (pc) {
        await pc.setRemoteDescription(answer);
      }
    } catch (error) {
      logger.error('Failed to handle WebRTC answer', { error });
    }
  }, [logger]);

  const handleWebRTCIceCandidate = useCallback(async (fromUserId: string, candidate: RTCIceCandidateInit) => {
    try {
      const pc = peerConnections.current[fromUserId];
      if (pc) {
        await pc.addIceCandidate(candidate);
      }
    } catch (error) {
      logger.error('Failed to handle WebRTC ICE candidate', { error });
    }
  }, [logger]);

  // Voice/Video Functions
  const toggleVoice = useCallback(async () => {
    try {
      if (!isVoiceEnabled) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        localStream.current = stream;
        
        // Create peer connections for all participants
        participants.forEach(participant => {
          if (participant.id !== currentUser.id) {
            createPeerConnection(participant.id);
          }
        });
      } else {
        if (localStream.current) {
          localStream.current.getAudioTracks().forEach(track => track.stop());
        }
      }
      
      setIsVoiceEnabled(!isVoiceEnabled);
      
      if (socket) {
        socket.emit('voice-state-changed', { enabled: !isVoiceEnabled });
      }
      
    } catch (error) {
      logger.error('Failed to toggle voice', { error });
    }
  }, [isVoiceEnabled, participants, currentUser, createPeerConnection, socket, logger]);

  const toggleVideo = useCallback(async () => {
    try {
      if (!isVideoEnabled) {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: isVoiceEnabled, 
          video: true 
        });
        localStream.current = stream;
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        
        // Update existing peer connections
        Object.values(peerConnections.current).forEach(pc => {
          stream.getTracks().forEach(track => {
            pc.addTrack(track, stream);
          });
        });
      } else {
        if (localStream.current) {
          localStream.current.getVideoTracks().forEach(track => track.stop());
        }
      }
      
      setIsVideoEnabled(!isVideoEnabled);
      
      if (socket) {
        socket.emit('video-state-changed', { enabled: !isVideoEnabled });
      }
      
    } catch (error) {
      logger.error('Failed to toggle video', { error });
    }
  }, [isVideoEnabled, isVoiceEnabled, socket, logger]);

  const toggleScreenShare = useCallback(async () => {
    try {
      if (!isScreenSharing) {
        const stream = await navigator.mediaDevices.getDisplayMedia({ 
          video: true, 
          audio: true 
        });
        
        // Replace video track in peer connections
        const videoTrack = stream.getVideoTracks()[0];
        Object.values(peerConnections.current).forEach(pc => {
          const sender = pc.getSenders().find(s => 
            s.track && s.track.kind === 'video'
          );
          if (sender) {
            sender.replaceTrack(videoTrack);
          }
        });
        
        videoTrack.onended = () => {
          setIsScreenSharing(false);
          if (socket) {
            socket.emit('screen-share-stopped');
          }
        };
      }
      
      setIsScreenSharing(!isScreenSharing);
      
      if (socket) {
        socket.emit('screen-share-started');
      }
      
    } catch (error) {
      logger.error('Failed to toggle screen share', { error });
    }
  }, [isScreenSharing, socket, logger]);

  // Chat Functions
  const addChatMessage = useCallback((message: any) => {
    setChatMessages(prev => [...prev, message]);
  }, []);

  const sendChatMessage = useCallback(() => {
    if (newMessage.trim() && socket) {
      const message = {
        id: `msg_${Date.now()}`,
        author: currentUser.name,
        content: newMessage.trim(),
        timestamp: new Date(),
        type: 'text' as const
      };
      
      socket.emit('chat-message', message);
      addChatMessage(message);
      setNewMessage('');
    }
  }, [newMessage, socket, currentUser, addChatMessage]);

  // AI Assistant Functions
  const toggleAIAssistant = useCallback(async () => {
    setAiAssistantActive(!aiAssistantActive);
    
    if (!aiAssistantActive && socket) {
      // Start AI assistant
      const context = {
        session: session,
        participants: participants,
        activeFile: activeFile,
        recentMessages: chatMessages.slice(-10)
      };
      
      try {
        const aiResponse = await aiCodeAssistant.processRequest({
          id: `ai_assistant_${Date.now()}`,
          type: 'collaboration-assistance',
          input: 'Start AI meeting assistant for collaboration session',
          context: {
            currentFile: {
              path: activeFile,
              content: '',
              language: 'typescript',
              cursorPosition: { line: 1, column: 1 }
            },
            project: {
              name: session?.name || 'Collaboration Project',
              type: 'web',
              dependencies: [],
              structure: {
                directories: [],
                files: [],
                patterns: {
                  testFiles: [],
                  configFiles: [],
                  sourceFiles: []
                }
              }
            },
            recentFiles: [],
            collaboration: context
          }
        });
        
        if (aiResponse.success) {
          addChatMessage({
            id: `ai_${Date.now()}`,
            author: 'AI Assistant',
            content: aiResponse.result.primary.content,
            timestamp: new Date(),
            type: 'system'
          });
        }
        
      } catch (error) {
        logger.error('Failed to start AI assistant', { error });
      }
    }
  }, [aiAssistantActive, socket, session, participants, activeFile, chatMessages, aiCodeAssistant, logger]);

  // Generate AI suggestions
  const generateAISuggestions = useCallback(async (fileContent: string, filePath: string) => {
    if (!aiAssistantActive) return;
    
    try {
      const result = await aiCodeAssistant.processRequest({
        id: `suggestions_${Date.now()}`,
        type: 'code-review',
        input: `Analyze this code and provide suggestions for improvement:\n\n${fileContent}`,
        context: {
          currentFile: {
            path: filePath,
            content: fileContent,
            language: 'typescript',
            cursorPosition: { line: 1, column: 1 }
          },
          project: {
            name: session?.name || 'Project',
            type: 'web',
            dependencies: [],
            structure: {
              directories: [],
              files: [],
              patterns: {
                testFiles: [],
                configFiles: [],
                sourceFiles: []
              }
            }
          },
          recentFiles: []
        }
      });
      
      if (result.success && result.result.suggestions) {
        const newSuggestions = result.result.suggestions.map((suggestion: any) => ({
          id: `ai_suggestion_${Date.now()}_${Math.random()}`,
          type: suggestion.type || 'code-improvement',
          title: suggestion.title,
          description: suggestion.description,
          file: filePath,
          position: suggestion.position || { start: { line: 1, column: 1 }, end: { line: 1, column: 1 } },
          originalCode: suggestion.originalCode || '',
          suggestedCode: suggestion.suggestedCode || '',
          confidence: suggestion.confidence || 0.8,
          author: 'ai',
          status: 'pending' as const,
          votes: { up: [], down: [] },
          created: new Date()
        }));
        
        setSuggestions(prev => [...prev, ...newSuggestions]);
        
        if (socket) {
          newSuggestions.forEach(suggestion => {
            socket.emit('suggestion-added', suggestion);
          });
        }
      }
      
    } catch (error) {
      logger.error('Failed to generate AI suggestions', { error });
    }
  }, [aiAssistantActive, aiCodeAssistant, session, socket, logger]);

  // Render participant list
  const renderParticipants = () => (
    <div className="participants-panel" style={{
      background: 'white',
      border: '1px solid #ddd',
      borderRadius: '8px',
      padding: '16px',
      marginBottom: '16px'
    }}>
      <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 'bold' }}>
        Participants ({participants.length})
      </h3>
      
      {participants.map(participant => (
        <div key={participant.id} className="participant-item" style={{
          display: 'flex',
          alignItems: 'center',
          padding: '8px',
          marginBottom: '4px',
          borderRadius: '4px',
          background: participant.id === currentUser.id ? '#e3f2fd' : 'transparent'
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: participant.status === 'online' ? '#4caf50' : '#9e9e9e',
            marginRight: '8px'
          }} />
          
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '12px', fontWeight: 'bold' }}>
              {participant.name}
              {participant.id === currentUser.id && ' (You)'}
            </div>
            <div style={{ fontSize: '10px', color: '#666' }}>
              {participant.role} - {participant.status}
            </div>
          </div>
          
          <div style={{
            width: '12px',
            height: '12px',
            borderRadius: '2px',
            background: participant.color,
            marginLeft: '8px'
          }} />
        </div>
      ))}
    </div>
  );

  // Render chat
  const renderChat = () => (
    <div className="chat-panel" style={{
      background: 'white',
      border: '1px solid #ddd',
      borderRadius: '8px',
      padding: '16px',
      height: '300px',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 'bold' }}>
        Chat
      </h3>
      
      <div className="chat-messages" style={{
        flex: 1,
        overflowY: 'auto',
        marginBottom: '12px',
        padding: '8px',
        background: '#f9f9f9',
        borderRadius: '4px'
      }}>
        {chatMessages.map(message => (
          <div key={message.id} className="chat-message" style={{
            marginBottom: '8px',
            padding: '6px',
            borderRadius: '4px',
            background: message.type === 'system' ? '#fff3cd' : 'white',
            fontSize: '12px'
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>
              {message.author}
              <span style={{ fontWeight: 'normal', color: '#666', marginLeft: '8px' }}>
                {message.timestamp.toLocaleTimeString()}
              </span>
            </div>
            <div>{message.content}</div>
          </div>
        ))}
      </div>
      
      <div className="chat-input" style={{
        display: 'flex',
        gap: '8px'
      }}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
          placeholder="Type a message..."
          style={{
            flex: 1,
            padding: '6px 8px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '12px'
          }}
        />
        <button
          onClick={sendChatMessage}
          style={{
            padding: '6px 12px',
            background: '#2196f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          Send
        </button>
      </div>
    </div>
  );

  // Render suggestions
  const renderSuggestions = () => (
    <div className="suggestions-panel" style={{
      background: 'white',
      border: '1px solid #ddd',
      borderRadius: '8px',
      padding: '16px',
      marginTop: '16px'
    }}>
      <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 'bold' }}>
        AI Suggestions ({suggestions.length})
      </h3>
      
      {suggestions.map(suggestion => (
        <div key={suggestion.id} className="suggestion-item" style={{
          padding: '12px',
          marginBottom: '8px',
          border: '1px solid #e0e0e0',
          borderRadius: '4px',
          background: '#fafafa'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ fontSize: '12px', fontWeight: 'bold' }}>{suggestion.title}</div>
            <div style={{ fontSize: '10px', color: '#666' }}>
              {Math.round(suggestion.confidence * 100)}% confidence
            </div>
          </div>
          
          <div style={{ fontSize: '11px', color: '#666', marginBottom: '8px' }}>
            {suggestion.description}
          </div>
          
          {suggestion.suggestedCode && (
            <pre style={{
              fontSize: '10px',
              background: '#f0f0f0',
              padding: '8px',
              borderRadius: '4px',
              marginBottom: '8px',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}>
              {suggestion.suggestedCode}
            </pre>
          )}
          
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => {
                // Accept suggestion
                setSuggestions(prev => prev.map(s => 
                  s.id === suggestion.id ? { ...s, status: 'accepted' } : s
                ));
              }}
              style={{
                padding: '4px 8px',
                background: '#4caf50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '10px'
              }}
            >
              Accept
            </button>
            
            <button
              onClick={() => {
                // Reject suggestion
                setSuggestions(prev => prev.map(s => 
                  s.id === suggestion.id ? { ...s, status: 'rejected' } : s
                ));
              }}
              style={{
                padding: '4px 8px',
                background: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '10px'
              }}
            >
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="collaboration-hub" style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: '#f5f5f5'
    }}>
      {/* Header */}
      <div className="collaboration-header" style={{
        background: 'white',
        padding: '12px 16px',
        borderBottom: '1px solid #ddd',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h2 style={{ margin: 0, fontSize: '16px' }}>Collaboration Hub</h2>
          
          <div style={{
            padding: '4px 8px',
            background: isConnected ? '#4caf50' : '#f44336',
            color: 'white',
            borderRadius: '4px',
            fontSize: '10px'
          }}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={toggleVoice}
            style={{
              padding: '8px',
              background: isVoiceEnabled ? '#4caf50' : '#9e9e9e',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
            title="Toggle Voice"
          >
            Mic
          </button>
          
          <button
            onClick={toggleVideo}
            style={{
              padding: '8px',
              background: isVideoEnabled ? '#4caf50' : '#9e9e9e',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
            title="Toggle Video"
          >
            Video
          </button>
          
          <button
            onClick={toggleScreenShare}
            style={{
              padding: '8px',
              background: isScreenSharing ? '#4caf50' : '#9e9e9e',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
            title="Toggle Screen Share"
          >
            Screen
          </button>
          
          <button
            onClick={toggleAIAssistant}
            style={{
              padding: '8px',
              background: aiAssistantActive ? '#2196f3' : '#9e9e9e',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
            title="Toggle AI Assistant"
          >
            AI
          </button>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="collaboration-content" style={{
        flex: 1,
        display: 'flex',
        overflow: 'hidden'
      }}>
        {/* Left Panel */}
        <div className="collaboration-left-panel" style={{
          width: '300px',
          padding: '16px',
          overflowY: 'auto',
          borderRight: '1px solid #ddd'
        }}>
          {showParticipants && renderParticipants()}
          
          {/* Video Grid */}
          {isVideoEnabled && (
            <div className="video-grid" style={{
              background: 'white',
              border: '1px solid #ddd',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '16px'
            }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 'bold' }}>
                Video Chat
              </h3>
              
              {/* Local Video */}
              <video
                ref={localVideoRef}
                autoPlay
                muted
                style={{
                  width: '100%',
                  height: '120px',
                  background: '#000',
                  borderRadius: '4px',
                  marginBottom: '8px'
                }}
              />
              
              {/* Remote Videos */}
              {participants
                .filter(p => p.id !== currentUser.id)
                .map(participant => (
                  <video
                    key={participant.id}
                    ref={el => {
                      if (el) remoteVideosRef.current[participant.id] = el;
                    }}
                    autoPlay
                    style={{
                      width: '100%',
                      height: '120px',
                      background: '#000',
                      borderRadius: '4px',
                      marginBottom: '8px'
                    }}
                  />
                ))
              }
            </div>
          )}
          
          {showChat && renderChat()}
        </div>
        
        {/* Right Panel */}
        <div className="collaboration-right-panel" style={{
          width: '300px',
          padding: '16px',
          overflowY: 'auto',
          borderLeft: '1px solid #ddd'
        }}>
          {/* Panel Tabs */}
          <div className="panel-tabs" style={{
            display: 'flex',
            marginBottom: '16px',
            borderBottom: '1px solid #ddd'
          }}>
            <button
              onClick={() => setShowChat(true)}
              style={{
                flex: 1,
                padding: '8px',
                background: showChat ? '#2196f3' : 'transparent',
                color: showChat ? 'white' : '#666',
                border: 'none',
                borderBottom: showChat ? '2px solid #2196f3' : '2px solid transparent',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Chat
            </button>
            
            <button
              onClick={() => setShowSuggestions(!showSuggestions)}
              style={{
                flex: 1,
                padding: '8px',
                background: showSuggestions ? '#2196f3' : 'transparent',
                color: showSuggestions ? 'white' : '#666',
                border: 'none',
                borderBottom: showSuggestions ? '2px solid #2196f3' : '2px solid transparent',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              AI Suggestions
            </button>
          </div>
          
          {showChat && renderChat()}
          {showSuggestions && renderSuggestions()}
        </div>
      </div>
    </div>
  );
};

export default AdvancedCollaborationHub;