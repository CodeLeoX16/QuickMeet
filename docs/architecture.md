# QuickMeet — Architecture Diagram

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

  style Client fill:#f9f,stroke:#333,stroke-width:1px
  style Signaling fill:#bbf,stroke:#333,stroke-width:1px
  style P2P fill:#bfb,stroke:#333,stroke-width:1px
  style Infrastructure fill:#ffe4b5,stroke:#333,stroke-width:1px
```

Copy this file into any Markdown editor that renders Mermaid (GitHub, VS Code with Mermaid preview, or mermaid.live) to view the diagram.
