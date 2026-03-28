**Project Overview**

- **Name:** QuickMeet — lightweight WebRTC meeting app with chat and screen share.
- **Purpose:** Demo-ready video meeting prototype suitable for recruiter walkthroughs: simple UI, peer-to-peer media via WebRTC, and a small Node signaling server.
- **Where to look:** Core frontend: [frontend/src/pages/VideoMeet.jsx](frontend/src/pages/VideoMeet.jsx#L1). Signaling: [backend/src/controllers/socketManager.js](backend/src/controllers/socketManager.js#L1). Styles: [frontend/src/styles/videoComponent.module.css](frontend/src/styles/videoComponent.module.css#L1).

**High-level Architecture**

- **Frontend (React):** UI, media capture, peer connections and signaling client.
- **Backend (Node + socket.io):** Lightweight signaling server that relays SDP/ICE and chat messages between participants.
- **P2P Media:** WebRTC (direct peer-to-peer for media). The server only relays signaling and persists transient chat history per room.

**Tech stack and why**

- **React (Frontend):** fast iteration, declarative UI, component re-use. Good ecosystem (MUI) and familiarity for recruiter demos.
  - Why not plain JS/Vanilla? React improves maintainability and testability for feature growth.

- **Material-UI (MUI):** quick, accessible components and polished look with minimal CSS.
  - Why not custom CSS frameworks? MUI accelerates prototyping while keeping a professional look.

- **WebRTC:** real-time audio/video with low latency and direct peer connections.
  - Why not third-party paid services (Twilio, Daily)? Those add recurring costs and hide implementation details — for an interview it's better to show you built the core flow.

- **socket.io (signaling):** simple bi-directional channel for SDP/ICE and chat events.
  - Why not WebSocket raw? socket.io handles reconnection and fallbacks during demo; saves development time.

- **Node/Express (Backend):** minimal and familiar; easy to deploy and integrate with socket.io.

**Key functions (what they do and why used)**

- `getPermissions()` — detects and requests camera/mic, sets `window.localStream`. Centralizes permission logic and fallbacks so the UI can reflect availability.
- `getUserMedia()` / `getUserMediaSuccess()` — starts publishing local media and renegotiates offers with peers. Keeps negotiation logic separated for clarity.
- `getDislayMediaSuccess()` — handles screen-share stream lifecycle and fallbacks back to camera when sharing stops.
- `connectToSocketServer()` — opens socket.io connection, registers signaling handlers, chat message handler and user join/leave flows.
- `gotMessageFromServer()` — processes incoming SDP/ICE and creates answers; this is the main signaling callback.

Why these functions vs alternatives

- I used explicit `getUserMedia` + manual offer/answer flows to demonstrate WebRTC internals. Alternative higher-level SDKs (e.g., WebRTC adapters or hosted SDKs) hide these details and reduce learning opportunities.
- For device fallback (camera-only, mic-only) I implemented conservative feature checks and minimal prompts; this mimics production-friendly behavior where a user can decline video but still join audio.

**From scratch — setup & run (local developer flow)**

Prerequisites: Node.js (>=16), npm

1. Clone repo

```bash
git clone <your-repo-url>
cd QuickMeet
```

2. Backend

```bash
cd backend
npm install
npm start
# server listens and exposes socket.io
```

3. Frontend

```bash
cd frontend
npm install
npm start
# open http://localhost:3000 and join a meeting
```

**Production deployment (recommended minimal)**

- Build frontend and serve via static hosting (Netlify, Vercel, AWS S3 + CloudFront) or as static files from the backend.
- Run backend on a Node host (DigitalOcean, AWS EC2, Heroku) behind HTTPS. Use a process manager (PM2) or containerize with Docker.
- WebRTC requires secure origins (HTTPS) and a TURN server for NAT traversal and reliable connectivity; plan to add a TURN server (coturn) for production.

Example build + docker (quick):

```bash
# frontend build
cd frontend && npm run build

# docker backend (example)
cd backend
docker build -t quickmeet-backend .
docker run -p 4000:4000 quickmeet-backend
```

**Security & production notes**

- Always serve the frontend over HTTPS; browser blocks camera/mic on insecure origins.
- Add TURN credentials for production to avoid failed peer connections across restrictive NATs.
- Harden CORS on the signaling server and add authentication (JWT or sessions) if you introduce private/recorded meetings.

**Performance & reliability tips**

- Prefer `addTrack()` and `ontrack` for modern browsers instead of `addStream()`/`onaddstream` — easier to mix tracks and manage transceivers. (Planned refactor in code.)
- Limit video resolution when many participants join; implement track replace and simulcast if scaling is needed.

**How to demo to a recruiter (quick script)**

1. Start backend and frontend locally (see commands above).
2. Open two browser windows (or two devices) and join the same meeting (same URL).
3. Show video toggle, mute/unmute, screen share, and live chat.
4. Explain the signaling flow: frontend -> socket.io -> other clients (show `connectToSocketServer()` and `gotMessageFromServer()` in code).
5. Mention production steps: HTTPS, TURN, monitoring.

**FAQ — likely recruiter questions & suggested answers**

- Q: Why did you use WebRTC directly instead of a service? 
  - A: Using WebRTC demonstrates understanding of peer negotiation, SDP and ICE. It keeps costs $0 and shows the low-level plumbing during interviews. Services are great for production scale, but they hide the learning opportunity.

- Q: Why socket.io, not raw WebSocket?
  - A: socket.io gives automatic reconnection and simpler event semantics for a quick prototype; raw WebSocket is fine but requires more boilerplate for reconnection and room events.

- Q: Why Node/Express on the backend?
  - A: Simplicity and quick integration with socket.io; Node is a common pairing with React and reduces context switching.

- Q: Why not use `addTrack`? 
  - A: `addTrack` is the modern API and I plan to refactor to `addTrack`/`ontrack` next — current `addStream` was kept for browser compatibility during initial development.

**Next improvements (roadmap)**

- Replace `addStream`/`onaddstream` with `addTrack`/`ontrack` and transceivers.
- Integrate a TURN server (coturn) and configure credentials.
- Add authentication and user rooms with expiration.
- Improve UI accessibility and test coverage.

If you want, I can convert the signaling/peer code to use `addTrack`/`ontrack` (cleaner modern approach) and provide a short demo script and Docker Compose for local deploy — tell me which you'd prefer and I'll add it.

---

## Additional interviewer topics

### Architecture diagram

Mermaid sequence (frontend <-> signaling <-> peers + TURN/STUN):

```mermaid
flowchart LR
  subgraph Client A
    A[Browser A<br/>React + getUserMedia]
  end
  subgraph Client B
    B[Browser B<br/>React + getUserMedia]
  end
  A -- signaling (socket.io) --> S[(Signaling Server)]
  B -- signaling (socket.io) --> S
  A -- direct media (WebRTC P2P) --> B
  S --- STUN/ TURN[(STUN/TURN servers)]
  classDef infra fill:#f9f,stroke:#333,stroke-width:1px;
  S,STUN/ TURN class infra
```

I can also produce a PNG/SVG of this diagram if you want a slide-ready image.

### TURN/STUN details

- **STUN**: used for public IP discovery and lightweight NAT traversal. Free public STUN servers (e.g., Google's) are fine for demos.
- **TURN**: relay fallback when direct P2P fails (symmetric NATs, firewalls). For production use a TURN server (coturn) or a managed provider (Twilio Network Traversal, Xirsys).
- **Costs**: TURN incurs outbound bandwidth costs. Managed providers charge per GB/hour; self-hosting (coturn) costs VM + bandwidth. Estimate: small scale <100GB/month might be tens of dollars; large-scale becomes significant.
- **Config**: TURN needs credentials (long-term or REST) stored in secrets and injected into `RTCIceServer` config on the client.

### Scalability (signaling)

- **Rooms & namespaces**: logical grouping using the meeting URL as a room key.
- **Horizontal scaling**: run multiple Node instances behind a load balancer. Use `socket.io-redis` adapter so instances share events.
- **Sticky sessions vs adapter**: sticky sessions + load balancer can keep a client tied to an instance, but Redis adapter lets you avoid sticky sessions and broadcast between servers.
- **State**: current implementation keeps ephemeral state in memory; production should persist minimal membership info in Redis to support failover.

### Security model

- **Transport**: require HTTPS and WSS for production — browsers block getUserMedia on insecure origins.
- **CORS**: restrict allowed origins; do not use wildcard `*` in production.
- **Auth**: add JWT or session-based auth to gate who can join; include role checks (host/moderator).
- **Access control**: server-side checks to prevent unauthorized signaling/room joins.
- **E2EE option**: insertable streams (ORTC) or end-to-end encryption libraries can enable true E2EE at the client level; this is more complex but possible for sensitive meetings.

### Privacy & data retention

- **Current behavior**: chat messages are kept in-memory per room (ephemeral) to populate chat for new joiners.
- **Recommendation**: for production, persist to a database with TTL and provide deletion APIs. Document retention policy and obtain user consent.
- **GDPR**: treat messages as personal data if they contain PII — support data export and deletion, and keep a record of processing activities.

### Testing strategy

- **Unit tests**: small helpers (permission checks, message formatting) using Jest.
- **Integration tests**: signaling flows and offer/answer sequences tested with headless browsers (Puppeteer or Playwright) in CI.
- **Manual tests**: verify camera/microphone prompts, screen-share, and multi-tab behavior. Steps:
  1. Open two browsers (or two devices) and join same URL.
  2. Toggle camera/mic, verify remote side receives tracks.
  3. Enable screen-share and stop it, ensure fallback to camera.
- **Mocking**: stub `navigator.mediaDevices.getUserMedia` in tests to simulate devices and errors.

### Monitoring & logging

- **Metrics to collect**: connection attempts, successful joins, ICE candidate failures, average time-to-connect, bandwidth per session.
- **Tools**: Prometheus + Grafana for metrics; Sentry for runtime errors; ELK/Logstash for structured logs.
- **Alerting**: set alerts for ICE failure spikes, high error rates, or service unavailability.

### CI/CD & deployment

- **CI**: use GitHub Actions to run tests, lint, and build frontend. Publish artifacts or run Docker image build.
- **Secrets**: store TURN credentials, JWT secrets, and DB credentials in secure secret stores (GitHub Secrets, Vault).
- **Docker Compose**: create a compose file for local dev: backend, frontend (or serve built static), and optionally a coturn container.

### Browser & mobile support

- **Targets**: Chrome, Firefox, Edge (Chromium) are fully supported. Safari has historically stricter constraints — test iOS Safari carefully.
- **Feature detection**: use `navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function'` before calling.
- **Mobile UX**: minimize UI chrome, avoid heavy layouts, and provide explicit buttons for camera/mute. Test orientation changes and limited CPU/battery.

### Performance optimizations

- **Bandwidth**: set `getUserMedia` constraints to limit resolution (720p/480p) on low-end devices.
- **addTrack / simulcast**: migrate to `addTrack()` and configure `RTCRtpSender.setParameters()` for simulcast/SVC to provide multiple encodings.
- **Lazy rendering**: only render remote video elements when visible to reduce GPU usage.

### Failure modes & recovery

- **Permission denied**: show clear UI guidance and allow joining audio-only or with a placeholder stream.
- **ICE failures**: attempt ICE restart, fall back to TURN relay, and notify users if connectivity can't be established.
- **Disconnects**: implement reconnection and re-join logic; gracefully remove stale peers server-side.

### Costs & trade-offs

- **Self-hosted**: cheaper for small scale but requires ops (TURN bandwidth, monitoring). Good for interview demos and learning.
- **Managed SDKs (Twilio, Daily, Agora)**: faster to production and include TURN infrastructure and global scaling, but incur ongoing costs and reduce control.

### Future features

- Recording (server-side via SFU or client-side using MediaRecorder), moderation (mute/kick), meeting persistence, analytics dashboard, and access controls.

---

If you'd like, I can append a one-page slide-ready summary or generate a Mermaid PNG for the architecture diagram and add a `docker-compose.yml` example. Which of those would you like next?
