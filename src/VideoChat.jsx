import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

const VideoChat = () => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [connectedUser, setConnectedUser] = useState(null);
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const peerConnection = useRef();

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
      setLocalStream(stream);
      localVideoRef.current.srcObject = stream;
    });

    socket.on('match_found', async (userId) => {
      setConnectedUser(userId);

      if (!peerConnection.current) {
        createPeerConnection();
      }

      if (userId === socket.id) return;

      const offer = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offer);
      socket.emit('offer', { offer, to: userId });
    });

    socket.on('offer', async ({ offer, from }) => {
      setConnectedUser(from);

      if (!peerConnection.current) {
        createPeerConnection();
      }

      await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);
      socket.emit('answer', { answer, to: from });
    });

    socket.on('answer', async ({ answer }) => {
      await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
    });

    socket.on('candidate', async ({ candidate }) => {
      if (peerConnection.current) {
        await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });
  }, []);

  const createPeerConnection = () => {
    const iceServers = [
        { urls: 'stun:stun.l.google.com:19302' },
      ];
      
    peerConnection.current = new RTCPeerConnection(iceServers);

    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate && connectedUser) {
        socket.emit('candidate', { candidate: event.candidate, to: connectedUser });
      }
    };

    peerConnection.current.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
      remoteVideoRef.current.srcObject = event.streams[0];
    };

    localStream.getTracks().forEach((track) => {
      peerConnection.current.addTrack(track, localStream);
    });
  };

  const findMatch = () => {
    socket.emit('find_match');
  };

  return (
    <div>
      <video ref={localVideoRef} autoPlay muted />
      <video ref={remoteVideoRef} autoPlay />
      <button onClick={findMatch}>Next</button>
    </div>
  );
};

export default VideoChat;
