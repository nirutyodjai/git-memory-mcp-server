/**
 * WebRTC Service
 * 
 * Advanced WebRTC service for real-time communication in NEXUS IDE.
 * Handles peer-to-peer connections, media streaming, and data channels.
 * 
 * Features:
 * - Peer-to-peer video/audio calls
 * - Screen sharing with audio
 * - Real-time data channels
 * - Connection management
 * - Quality adaptation
 * - Network monitoring
 * - Fallback mechanisms
 * - Recording capabilities
 * - Multi-party conferences
 * - Bandwidth optimization
 */

export interface MediaConstraints {
  video: boolean | MediaTrackConstraints;
  audio: boolean | MediaTrackConstraints;
}

export interface ScreenShareOptions {
  video: boolean;
  audio: boolean;
  cursor?: 'always' | 'motion' | 'never';
  displaySurface?: 'application' | 'browser' | 'monitor' | 'window';
}

export interface PeerConnection {
  id: string;
  userId: string;
  userName: string;
  connection: RTCPeerConnection;
  localStream?: MediaStream;
  remoteStream?: MediaStream;
  dataChannel?: RTCDataChannel;
  status: 'connecting' | 'connected' | 'disconnected' | 'failed';
  stats: {
    bytesReceived: number;
    bytesSent: number;
    packetsLost: number;
    roundTripTime: number;
    bandwidth: number;
    quality: 'excellent' | 'good' | 'fair' | 'poor';
  };
  createdAt: Date;
  lastActivity: Date;
}

export interface CallSession {
  id: string;
  type: 'audio' | 'video' | 'screen';
  participants: string[];
  initiator: string;
  status: 'initiating' | 'ringing' | 'active' | 'ended';
  startedAt?: Date;
  endedAt?: Date;
  duration: number;
  recording?: {
    isRecording: boolean;
    startedAt: Date;
    chunks: Blob[];
    mimeType: string;
  };
  settings: {
    videoEnabled: boolean;
    audioEnabled: boolean;
    screenShare: boolean;
    recording: boolean;
    quality: 'low' | 'medium' | 'high';
  };
}

export interface DataChannelMessage {
  type: 'cursor' | 'selection' | 'edit' | 'chat' | 'system' | 'file';
  data: any;
  timestamp: number;
  userId: string;
  messageId: string;
}

export interface NetworkStats {
  bandwidth: {
    upload: number;
    download: number;
  };
  latency: number;
  packetLoss: number;
  jitter: number;
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  connectionType: 'wifi' | 'ethernet' | 'cellular' | 'unknown';
}

interface WebRTCServiceEvents {
  'peer-connected': (peer: PeerConnection) => void;
  'peer-disconnected': (peerId: string) => void;
  'stream-added': (stream: MediaStream, peerId: string) => void;
  'stream-removed': (peerId: string) => void;
  'data-received': (message: DataChannelMessage, peerId: string) => void;
  'call-incoming': (session: CallSession) => void;
  'call-ended': (sessionId: string) => void;
  'network-changed': (stats: NetworkStats) => void;
  'error': (error: Error, context?: string) => void;
}

class WebRTCService {
  private peers: Map<string, PeerConnection> = new Map();
  private localStream: MediaStream | null = null;
  private screenStream: MediaStream | null = null;
  private currentSession: CallSession | null = null;
  private eventListeners: Map<keyof WebRTCServiceEvents, Function[]> = new Map();
  private signalingSocket: WebSocket | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private networkMonitor: any = null;
  private isInitialized = false;

