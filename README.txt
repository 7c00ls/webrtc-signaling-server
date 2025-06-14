📞 WebRTC Voice Call Module Setup Guide

🧱 Folder Structure:
- client/index.html   → Open in browser for testing voice call
- server/server.js    → Node.js signaling server
- server/package.json → Dependencies for server

🔧 Setup Instructions:

1. Install Node.js (https://nodejs.org)

2. In terminal:
   cd server
   npm install
   node server.js

   This starts signaling server at: http://localhost:3000

3. Now open client/index.html in two browser tabs or two devices

4. Click "Start Call" on one tab, and it should connect to the other

📝 Note:
- Works best on same network
- Use HTTPS if hosting on web
