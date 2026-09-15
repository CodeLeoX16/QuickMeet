# QuickMeet — University Project Report

## Abstract

QuickMeet is a lightweight WebRTC-based video meeting prototype that demonstrates peer-to-peer audio/video, screen sharing and text chat using a minimal signaling server. The system pairs a React single-page frontend with a Node/Express signaling backend (socket.io) and MongoDB-backed user/meeting metadata. This report describes objectives, architecture, implementation details, testing and deployment instructions suitable for submission to a university project evaluation.

## 1. Introduction

This project was developed to explore real-time web communications using browser-native WebRTC APIs. The goals were to: (1) implement a functioning peer-to-peer video meeting application, (2) demonstrate signaling using socket.io, (3) handle common UX flows (permissions, toggles, screen share), and (4) document the system for replication and evaluation.

## 2. Objectives

- Build a demo-ready WebRTC meeting app with core meeting features.
- Implement minimal but robust signaling to exchange SDP and ICE.
- Provide clear developer documentation and reproducible setup steps.
- Discuss production considerations (TURN, HTTPS, scaling).

## 3. System Architecture

QuickMeet uses a full-mesh WebRTC approach for small group meetings. The signaling server relays SDP and ICE between participants but does not carry media. STUN is used for public IP discovery; TURN is recommended for production to guarantee connectivity.

- Frontend: React SPA (`frontend/src/pages/VideoMeet.jsx`) — manages media, RTCPeerConnection objects, UI, and signaling client.
- Backend: Node/Express + socket.io (`backend/src/controllers/socketManager.js`, `backend/src/app.js`) — handles `join-call`, `signal`, `chat-message`, and user presence events.
- Data: MongoDB models for users and meeting metadata (`backend/src/models/user.model.js`, `backend/src/models/meeting.model.js`).

Architecture diagram (Mermaid source available in [docs/architecture.md](docs/architecture.md)):

```mermaid
flowchart TB
  subgraph Client
    A[Browser (React)\nUI: VideoMeet.jsx] -->|getUserMedia| B(Media Devices)
    A -->|socket.io connect| S(Signaling Client)
  end

  subgraph Signaling
    S --> SS[Signaling Server\nNode/Express + socket.io]
    SS -->|relay SDP/ICE| S2[Other Clients]
  end

  subgraph P2P
    A <-.->|WebRTC (SDP/ICE)| C[Peer RTCPeerConnection]
    C -.-> D[Other Browser(s)]
  end

  subgraph Infrastructure
    STUN[STUN Server]\nTURN[TURN Server (optional)]
    SS --> STUN
    C --> STUN
    C --> TURN
  end
```

## 4. Implementation

4.1 Frontend

- Language & framework: JavaScript, React.
- Core file: `frontend/src/pages/VideoMeet.jsx` — handles permission flow, creation of RTCPeerConnection, exchange of offers/answers, ICE candidate handling, screen-sharing, and chat UI.
- UI: Material-UI for controls; responsive layout for video tiles.

Key client functions:
- `getPermissions()` — request and verify media permissions.
- `connectToSocketServer()` — initialize socket.io client, register signaling handlers.
- `gotMessageFromServer()` — process incoming SDP/ICE and perform negotiation.

4.2 Backend

- Language & framework: Node.js (ES modules), Express, socket.io.
- Core files: `backend/src/app.js`, `backend/src/controllers/socketManager.js`.
- Responsibilities: manage socket rooms (meeting URLs), relay `signal` messages, broadcast `join`/`leave` events, and optionally persist user/meeting metadata via Mongoose models.

4.3 Data Models

- `user.model.js` — stores basic user profile and history of joined meetings.
- `meeting.model.js` — stores meeting metadata when persistence is required (optional for the demo).

4.4 Signaling Flow (summary)

1. Client A requests media and connects to signaling server, emitting `join-call` for a room.
2. Server notifies existing room members; peers create RTCPeerConnection and exchange `offer`/`answer` via `signal` events.
3. ICE candidates are forwarded through the same signaling channel until connectivity established.
4. Media flows directly between peers (P2P); server only relays control messages.

## 5. Testing & Evaluation

5.1 Manual tests performed

