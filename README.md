# QuickMeet

A lightweight video meeting app built with **React** (frontend) and **Node/Express + Socket.IO** (backend). QuickMeet uses **WebRTC** for low-latency peer-to-peer video/audio, plus optional **screen sharing**.

> Designed to be simple to run, easy to explain in interviews, and focused on the core real-time meeting experience.

## Live Demo
- https://quickmeet-4.onrender.com/

---

## Table of Contents
- [Highlights](#highlights)
- [Demo](#demo)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Install](#install)
  - [Run (development)](#run-development)
- [Environment Variables](#environment-variables)
- [API & Socket Notes](#api--socket-notes)
- [Common Debugging (Camera/Mic/WebRTC)](#common-debugging-cameramicwebrtc)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)
- [Interview Talking Points](#interview-talking-points)
- [Contact](#contact)

---

## Highlights
- **WebRTC P2P** audio/video for low-latency calls
- **Socket.IO signaling** for SDP/ICE exchange
- **Meeting codes** (join/share quickly)
- **Real-time chat** during meetings
- **Optional screen sharing**
- **Auth + meeting history** (MongoDB)

---

## Demo

Add screenshots or a short GIF here to show the main flow (Landing → Join → In-call UI).

<p>
  <img width="1908" height="985" alt="QuickMeet Screenshot 1" src="https://github.com/user-attachments/assets/6d053c61-4f18-4336-a7d7-729f8a3ab4f2" />
  <img width="800" alt="QuickMeet Screenshot 2" src="https://github.com/user-attachments/assets/4ad7e25f-ccbd-4794-8f48-40da68d0b8f0" />
</p>

---

## Features
- Create/join video meetings with a meeting code
- Peer-to-peer video/audio via WebRTC
- Socket-based signaling (SDP offers/answers + ICE candidates)
- Screen sharing (optional)
- In-meeting chat
- User authentication and meeting history tracking

---

## Tech Stack

**Frontend**
- React, React Router
- Material UI (MUI)
- socket.io-client, axios
- CSS Modules

**Backend**
- Node.js (ES modules), Express
- Socket.IO (real-time signaling)
- MongoDB + Mongoose
- Auth utilities (e.g., bcrypt, JWT)

**WebRTC**
- `RTCPeerConnection`, `getUserMedia`, `getDisplayMedia`
- STUN: `stun.l.google.com`

---

## Architecture

### Signaling vs Media (important concept)
- **Media** (audio/video/screen) flows **peer-to-peer** via **WebRTC** once connected.
- **Signaling** (SDP + ICE) flows through the **Socket.IO server** to help peers connect.

### Project Layout
- `frontend/` — React SPA (landing/auth/home/meeting/history)
- `backend/` — Express REST + Socket.IO server
- `backend/models/` — MongoDB models (e.g., user + meeting)

### Key Files & Responsibilities
- `frontend/src/pages/VideoMeet.jsx`
  - Permissions + device access (`getUserMedia`)
  - Screen sharing (`getDisplayMedia`)
  - WebRTC setup (`RTCPeerConnection`)
  - Signaling integration (`connectToSocketServer`, `gotMessageFromServer`)
  - UI handlers (toggle mic/cam/screen, chat)
- `frontend/src/utils/withAuth.jsx`
  - Simple HOC to redirect unauthenticated users to `/auth`
- `frontend/src/pages/home.jsx`
  - Meeting code input + join flow
- `backend/src/app.js`
  - Express + Socket.IO server handling room join/leave + signaling relay
- `backend/socketManager.js` (if present)
  - Socket event orchestration for meetings

---

## Getting Started

### Prerequisites
- Node.js **16+** (recommended)
- npm or yarn
- MongoDB instance (local or hosted)

### Install
```bash
git clone <your-repo-url>
cd QuickMeet

# Backend
cd backend
npm install

# Frontend (new terminal)
cd ../frontend
npm install
```

### Run (development)
```bash
# Backend (dev / hot reload if configured)
cd backend
npm run dev
# or: npm start

# Frontend
cd ../frontend
npm start
```

Defaults:
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5000` (or the port configured in your environment)

To test P2P quickly: open the same meeting in a second browser (or an incognito window) and join using the same meeting code.

---

## Environment Variables

### Backend (`backend/.env`)
```env
MONGO_URI=mongodb://localhost:27017/quickmeet
PORT=5000
JWT_SECRET=your_jwt_secret_here
```

### Frontend (`frontend/.env`) (optional)
```env
REACT_APP_API_URL=http://localhost:5000
```

---

## API & Socket Notes

### REST
See `backend/routes/` for endpoints related to authentication, users, and meeting history.

### WebSockets (Signaling)
Typical flow:
1. Client joins a room (meeting code)
2. Server notifies other peers in the room
3. Clients exchange SDP offers/answers
4. Clients exchange ICE candidates until connected

Client example:
```js
import { io } from "socket.io-client";

const socket = io(process.env.REACT_APP_API_URL || "http://localhost:5000");

socket.emit("join-room", { roomId, userId });

socket.on("signal", (payload) => {
  // payload may contain: offer/answer/candidate
});
```

---

## Common Debugging (Camera/Mic/WebRTC)

- **No camera/mic prompt**
  - Check browser site permissions for `http://localhost:3000` (or your deployed domain)
- **Black video / no audio**
  - Make sure the correct input device is selected
  - Close other apps/tabs that might be using the camera
- **Works locally, fails across networks**
  - NAT/firewalls can block P2P connections
  - STUN alone may not be enough; add a **TURN server** for better reliability
- **Echo**
  - Use headphones or ensure echo cancellation constraints are enabled

---

## Testing
- Frontend: `cd frontend && npm test`
- Backend: tests not included by default (add as needed)

---

## Contributing
- Fork the repo and create a feature branch: `git checkout -b feat/your-feature`
- Commit changes and open a pull request describing the change
- Add screenshots or recordings for UI changes

Suggested improvements:
- Add CI (GitHub Actions) for linting + tests
- Add TURN server support for more reliable connectivity
- Add end-to-end tests for join/leave/chat flows

---

## License
This repository does not specify a top-level license file. The backend `package.json` lists `ISC`.

If you want to make licensing explicit, add a `LICENSE` file (MIT/Apache-2.0/etc.).

---
