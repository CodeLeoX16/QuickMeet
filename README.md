# QuickMeet

> Modern, lightweight video meetings — React frontend + Node/Express signaling + WebRTC P2P.

[![Demo](docs/screenshot-landing.png)](docs/screenshot-landing.png)

QuickMeet is a small, interview-ready WebRTC project that demonstrates peer-to-peer audio/video, screen sharing and chat with a minimal signaling server. This README is written so you can quickly run, demo, and explain the system to a recruiter.

---

## Highlights

- Peer-to-peer WebRTC video/audio with socket.io signaling.
- Simple meeting join flow using a meeting URL.
- Screen sharing, mute/unmute, video toggle and in-meeting chat.
- Minimal backend (Node + socket.io) that relays SDP/ICE and chat events.

---

## Project structure

```text
QuickMeet/
├── README.md
├── backend/
│   ├── package.json
│   └── src/
│       ├── app.js
│       ├── controllers/
│       │   ├── socketManager.js
│       │   └── user.controller.js
│       ├── models/
│       │   ├── meeting.model.js
│       │   └── user.model.js
│       └── routes/
│           └── users.routes.js
├── docs/
│   ├── architecture.md
│   ├── describe.md
│   ├── presentation.md
│   └── university_project_report.md
└── frontend/
    ├── package.json
    ├── public/
    │   ├── index.html
    │   ├── manifest.json
    │   └── robots.txt
    └── src/
        ├── App.js
        ├── App.css
        ├── index.js
        ├── index.css
        ├── environment.js
        ├── contexts/
        │   └── AuthContext.jsx
        ├── pages/
        │   ├── authentication.jsx
        │   ├── history.jsx
        │   ├── home.jsx
        │   ├── landing.jsx
        │   └── VideoMeet.jsx
        ├── styles/
        │   └── videoComponent.module.css
        └── utils/
            └── withAuth.jsx
```

---

## Live demo (local)

1. Start the backend

```bash
cd backend
npm install
npm start
```

2. Start the frontend

```bash
cd frontend
npm install
npm start
```

Open `http://localhost:3000` in two windows (or two devices) and join the same meeting URL to test P2P audio/video and chat.

---

## What to show a recruiter (demo checklist)

- Landing page and how to join a meeting by URL.
- Toggle camera and mic — show remote updates in the other window.
- Start/stop screen share and explain how screen stream replaces camera stream.
- Send chat messages and explain how the server relays messages and stores ephemeral history.
- Point to `frontend/src/pages/VideoMeet.jsx` (media + signaling) and `backend/src/controllers/socketManager.js` (signaling logic).

---

## Architecture (short)

- Frontend: React SPA — captures media, manages RTCPeerConnections, and connects to the signaling server via `socket.io-client`.
- Backend: Node/Express + `socket.io` — small relay for SDP/ICE and chat; room state is currently in-memory.
- Media: WebRTC (RTCPeerConnection) for direct peer connections; STUN for public IP discovery (TURN for production).

A fuller architecture and interview notes are in [docs/describe.md](docs/describe.md#L1).

---

## Key files

- `frontend/src/pages/VideoMeet.jsx` — meeting UI, media permission handling, getUserMedia, screen sharing and signaling client.
- `frontend/src/styles/videoComponent.module.css` — meeting-specific styles.
- `backend/src/controllers/socketManager.js` — socket events: `join-call`, `signal`, `chat-message`, `user-left`.
- `docs/describe.md` — recruiter-facing description, architecture, interview Q&A and next steps.

---

## Why this stack? (short answers to recruiter questions)

- **React**: fast iteration, clear component model, and easy to demo UI changes.
- **socket.io**: convenient event-based signaling and built-in reconnection logic for prototypes.
- **WebRTC**: industry standard for low-latency browser media.
- **Node/Express**: minimal, well-known backend to host signaling and APIs.

Trade-offs: the current approach is full-mesh (good for small groups). Scaling large meetings requires an SFU (mediasoup, Jitsi, Janus) and a TURN server to guarantee connectivity.

---

## Production notes (what you'd add before shipping)

- Serve frontend over HTTPS and use secure WebSocket (WSS).
- Deploy a TURN server (e.g., coturn) or use a managed TURN provider for reliable connectivity.
- Replace in-memory signaling state with Redis & use `socket.io-redis` adapter for horizontal scaling.
- Add authentication (JWT/session) and authorization checks to control room access.
- Add monitoring (Prometheus/Sentry) and deployment pipeline (CI/CD + Docker).

---

## Interview Q&A snippets (copy these when explaining)

- **How peers connect:** clients create `RTCPeerConnection`, exchange SDP `offer/answer` and ICE candidates via the signaling server.
- **Why socket.io not raw WebSocket:** simpler event model and better reconnection/backoff behavior for a prototype.
- **Why not managed SDKs (Twilio/Daily/etc.):** managed platforms speed launch but hide the lower-level WebRTC mechanics — building from primitives demonstrates deeper understanding.

---

## Developer checklist & tips

- Troubleshooting camera/mic: check browser permissions, OS privacy settings, and whether another app is using the device.
- If camera/mic don't start, view console logs for `getUserMedia` errors.
- To test in restricted networks, deploy a TURN server and configure its credentials.

---

## Roadmap (short)

- Migrate to `addTrack`/`ontrack` and transceivers for modern WebRTC APIs.
- Add TURN integration and secure credentials handling.
- Add persistent room storage, access tokens, and moderation features.
- Add CI and E2E tests for media flows (Playwright/Puppeteer).

---

## License & Contact

This repository does not include a top-level `LICENSE` file. Add one (e.g., MIT) if desired. For questions, open an issue in the repo or contact the maintainer.

---

If you'd like, I can:
- Create a 1–2 slide PDF summarizing this README for interviews,
- Add a `docker-compose.yml` to run backend + frontend + coturn locally, or
- Replace `addStream`/`onaddstream` with `addTrack`/`ontrack` in the code.

Which would you like next?