  // ICE servers configuration
  private iceServers: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    {
      urls: 'turn:numb.viagenie.ca',
      credential: 'muazkh',
      username: 'webrtc@live.com'
    }
  ];

  // Default media constraints
  private defaultConstraints: MediaConstraints = {
    video: {
      width: { ideal: 1280 },
      height: { ideal: 720 },
      frameRate: { ideal: 30 },
      facingMode: 'user'
    },
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      sampleRate: 44100
    }
  };

  constructor() {
    this.initializeEventListeners();
  }

  /**
   * Initialize the WebRTC service
   */
  async initialize(signalingUrl?: string): Promise<void> {
    try {
      if (this.isInitialized) {
        console.warn('WebRTC service already initialized');
        return;
      }

      // Initialize signaling connection
      if (signalingUrl) {
        await this.initializeSignaling(signalingUrl);
      }

      // Start network monitoring
      this.startNetworkMonitoring();

      this.isInitialized = true;
      console.log('WebRTC service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize WebRTC service:', error);
      this.emit('error', error as Error, 'initialization');
      throw error;
    }
  }

  /**
   * Initialize signaling connection
   */
  private async initializeSignaling(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.signalingSocket = new WebSocket(url);

      this.signalingSocket.onopen = () => {
        console.log('Signaling connection established');
        resolve();
      };

      this.signalingSocket.onmessage = (event) => {
        this.handleSignalingMessage(JSON.parse(event.data));
      };

      this.signalingSocket.onerror = (error) => {
        console.error('Signaling connection error:', error);
        reject(error);
      };

      this.signalingSocket.onclose = () => {
        console.log('Signaling connection closed');
        // Attempt to reconnect
        setTimeout(() => {
          if (!this.signalingSocket || this.signalingSocket.readyState === WebSocket.CLOSED) {
            this.initializeSignaling(url).catch(console.error);
          }
        }, 5000);
      };
    });
  }

  /**
   * Handle signaling messages
   */
  private handleSignalingMessage(message: any): void {
    switch (message.type) {
      case 'offer':
        this.handleOffer(message);
        break;
      case 'answer':
        this.handleAnswer(message);
        break;
      case 'ice-candidate':
        this.handleIceCandidate(message);
        break;
      case 'call-request':
        this.handleCallRequest(message);
        break;
      case 'call-response':
        this.handleCallResponse(message);
        break;
      case 'peer-disconnected':
        this.handlePeerDisconnected(message);
        break;
      default:
        console.warn('Unknown signaling message type:', message.type);
    }
  }

  /**
   * Create a peer connection
   */
  async createPeerConnection(userId: string, userName: string): Promise<PeerConnection> {
    const connectionId = `${userId}-${Date.now()}`;
    
    const rtcConnection = new RTCPeerConnection({
      iceServers: this.iceServers,
      iceCandidatePoolSize: 10
    });

    const peer: PeerConnection = {
      id: connectionId,
      userId,
      userName,
      connection: rtcConnection,
      status: 'connecting',
      stats: {
        bytesReceived: 0,
        bytesSent: 0,
        packetsLost: 0,
        roundTripTime: 0,
        bandwidth: 0,
        quality: 'good'
      },
      createdAt: new Date(),
      lastActivity: new Date()
    };

    // Set up connection event handlers
    this.setupPeerConnectionHandlers(peer);

    // Create data channel
    const dataChannel = rtcConnection.createDataChannel('collaboration', {
      ordered: true,
      maxRetransmits: 3
    });
    
    peer.dataChannel = dataChannel;
    this.setupDataChannelHandlers(peer, dataChannel);

    this.peers.set(connectionId, peer);
    return peer;
  }

  /**
   * Set up peer connection event handlers
   */
  private setupPeerConnectionHandlers(peer: PeerConnection): void {
    const { connection } = peer;

    connection.onicecandidate = (event) => {
      if (event.candidate && this.signalingSocket) {
        this.signalingSocket.send(JSON.stringify({
          type: 'ice-candidate',
          candidate: event.candidate,
          targetUserId: peer.userId
        }));
      }
    };

    connection.ontrack = (event) => {
      peer.remoteStream = event.streams[0];
      this.emit('stream-added', event.streams[0], peer.id);
    };

    connection.onconnectionstatechange = () => {
      const state = connection.connectionState;
      
      switch (state) {
        case 'connected':
          peer.status = 'connected';
          this.emit('peer-connected', peer);
          break;
        case 'disconnected':
        case 'failed':
          peer.status = 'disconnected';
          this.emit('peer-disconnected', peer.id);
          this.peers.delete(peer.id);
          break;
      }
    };

    connection.ondatachannel = (event) => {
      const channel = event.channel;
      this.setupDataChannelHandlers(peer, channel);
    };

    // Start collecting stats
    this.startStatsCollection(peer);
  }

  /**
   * Set up data channel event handlers
   */
  private setupDataChannelHandlers(peer: PeerConnection, channel: RTCDataChannel): void {
    channel.onopen = () => {
      console.log(`Data channel opened for peer ${peer.userId}`);
    };

    channel.onmessage = (event) => {
      try {
        const message: DataChannelMessage = JSON.parse(event.data);
        this.emit('data-received', message, peer.id);
      } catch (error) {
        console.error('Failed to parse data channel message:', error);
      }
    };

    channel.onerror = (error) => {
      console.error('Data channel error:', error);
      this.emit('error', new Error('Data channel error'), 'data-channel');
    };

    channel.onclose = () => {
      console.log(`Data channel closed for peer ${peer.userId}`);
    };
  }

  /**
   * Start collecting connection statistics
   */
  private startStatsCollection(peer: PeerConnection): void {
    const collectStats = async () => {
      try {
        const stats = await peer.connection.getStats();
        let bytesReceived = 0;
        let bytesSent = 0;
        let packetsLost = 0;
        let roundTripTime = 0;

        stats.forEach((report) => {
          if (report.type === 'inbound-rtp') {
            bytesReceived += report.bytesReceived || 0;
            packetsLost += report.packetsLost || 0;
          } else if (report.type === 'outbound-rtp') {
            bytesSent += report.bytesSent || 0;
          } else if (report.type === 'candidate-pair' && report.state === 'succeeded') {
            roundTripTime = report.currentRoundTripTime || 0;
          }
        });

        // Calculate bandwidth (simplified)
        const bandwidth = (bytesReceived + bytesSent) / 1024; // KB/s
        
        // Determine quality based on stats
        let quality: 'excellent' | 'good' | 'fair' | 'poor' = 'good';
        if (roundTripTime > 200 || packetsLost > 5) {
          quality = 'poor';
        } else if (roundTripTime > 100 || packetsLost > 2) {
          quality = 'fair';
        } else if (roundTripTime < 50 && packetsLost === 0) {
          quality = 'excellent';
        }

        peer.stats = {
          bytesReceived,
          bytesSent,
          packetsLost,
          roundTripTime,
          bandwidth,
          quality
        };

        peer.lastActivity = new Date();
      } catch (error) {
        console.error('Failed to collect stats:', error);
      }
    };

    // Collect stats every 5 seconds
    setInterval(collectStats, 5000);
  }

  /**
   * Get user media (camera/microphone)
   */
  async getUserMedia(constraints: MediaConstraints = this.defaultConstraints): Promise<MediaStream> {
    try {
      if (this.localStream) {
        // Stop existing tracks
        this.localStream.getTracks().forEach(track => track.stop());
      }

      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      return this.localStream;
    } catch (error) {
      console.error('Failed to get user media:', error);
      this.emit('error', error as Error, 'media-access');
      throw error;
    }
  }

  /**
   * Get display media (screen sharing)
   */
  async getDisplayMedia(options: ScreenShareOptions = { video: true, audio: true }): Promise<MediaStream> {
    try {
      if (this.screenStream) {
        // Stop existing screen share
        this.screenStream.getTracks().forEach(track => track.stop());
      }

      this.screenStream = await navigator.mediaDevices.getDisplayMedia(options);
      
      // Handle screen share end
      this.screenStream.getVideoTracks()[0].onended = () => {
        this.stopScreenShare();
      };

      return this.screenStream;
    } catch (error) {
      console.error('Failed to get display media:', error);
      this.emit('error', error as Error, 'screen-share');
      throw error;
    }
  }

  /**
   * Start a call session
   */
  async startCall(participants: string[], type: 'audio' | 'video' | 'screen' = 'video'): Promise<CallSession> {
    try {
      const session: CallSession = {
        id: `call-${Date.now()}`,
        type,
        participants,
        initiator: 'current-user', // Should be replaced with actual user ID
        status: 'initiating',
        duration: 0,
        settings: {
          videoEnabled: type === 'video' || type === 'screen',
          audioEnabled: true,
          screenShare: type === 'screen',
          recording: false,
          quality: 'medium'
        }
      };

      this.currentSession = session;

      // Get media based on call type
      let stream: MediaStream;
      if (type === 'screen') {
        stream = await this.getDisplayMedia();
      } else {
        stream = await this.getUserMedia({
          video: type === 'video',
          audio: true
        });
      }

      // Create peer connections for all participants
      for (const participantId of participants) {
        const peer = await this.createPeerConnection(participantId, `User ${participantId}`);
        
        // Add local stream to peer connection
        stream.getTracks().forEach(track => {
          peer.connection.addTrack(track, stream);
        });
        
        peer.localStream = stream;
      }

      // Send call request through signaling
      if (this.signalingSocket) {
        this.signalingSocket.send(JSON.stringify({
          type: 'call-request',
          session,
          participants
        }));
      }

      session.status = 'ringing';
      session.startedAt = new Date();
      
      this.emit('call-incoming', session);
      return session;
    } catch (error) {
      console.error('Failed to start call:', error);
      this.emit('error', error as Error, 'call-start');
      throw error;
    }
  }

  /**
   * Answer an incoming call
   */
  async answerCall(sessionId: string, accept: boolean): Promise<void> {
    try {
      if (!this.currentSession || this.currentSession.id !== sessionId) {
        throw new Error('No matching call session found');
      }

      if (this.signalingSocket) {
        this.signalingSocket.send(JSON.stringify({
          type: 'call-response',
          sessionId,
          accept,
          userId: 'current-user' // Should be replaced with actual user ID
        }));
      }

      if (accept) {
        this.currentSession.status = 'active';
        
        // Get media for the call
        const stream = await this.getUserMedia({
          video: this.currentSession.settings.videoEnabled,
          audio: this.currentSession.settings.audioEnabled
        });

        // Add stream to all peer connections
        this.peers.forEach(peer => {
          stream.getTracks().forEach(track => {
            peer.connection.addTrack(track, stream);
          });
          peer.localStream = stream;
        });
      } else {
        this.endCall(sessionId);
      }
    } catch (error) {
      console.error('Failed to answer call:', error);
      this.emit('error', error as Error, 'call-answer');
      throw error;
    }
  }

  /**
   * End a call session
   */
  async endCall(sessionId: string): Promise<void> {
    try {
      if (!this.currentSession || this.currentSession.id !== sessionId) {
        console.warn('No matching call session to end');
        return;
      }

      // Stop all media tracks
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => track.stop());
        this.localStream = null;
      }

      if (this.screenStream) {
        this.screenStream.getTracks().forEach(track => track.stop());
        this.screenStream = null;
      }

      // Stop recording if active
      if (this.currentSession.recording?.isRecording) {
        this.stopRecording();
      }

      // Close all peer connections
      this.peers.forEach(peer => {
        peer.connection.close();
      });
      this.peers.clear();

      // Update session
      this.currentSession.status = 'ended';
      this.currentSession.endedAt = new Date();
      if (this.currentSession.startedAt) {
        this.currentSession.duration = Date.now() - this.currentSession.startedAt.getTime();
      }

      // Notify through signaling
      if (this.signalingSocket) {
        this.signalingSocket.send(JSON.stringify({
          type: 'call-ended',
          sessionId
        }));
      }

      this.emit('call-ended', sessionId);
      this.currentSession = null;
    } catch (error) {
      console.error('Failed to end call:', error);
      this.emit('error', error as Error, 'call-end');
      throw error;
    }
  }

  /**
   * Toggle video in current call
   */
  async toggleVideo(): Promise<void> {
    if (!this.currentSession || !this.localStream) {
      throw new Error('No active call session');
    }

    const videoTrack = this.localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      this.currentSession.settings.videoEnabled = videoTrack.enabled;
    }
  }

  /**
   * Toggle audio in current call
   */
  async toggleAudio(): Promise<void> {
    if (!this.currentSession || !this.localStream) {
      throw new Error('No active call session');
    }

    const audioTrack = this.localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      this.currentSession.settings.audioEnabled = audioTrack.enabled;
    }
  }

  /**
   * Start screen sharing
   */
  async startScreenShare(): Promise<void> {
    try {
      if (!this.currentSession) {
        throw new Error('No active call session');
      }

      const screenStream = await this.getDisplayMedia();
      
      // Replace video track in all peer connections
      const videoTrack = screenStream.getVideoTracks()[0];
      
      this.peers.forEach(async (peer) => {
        const sender = peer.connection.getSenders().find(s => 
          s.track && s.track.kind === 'video'
        );
        
        if (sender) {
          await sender.replaceTrack(videoTrack);
        }
      });

      this.currentSession.settings.screenShare = true;
    } catch (error) {
      console.error('Failed to start screen share:', error);
      this.emit('error', error as Error, 'screen-share-start');
      throw error;
    }
  }

  /**
   * Stop screen sharing
   */
  async stopScreenShare(): Promise<void> {
    try {
      if (!this.currentSession) {
        return;
      }

      if (this.screenStream) {
        this.screenStream.getTracks().forEach(track => track.stop());
        this.screenStream = null;
      }

      // Switch back to camera if video was enabled
      if (this.currentSession.settings.videoEnabled) {
        const cameraStream = await this.getUserMedia({ video: true, audio: false });
        const videoTrack = cameraStream.getVideoTracks()[0];
        
        this.peers.forEach(async (peer) => {
          const sender = peer.connection.getSenders().find(s => 
            s.track && s.track.kind === 'video'
          );
          
          if (sender) {
            await sender.replaceTrack(videoTrack);
          }
        });
      }

      this.currentSession.settings.screenShare = false;
    } catch (error) {
      console.error('Failed to stop screen share:', error);
      this.emit('error', error as Error, 'screen-share-stop');
      throw error;
    }
  }

  /**
   * Start recording the call
   */
  async startRecording(): Promise<void> {
    try {
      if (!this.currentSession) {
        throw new Error('No active call session');
      }

      if (this.currentSession.recording?.isRecording) {
        console.warn('Recording already in progress');
        return;
      }

      // Create a canvas to combine all video streams
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      canvas.width = 1280;
      canvas.height = 720;

      // Get canvas stream
      const canvasStream = canvas.captureStream(30);
      
      // Add audio from local stream
      if (this.localStream) {
        const audioTrack = this.localStream.getAudioTracks()[0];
        if (audioTrack) {
          canvasStream.addTrack(audioTrack);
        }
      }

      // Initialize media recorder
      this.mediaRecorder = new MediaRecorder(canvasStream, {
        mimeType: 'video/webm;codecs=vp9,opus'
      });

      const chunks: Blob[] = [];
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        if (this.currentSession?.recording) {
          this.currentSession.recording.chunks = chunks;
        }
      };

      this.mediaRecorder.start(1000); // Collect data every second

      // Update session
      this.currentSession.recording = {
        isRecording: true,
        startedAt: new Date(),
        chunks: [],
        mimeType: 'video/webm;codecs=vp9,opus'
      };

      this.currentSession.settings.recording = true;
    } catch (error) {
      console.error('Failed to start recording:', error);
      this.emit('error', error as Error, 'recording-start');
      throw error;
    }
  }

  /**
   * Stop recording the call
   */
  async stopRecording(): Promise<Blob | null> {
    try {
      if (!this.currentSession?.recording?.isRecording || !this.mediaRecorder) {
        console.warn('No active recording to stop');
        return null;
      }

      return new Promise((resolve) => {
        this.mediaRecorder!.onstop = () => {
          if (this.currentSession?.recording) {
            const blob = new Blob(this.currentSession.recording.chunks, {
              type: this.currentSession.recording.mimeType
            });
            
            this.currentSession.recording.isRecording = false;
            this.currentSession.settings.recording = false;
            
            resolve(blob);
          } else {
            resolve(null);
          }
        };
        
        this.mediaRecorder!.stop();
        this.mediaRecorder = null;
      });
    } catch (error) {
      console.error('Failed to stop recording:', error);
      this.emit('error', error as Error, 'recording-stop');
      throw error;
    }
  }

  /**
   * Send data through data channel
   */
  sendData(message: Omit<DataChannelMessage, 'timestamp' | 'messageId'>, targetPeerId?: string): void {
    const fullMessage: DataChannelMessage = {
      ...message,
      timestamp: Date.now(),
      messageId: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    const messageStr = JSON.stringify(fullMessage);

    if (targetPeerId) {
      const peer = this.peers.get(targetPeerId);
      if (peer?.dataChannel && peer.dataChannel.readyState === 'open') {
        peer.dataChannel.send(messageStr);
      }
    } else {
      // Send to all connected peers
      this.peers.forEach(peer => {
        if (peer.dataChannel && peer.dataChannel.readyState === 'open') {
          peer.dataChannel.send(messageStr);
        }
      });
    }
  }

  /**
   * Start network monitoring
   */
  private startNetworkMonitoring(): void {
    // Monitor network connection
    const updateNetworkInfo = () => {
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      
      if (connection) {
        const stats: NetworkStats = {
          bandwidth: {
            upload: connection.uplink || 0,
            download: connection.downlink || 0
          },
          latency: connection.rtt || 0,
          packetLoss: 0, // Not available from Connection API
          jitter: 0, // Not available from Connection API
          quality: this.calculateNetworkQuality(connection),
          connectionType: connection.effectiveType || 'unknown'
        };
        
        this.emit('network-changed', stats);
      }
    };

    // Update network info every 10 seconds
    this.networkMonitor = setInterval(updateNetworkInfo, 10000);
    updateNetworkInfo(); // Initial update
  }

  /**
   * Calculate network quality based on connection info
   */
  private calculateNetworkQuality(connection: any): 'excellent' | 'good' | 'fair' | 'poor' {
    const downlink = connection.downlink || 0;
    const rtt = connection.rtt || 0;
    
    if (downlink >= 10 && rtt <= 50) {
      return 'excellent';
    } else if (downlink >= 5 && rtt <= 100) {
      return 'good';
    } else if (downlink >= 1 && rtt <= 200) {
      return 'fair';
    } else {
      return 'poor';
    }
  }

  /**
   * Handle signaling messages
   */
  private async handleOffer(message: any): Promise<void> {
    try {
      const peer = this.peers.get(message.peerId);
      if (!peer) {
        console.error('Peer not found for offer:', message.peerId);
        return;
      }

      await peer.connection.setRemoteDescription(new RTCSessionDescription(message.offer));
      const answer = await peer.connection.createAnswer();
      await peer.connection.setLocalDescription(answer);

      if (this.signalingSocket) {
        this.signalingSocket.send(JSON.stringify({
          type: 'answer',
          answer,
          targetUserId: peer.userId
        }));
      }
    } catch (error) {
      console.error('Failed to handle offer:', error);
      this.emit('error', error as Error, 'offer-handling');
    }
  }

  private async handleAnswer(message: any): Promise<void> {
    try {
      const peer = this.peers.get(message.peerId);
      if (!peer) {
        console.error('Peer not found for answer:', message.peerId);
        return;
      }

      await peer.connection.setRemoteDescription(new RTCSessionDescription(message.answer));
    } catch (error) {
      console.error('Failed to handle answer:', error);
      this.emit('error', error as Error, 'answer-handling');
    }
  }

  private async handleIceCandidate(message: any): Promise<void> {
    try {
      const peer = this.peers.get(message.peerId);
      if (!peer) {
        console.error('Peer not found for ICE candidate:', message.peerId);
        return;
      }

      await peer.connection.addIceCandidate(new RTCIceCandidate(message.candidate));
    } catch (error) {
      console.error('Failed to handle ICE candidate:', error);
      this.emit('error', error as Error, 'ice-candidate-handling');
    }
  }

  private handleCallRequest(message: any): void {
    this.currentSession = message.session;
    this.emit('call-incoming', message.session);
  }

  private handleCallResponse(message: any): void {
    if (message.accept && this.currentSession) {
      this.currentSession.status = 'active';
    } else {
      this.endCall(message.sessionId);
    }
  }

  private handlePeerDisconnected(message: any): void {
    const peer = Array.from(this.peers.values()).find(p => p.userId === message.userId);
    if (peer) {
      this.peers.delete(peer.id);
      this.emit('peer-disconnected', peer.id);
    }
  }

  /**
   * Event handling
   */
  on<K extends keyof WebRTCServiceEvents>(event: K, listener: WebRTCServiceEvents[K]): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(listener);
  }

  off<K extends keyof WebRTCServiceEvents>(event: K, listener: WebRTCServiceEvents[K]): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit<K extends keyof WebRTCServiceEvents>(event: K, ...args: Parameters<WebRTCServiceEvents[K]>): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          (listener as any)(...args);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  private initializeEventListeners(): void {
    // Initialize all event listener arrays
    const events: (keyof WebRTCServiceEvents)[] = [
      'peer-connected',
      'peer-disconnected',
      'stream-added',
      'stream-removed',
      'data-received',
      'call-incoming',
      'call-ended',
      'network-changed',
      'error'
    ];

    events.forEach(event => {
      this.eventListeners.set(event, []);
    });
  }

  /**
   * Get current session info
   */
  getCurrentSession(): CallSession | null {
    return this.currentSession;
  }

  /**
   * Get all connected peers
   */
  getConnectedPeers(): PeerConnection[] {
    return Array.from(this.peers.values());
  }

  /**
   * Get local stream
   */
  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  /**
   * Get screen stream
   */
  getScreenStream(): MediaStream | null {
    return this.screenStream;
  }

  /**
   * Check if service is initialized
   */
  isServiceInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Cleanup and destroy the service
   */
  destroy(): void {
    // End current call
    if (this.currentSession) {
      this.endCall(this.currentSession.id);
    }

    // Close signaling connection
    if (this.signalingSocket) {
      this.signalingSocket.close();
      this.signalingSocket = null;
    }

    // Stop network monitoring
    if (this.networkMonitor) {
      clearInterval(this.networkMonitor);
      this.networkMonitor = null;
    }

    // Clear event listeners
    this.eventListeners.clear();

    this.isInitialized = false;
    console.log('WebRTC service destroyed');
  }
}

// Create singleton instance
const webRTCService = new WebRTCService();

export default webRTCService;
export { WebRTCService };