- Two-browser P2P connection: camera/mic, mute/unmute, video toggle verified.
- Screen sharing: verified replacement of camera stream and correct stop/fallback behavior.
- Chat messages: verified delivery via signaling server and ephemeral in-room history when joining.

5.2 Suggested automated tests

- Unit tests (Jest) for helper functions and permission handling.
- Integration tests with Playwright/Puppeteer to simulate two browser clients and verify offer/answer flows.

## 6. Deployment & Reproducible Setup

Prerequisites: Node.js (v16+), npm, MongoDB (optional for persistence).

6.1 Local development

Backend

```powershell
cd backend
npm install
npm start
```

Frontend

```powershell
cd frontend
npm install
npm start
# open http://localhost:3000
```

6.2 Production considerations

- Serve frontend over HTTPS; browsers require secure origins for getUserMedia and screen capture.
- Add a TURN server (coturn or managed provider) to ensure connectivity across restrictive NATs.
- Use a Redis adapter for socket.io and persist minimal room state for horizontal scaling.
- Protect APIs and socket endpoints with authentication (JWT/session tokens) and CORS restrictions.

## 7. Limitations & Future Work

- Uses full-mesh WebRTC (suitable for small groups). For larger meetings, an SFU (mediasoup, Jitsi) should be used.
- STUN-only in the demo may fail in restrictive networks — TURN integration is required for production reliability.
- Improve test coverage, add CI/CD, and containerize with Docker/Docker Compose for reproducible deployment.

## 8. Conclusion

QuickMeet demonstrates core WebRTC concepts and implements end-to-end meeting flows suitable for an academic demonstration. The codebase is organized for extension toward production features (TURN, authentication, SFU integration). The accompanying repository contains source files and documentation to reproduce and evaluate the project.

## References

- Project repository: root README and module READMEs ([README.md](../README.md)).
- Architecture diagram: [docs/architecture.md](docs/architecture.md).
- Implementation pointers and interview notes: [docs/describe.md](describe.md).

## Appendix A — Key Commands

- Start backend (dev): `cd backend && npm run dev` or `npm start`.
- Start frontend: `cd frontend && npm start`.
- Build frontend for production: `cd frontend && npm run build`.

---

## Appendix B — Vital Code Snippets & Links

Below are concise, evaluation-ready snippets that highlight the project's core behaviors: media handling and signaling.

Frontend — media & signaling (excerpt from `frontend/src/pages/VideoMeet.jsx`):

```javascript
// Request combined audio+video, set `window.localStream` and attach to local <video>
const getPermissions = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  window.localStream = stream;
  localVideoref.current.srcObject = stream;
}

// Initialize socket.io, join room and register handlers
let connectToSocketServer = () => {
  socketRef.current = io.connect(server_url);
  socketRef.current.on('signal', gotMessageFromServer);
  socketRef.current.on('connect', () => {
    socketRef.current.emit('join-call', window.location.href);
    socketIdRef.current = socketRef.current.id;
  });
}

// Handle incoming SDP / ICE and create answers when receiving offers
let gotMessageFromServer = (fromId, message) => {
  const signal = JSON.parse(message);
  if (signal.sdp) {
    connections[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(() => {
      if (signal.sdp.type === 'offer') {
        connections[fromId].createAnswer().then(desc => {
          connections[fromId].setLocalDescription(desc).then(() => {
            socketRef.current.emit('signal', fromId, JSON.stringify({ sdp: connections[fromId].localDescription }));
          })
        })
      }
    })
  }
}
```

Backend — signaling relay (excerpt from `backend/src/controllers/socketManager.js`):

```javascript
export const connectToSocket = (server) => {
  const io = new Server(server, { cors: { origin: '*' } });

  io.on('connection', (socket) => {
    socket.on('join-call', (path) => {
      // register socket in room and notify peers
      connections[path] = connections[path] || [];
      connections[path].push(socket.id);
      connections[path].forEach(id => io.to(id).emit('user-joined', socket.id, connections[path]));
    });

    socket.on('signal', (toId, message) => {
      io.to(toId).emit('signal', socket.id, message);
    });
  });

  return io;
}
```

Links

- GitHub repository: https://github.com/CodeLeoX16/QuickMeet
- Live demo: (add URL here if deployed; e.g. `https://your-domain.example`)

---

Prepared for submission: QuickMeet — April 2026
