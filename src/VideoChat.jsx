import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

const VideoChat = () => {
  const [localStream, setLocalStream] = useState(null); // Mahalliy oqim
  const [remoteStream, setRemoteStream] = useState(null); // Remote oqim
  const [loggedIn, setLoggedIn] = useState(false); // Login holati
  const [selectedUser, setSelectedUser] = useState(null); // Tanlangan foydalanuvchi ID
  const [password, setPassword] = useState(''); // Parol
  const [fakeUsers, setFakeUsers] = useState([
    { id: 1, name: 'User 1' },
    { id: 2, name: 'User 2' },
    { id: 3, name: 'User 3' },
    { id: 4, name: 'User 4' },
    { id: 5, name: 'User 5' },
  ]);

  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const peerConnection = useRef();

  useEffect(() => {
    if (loggedIn) {
      // Mahalliy kamerani ishga tushirish
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then((stream) => {
          setLocalStream(stream);
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream; // Mahalliy video oqimini o'rnatish
          }
        })
        .catch((err) => {
          console.error('Failed to get local stream:', err);
          alert('Kamera yoki mikrofonni olishda xatolik yuz berdi. Iltimos, ruxsat bering.');
        });

      // Tasodifiy foydalanuvchi topilganda
      socket.on('match_found', async (user) => {
        alert(`Matched with ${user.name}`);
        if (!peerConnection.current) createPeerConnection(); // PeerConnection yaratish

        // Local ulanishni boshlash
        const offer = await peerConnection.current.createOffer();
        await peerConnection.current.setLocalDescription(offer);
        socket.emit('offer', { offer, to: user.id });
      });

      // Taklif qabul qilinganda
      socket.on('offer', async ({ offer, from }) => {
        if (!peerConnection.current) createPeerConnection();

        await peerConnection.current.setRemoteDescription(offer);
        const answer = await peerConnection.current.createAnswer();
        await peerConnection.current.setLocalDescription(answer);
        socket.emit('answer', { answer, to: from });
      });

      // Javob qabul qilinganda
      socket.on('answer', async ({ answer }) => {
        await peerConnection.current.setRemoteDescription(answer);
      });

      // ICE kandidatlari qabul qilinganda
      socket.on('candidate', async ({ candidate }) => {
        if (peerConnection.current) {
          await peerConnection.current.addIceCandidate(candidate);
        }
      });
    }
  }, [loggedIn]);

  // PeerConnection yaratish funksiyasi
  const createPeerConnection = () => {
    const iceServers = [
      { urls: 'stun:stun.l.google.com:19302' }, // STUN server
    ];

    peerConnection.current = new RTCPeerConnection({ iceServers });

    // ICE kandidatlarni sozlash
    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate && selectedUser) {
        socket.emit('candidate', { candidate: event.candidate, to: selectedUser });
      }
    };

    // Remote video oqimini sozlash
    peerConnection.current.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    // Mahalliy oqimni PeerConnection ga qo'shish
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        peerConnection.current.addTrack(track, localStream);
      });
    } else {
      console.error('Local stream is not available.');
    }
  };

  // Login funksiyasi
  const handleLogin = () => {
    if (selectedUser && password) {
      socket.emit(
        'login',
        { userId: selectedUser, password },
        (response) => {
          if (response.success) {
            setLoggedIn(true);
          } else {
            alert(response.message);
          }
        }
      );
    } else {
      alert('Please select a user and enter the password.');
    }
  };

  // Next funksiyasi (yangi foydalanuvchini ulash)
  const findMatch = () => {
    socket.emit('find_match');
  };

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      {!loggedIn ? (
        <div>
          <h2>Login</h2>
          <select onChange={(e) => setSelectedUser(Number(e.target.value))} defaultValue="">
            <option value="" disabled>
              Select a user
            </option>
            {fakeUsers.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ marginLeft: '10px' }}
          />
          <button onClick={handleLogin} style={{ marginLeft: '10px' }}>
            Login
          </button>
        </div>
      ) : (
        <div>
          <h2>Video Chat</h2>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              style={{ width: '300px', height: '200px', background: 'black', border: '2px solid #ccc' }}
            />
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              style={{ width: '300px', height: '200px', background: 'black', border: '2px solid #ccc' }}
            />
          </div>
          <button onClick={findMatch} style={{ marginTop: '20px', padding: '10px 20px', fontSize: '16px' }}>
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default VideoChat;
