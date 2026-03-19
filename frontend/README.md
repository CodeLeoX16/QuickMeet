 # QuickMeet

QuickMeet is a lightweight video meeting app built with React (frontend) and Node/Express + Socket.io (backend) that uses WebRTC for peer-to-peer video/audio and optional screen sharing. This README is written for an interviewer: it explains the system, how to run it locally, common debugging steps (camera/mic), architectural notes, and likely interview questions with suggested talking points.

**Project Goals**
- Simple, reliable video meetings with minimal dependencies.
- Low-latency peer-to-peer audio/video using WebRTC with a signalling server for SDP/ICE exchange.
- Clear UX for joining via a meeting code and basic chat.

**Tech Stack**
- Frontend: React, MUI (component library), socket.io-client, plain CSS modules.
- Backend: Node.js, Express, socket.io for signaling.
- Media: WebRTC (RTCPeerConnection), STUN (stun.l.google.com)

**Quick Run (development)**
1. Backend
```powershell
cd backend
npm install
npm start
```
2. Frontend
```powershell
cd frontend
npm install
npm start
```

Open the frontend URL (usually http://localhost:3000) and join a meeting with a meeting code (or open the same meeting URL in a second browser to test P2P).

**Key Files & Responsibilities**
- `frontend/src/pages/VideoMeet.jsx`: main meeting UI, permission handling (`getPermissions()`), media setup (`getUserMedia`/`getDislayMediaSuccess`), signaling integration (`connectToSocketServer`, `gotMessageFromServer`), and UI handlers (toggle video/mic/screen, chat).
- `frontend/src/utils/withAuth.jsx`: simple HOC for redirecting unauthenticated users to `/auth`.
- `frontend/src/pages/home.jsx`: meeting code input and join flow.
- `backend/src/app.js`: Express + socket.io server handling `join-call`, `signal` messages, and broadcasting user join/leave events.

**System Architecture (high level)**

Frontend (React) <--> Signaling Server (socket.io) <--> Other Frontend Peers

- Flow:
  1. User toggles Join → app requests camera/mic via `navigator.mediaDevices.getUserMedia`.
  2. Client connects to signaling server and emits `join-call`.
  3. Server informs other clients; clients create RTCPeerConnection and exchange SDP/ICE via `signal` messages.
  4. Streams are attached to `<video>` elements; chat messages flow through socket.io.

Notes:
- STUN only (no TURN server) — good for LAN/most NATs but may fail in strict NATs; discuss adding TURN for production.

**Debugging Camera / Microphone Issues**
- Common causes:
  - Browser permission denied (ask user to check address bar and OS privacy settings).
  - Device in use by another app.
  - No matching constraints or wrong device selected.
- Troubleshooting steps:
  1. Open browser console to view errors from `getUserMedia`.
  2. Check site permissions (lock icon in address bar) and OS privacy settings.
  3. Try a combined `getUserMedia({ video: true, audio: true })` to avoid multiple prompts.
  4. If multiple devices are present, add a device selection UI (recommended).

**Security & Privacy Considerations**
- Use HTTPS in production — browsers require secure context for getUserMedia and screen capture.
- Only request the minimum tracks needed; stop tracks when leaving.
- Consider implementing token-based room access and server-side checks.

**Interview Q&A — Likely Questions & Suggested Answers (short)**
- Q: How does WebRTC establish a connection between peers?
  - A: Through RTCPeerConnection: peers create offers/answers (SDP) and exchange ICE candidates via a signaling server (socket.io). STUN helps discover public IPs; a TURN server is needed for relaying when direct connection fails.
- Q: How do you handle media permissions and UX around them?
  - A: Request combined audio+video to show a single browser prompt and set availability flags. Provide clear error messages and fallback behaviors (e.g., join with audio-only) and add device selection to pick camera/mic.
- Q: What are common pitfalls deploying this system?
  - A: NAT traversal (need TURN), certificate/HTTPS requirements, scalability of signaling server, and ensuring privacy (secure tokens, room access control).
- Q: How would you scale this for many participants?
  - A: Move from full mesh to SFU (selective forwarding) like mediasoup or Jitsi Videobridge to centralize media routing, reducing per-client bandwidth and CPU overhead.
- Q: Why not use a managed service?
  - A: Managed services (Twilio, Daily, Agora) simplify deployment and scale but add cost and vendor lock-in. Building in-house offers flexibility and learning value.

**Design Decisions & Trade-offs**
- Full-mesh WebRTC is simple and works for small groups (2–6). For larger groups, an SFU is required.
- Chose STUN-only to start (simpler, lower cost); adding TURN is necessary for robust production.
- Signal via socket.io for rapid prototyping and easy JSON messaging.

**Next improvements (to mention in interview)**
- Add device selection (camera/mic) and persistent user preferences.
- Replace deprecated `onaddstream` with `ontrack` and `addTrack` for modern WebRTC.
- Add TURN server and HTTPS for production readiness.
- Add test coverage, logging, and deployment docs (Docker, CI/CD).

---

If you want, I can also generate a concise slide (1–2 pages) or a single-sheet architecture diagram you can present in interviews. Would you like that?

*** End of README ***
# QuickMeet

> Modern, lightweight video meeting app with socket-powered signaling and a React front-end.

---

## Table of Contents
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
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

---

## Demo

Add screenshots or a short GIF here to highlight the main screens: landing, meeting UI, and history.

![screenshot-placeholder](docs/screenshot-landing.png)

---

## Features
- Create/join video meetings
- Real-time signaling with Socket.IO
- User authentication and history tracking
- Responsive React UI with Material UI
- Lightweight backend using Express and MongoDB (Mongoose)

---

## Tech Stack
- Frontend: React, React Router, Material UI, socket.io-client, axios
- Backend: Node.js (ES modules), Express, Socket.IO, Mongoose (MongoDB)
- Scripts and tools: nodemon (dev), react-scripts

Packages were observed in:
- `backend/package.json` (express, socket.io, mongoose, mongodb, bcrypt, cors)
- `frontend/package.json` (react, react-dom, react-router-dom, socket.io-client, axios, @mui/material)

---

## Architecture

- `frontend/` — React SPA, pages include landing, authentication, home, VideoMeet and history.
- `backend/` — Express app with route modules and `socketManager.js` that handles real-time signaling.
- Data models: `backend/models/user.model.js` and `backend/models/meeting.model.js` (MongoDB).

---

## Getting Started

### Prerequisites
- Node.js (v16+ recommended)
- npm or yarn
- MongoDB instance (local or hosted)

### Install

Clone the repo and install dependencies for both services:

```bash
git clone <your-repo-url>
cd QuickMeet

# Backend
cd backend
npm install

# Frontend (in a new terminal)
cd ../frontend
npm install
```

### Run (development)

Start the backend and frontend in development mode:

```bash
# Backend (hot reload)
cd backend
npm run dev

# Frontend
cd ../frontend
npm start
```

By default the frontend runs on `http://localhost:3000` and the backend on `http://localhost:5000` (or the port configured in your environment). Adjust ports if needed.

---

## Environment Variables

Create a `.env` file for the backend (example variables):

```
MONGO_URI=mongodb://localhost:27017/quickmeet
PORT=5000
JWT_SECRET=your_jwt_secret_here
```

Frontend may require a base API URL; add a variable in `frontend/.env` if your client expects it, e.g. `REACT_APP_API_URL`.

---

## API & Socket Notes

- REST routes: see `backend/routes/` (e.g., `users.routes.js`) for endpoints related to authentication and user data.
- Websockets: `socketManager.js` orchestrates meeting signaling. From the client use `socket.io-client` to connect and exchange SDP/ICE messages.

Quick example (client-side):

```js
import { io } from 'socket.io-client';
const socket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000');

socket.emit('join-room', { roomId, userId });
socket.on('signal', (data) => { /* handle signaling */ });
```

---

## Testing

- Frontend tests: `cd frontend && npm test` (uses React Testing Library)
- Backend: add tests as needed (not included by default)

---

## Contributing

- Fork the repo and create a feature branch: `git checkout -b feat/your-feature`
- Commit changes and open a pull request describing the change.
- Add screenshots or recordings for UI changes.

Suggested improvements:
- Add CI (GitHub Actions) for linting and test runs
- Add end-to-end tests for video flows

---

## License

This repository does not specify a top-level license file. The backend `package.json` lists `ISC`.
Add a `LICENSE` file (e.g., MIT) if you want to make licensing explicit.

---

## Contact

Project maintained by the QuickMeet contributors. For issues or questions open an issue or reach out in the repository.

---

Ready-made checklist:
- [ ] Add real screenshots to `docs/` and update paths
- [ ] Add repo-level `LICENSE` if desired
- [ ] Add CI badges and deployment instructions
