# Video Chat Application

A real-time video chat application built with React, Socket.IO, and WebRTC. Users can log in and connect with other users for video calls.

## Features

- **Real-time Video Chat**: Connect with other users through WebRTC
- **User Authentication**: Simple login system with predefined users
- **Modern UI**: Beautiful, responsive design with status indicators
- **Auto-matching**: Automatically find and connect with available users
- **Connection Status**: Visual feedback for connection states
- **Cross-platform**: Works on desktop and mobile browsers

## Technologies Used

- **Frontend**: React 18 + Vite
- **Backend**: Node.js + Express + Socket.IO
- **Real-time Communication**: WebRTC for peer-to-peer video
- **Styling**: Modern CSS with gradients and animations

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- Modern web browser with camera/microphone access
- Two browser windows/tabs for testing (or different devices)

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start both server and client** (recommended):
   ```bash
   npm start
   ```

   Or run them separately:
   
   **Terminal 1 - Start the server**:
   ```bash
   npm run server
   ```
   
   **Terminal 2 - Start the client**:
   ```bash
   npm run dev
   ```

3. **Open the application**:
   - Client runs on: http://localhost:5173
   - Server runs on: http://localhost:5000

### Usage

1. **Login**: Choose a user and enter the corresponding password:
   - User 1: `pass1`
   - User 2: `pass2`
   - User 3: `pass3`
   - User 4: `pass4`
   - User 5: `pass5`

2. **Grant Permissions**: Allow camera and microphone access when prompted

3. **Find Someone**: Click "Find Someone to Chat" to connect with another user

4. **Video Chat**: Once matched, you'll see both video streams

5. **End Call**: Click "End Call" to disconnect and find someone new

### Testing

To test the video chat:

1. Open two browser windows/tabs
2. Log in as different users in each window
3. Click "Find Someone to Chat" in one window
4. The users will be automatically matched for a video call

### Project Structure

```
video-chat/
├── src/
│   ├── WebSocket/
│   │   └── server.js          # Socket.IO server
│   ├── App.jsx                # Main React component
│   ├── App.css                # Global styles
│   ├── VideoChat.jsx          # Video chat component
│   ├── VideoChat.css          # Video chat styles
│   └── main.jsx               # React entry point
├── public/
├── package.json
└── README.md
```

### Available Scripts

- `npm start` - Start both server and client
- `npm run dev` - Start Vite development server
- `npm run server` - Start Socket.IO server only
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Browser Compatibility

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

**Note**: HTTPS is required for camera/microphone access in production.

### Troubleshooting

1. **Camera/Microphone Issues**: 
   - Make sure you allow permissions when prompted
   - Check browser settings for camera/microphone access
   - Refresh the page and try again

2. **Connection Issues**:
   - Ensure both server and client are running
   - Check that ports 5000 and 5173 are not blocked
   - Try refreshing the browser

3. **No Match Found**:
   - Make sure another user is logged in and searching
   - Try with two different browser windows/tabs

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### License

This project is for educational purposes.
