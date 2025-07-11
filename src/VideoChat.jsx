import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import './VideoChat.css';

const socket = io('http://localhost:5000');

const VideoChat = () => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');
  const [password, setPassword] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [isSearching, setIsSearching] = useState(false);
  const [currentCall, setCurrentCall] = useState(null);
  const [error, setError] = useState('');
  const [fakeUsers] = useState([
    { id: 1, name: 'User 1' },
    { id: 2, name: 'User 2' },
    { id: 3, name: 'User 3' },
    { id: 4, name: 'User 4' },
    { id: 5, name: 'User 5' },
  ]);

  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const peerConnection = useRef();
  const currentPartner = useRef();

  useEffect(() => {
    if (loggedIn) {
      initializeMedia();
      setupSocketListeners();
    }

    return () => {
      cleanupCall();
    };
  }, [loggedIn]);

  const initializeMedia = async () => {
    try {
      setConnectionStatus('connecting');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 }, 
        audio: true 
      });
      
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      setConnectionStatus('ready');
      setError('');
    } catch (err) {
      console.error('Failed to get local stream:', err);
      setError('Camera/microphone access denied. Please allow permissions and refresh.');
      setConnectionStatus('error');
    }
  };

  const setupSocketListeners = () => {
    socket.on('match_found', handleMatchFound);
    socket.on('waiting_for_match', () => {
      setConnectionStatus('searching');
    });
    socket.on('offer', handleOffer);
    socket.on('answer', handleAnswer);
    socket.on('candidate', handleCandidate);
    socket.on('call_ended', handleCallEnded);
    socket.on('error', (error) => {
      setError(error.message);
      setIsSearching(false);
    });
  };

  const handleMatchFound = async ({ user, role }) => {
    console.log('Match found:', user, 'Role:', role);
    setIsSearching(false);
    setConnectionStatus('connecting');
    currentPartner.current = user;
    setCurrentCall(user);

    if (!peerConnection.current) {
      await createPeerConnection();
    }

    if (role === 'caller') {
      // Create and send offer
      try {
        const offer = await peerConnection.current.createOffer();
        await peerConnection.current.setLocalDescription(offer);
        socket.emit('offer', { offer, to: user.id });
      } catch (err) {
        console.error('Error creating offer:', err);
        setError('Failed to start call');
      }
    }
  };

  const createPeerConnection = async () => {
    const config = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    };

    peerConnection.current = new RTCPeerConnection(config);

    // Add local stream tracks to peer connection
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        peerConnection.current.addTrack(track, localStream);
      });
    }

    // Handle remote stream
    peerConnection.current.ontrack = (event) => {
      console.log('Received remote stream');
      const remoteStream = event.streams[0];
      setRemoteStream(remoteStream);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
      setConnectionStatus('connected');
    };

    // Handle ICE candidates
    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate && currentPartner.current) {
        socket.emit('candidate', { 
          candidate: event.candidate, 
          to: currentPartner.current.id 
        });
      }
    };

    // Handle connection state changes
    peerConnection.current.onconnectionstatechange = () => {
      const state = peerConnection.current.connectionState;
      console.log('Connection state:', state);
      
      if (state === 'connected') {
        setConnectionStatus('connected');
      } else if (state === 'disconnected' || state === 'failed') {
        setConnectionStatus('disconnected');
        handleCallEnded();
      }
    };
  };

  const handleOffer = async ({ offer, from }) => {
    console.log('Received offer from:', from);
    
    if (!peerConnection.current) {
      await createPeerConnection();
    }

    try {
      await peerConnection.current.setRemoteDescription(offer);
      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);
      socket.emit('answer', { answer, to: from });
    } catch (err) {
      console.error('Error handling offer:', err);
      setError('Failed to answer call');
    }
  };

  const handleAnswer = async ({ answer }) => {
    console.log('Received answer');
    try {
      await peerConnection.current.setRemoteDescription(answer);
    } catch (err) {
      console.error('Error handling answer:', err);
    }
  };

  const handleCandidate = async ({ candidate }) => {
    console.log('Received ICE candidate');
    try {
      if (peerConnection.current) {
        await peerConnection.current.addIceCandidate(candidate);
      }
    } catch (err) {
      console.error('Error adding ICE candidate:', err);
    }
  };

  const handleCallEnded = () => {
    console.log('Call ended');
    cleanupCall();
    setConnectionStatus('ready');
    setCurrentCall(null);
    currentPartner.current = null;
  };

  const cleanupCall = () => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    setRemoteStream(null);
    
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
  };

  const handleLogin = () => {
    if (!selectedUser || !password) {
      setError('Please select a user and enter the password.');
      return;
    }

    socket.emit('login', 
      { userId: parseInt(selectedUser), password },
      (response) => {
        if (response.success) {
          setLoggedIn(true);
          setError('');
        } else {
          setError(response.message);
        }
      }
    );
  };

  const findMatch = () => {
    if (isSearching) return;
    
    setIsSearching(true);
    setConnectionStatus('searching');
    setError('');
    socket.emit('find_match');
  };

  const endCall = () => {
    if (currentPartner.current) {
      socket.emit('end_call', { to: currentPartner.current.id });
    }
    handleCallEnded();
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connecting': return 'Setting up camera...';
      case 'ready': return 'Ready to connect';
      case 'searching': return 'Looking for someone to chat with...';
      case 'connected': return `Connected with ${currentCall?.name || 'someone'}`;
      case 'error': return 'Connection error';
      default: return 'Disconnected';
    }
  };

  if (!loggedIn) {
    return (
      <div className="login-container">
        <div className="login-form">
          <h2>Video Chat Login</h2>
          <div className="form-group">
            <select 
              value={selectedUser} 
              onChange={(e) => setSelectedUser(e.target.value)}
              className="user-select"
            >
              <option value="">Select a user</option>
              {fakeUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <input
              type="password"
              placeholder="Enter password (pass1, pass2, etc.)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="password-input"
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
            />
          </div>
          <button onClick={handleLogin} className="login-btn">
            Login
          </button>
          {error && <div className="error-message">{error}</div>}
          <div className="login-help">
            <p>Use passwords: pass1, pass2, pass3, pass4, pass5</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="video-chat-container">
      <div className="header">
        <h2>Video Chat</h2>
        <div className={`status ${connectionStatus}`}>
          {getStatusText()}
        </div>
      </div>

      <div className="video-container">
        <div className="video-wrapper">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="local-video"
          />
          <div className="video-label">You</div>
        </div>
        
        <div className="video-wrapper">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="remote-video"
          />
          <div className="video-label">
            {currentCall ? currentCall.name : 'Waiting...'}
          </div>
        </div>
      </div>

      <div className="controls">
        {!currentCall ? (
          <button 
            onClick={findMatch} 
            disabled={isSearching || connectionStatus !== 'ready'}
            className="find-btn"
          >
            {isSearching ? 'Searching...' : 'Find Someone to Chat'}
          </button>
        ) : (
          <button onClick={endCall} className="end-btn">
            End Call
          </button>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default VideoChat;
