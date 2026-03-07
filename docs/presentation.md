# QuickMeet — Interview Slides

---

## Slide 1 — Overview

- QuickMeet: lightweight WebRTC-based video meeting app
- Frontend: React + MUI; Backend: Node/Express + socket.io (signaling)
- Media: WebRTC (RTCPeerConnection) with STUN (+TURN optional)
- Key features: join by code, audio/video, screen sharing, chat

Notes to speak: emphasize permissions handling, signaling flow, and trade-offs (mesh vs SFU).

---

## Slide 2 — Architecture & Talking Points

- Architecture (short): Browser (getUserMedia) → Signaling Server (socket.io) → Peer RTCPeerConnection → direct media exchange
- Challenges: NAT traversal (TURN), secure context (HTTPS), scalability (SFU)
- Improvements to mention: device selector UI, TURN server, switch to SFU for >6 participants, CI/CD and monitoring

Sample interview prompts:
- "Explain how signaling works in WebRTC." — mention SDP, ICE, STUN/TURN, and socket.io role.
- "How would you scale this?" — explain SFU benefits and trade-offs.

---

End of slides — copy to your slide tool or present directly from this Markdown.
