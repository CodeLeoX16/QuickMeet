<div align="center">

# 🚀 QuickMeet

### *Connect Instantly, Meet Seamlessly*

A modern, lightweight video conferencing platform built with cutting-edge web technologies

[![Made with React](https://img.shields.io/badge/Made%20with-React-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://socket.io/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)

[View Demo](#-demo) • [Features](#-features) • [Quick Start](#-quick-start) • [Documentation](#-documentation)

</div>

---

## ✨ Overview

**QuickMeet** is a full-stack video meeting application that brings people together with minimal friction. Built with performance and user experience in mind, it leverages WebRTC for peer-to-peer communication and Socket.IO for seamless real-time signaling.

> 💡 **Perfect for**: Remote teams, online education, virtual events, or anyone looking for a lightweight alternative to heavy video conferencing tools.

---

## 🎥 Demo

<div align="center">

*Add your screenshots or GIF demos here*

| Landing Page | Meeting Interface | History Dashboard |
|:---:|:---:|:---:|
| ![Landing](https://github.com/user-attachments/assets/990c8c56-ae1a-48e5-89c7-a586d11805f6) | ![Meeting](https://github.com/user-attachments/assets/a030da87-6c0e-43bb-b5ce-e1e314e644f2) | ![History](https://github.com/user-attachments/assets/2fc0deab-a821-4608-8ea6-cebfbd137c76) |

</div>

---

## 🎯 Features

<table>
<tr>
<td width="50%">

### Core Functionality
- 🎬 **Instant Meeting Creation** - Start or join meetings in seconds
- 📹 **HD Video & Audio** - Crystal clear communication
- 🔄 **Real-time Signaling** - Powered by Socket.IO
- 💾 **Meeting History** - Track and revisit past meetings
- 🔐 **Secure Authentication** - User accounts with JWT

</td>
<td width="50%">

### Technical Highlights
- ⚡ **Lightweight Architecture** - Fast and responsive
- 📱 **Fully Responsive** - Works on any device
- 🎨 **Modern UI** - Beautiful Material Design interface
- 🔌 **WebRTC Integration** - Direct peer connections
- 🗄️ **MongoDB Backend** - Scalable data storage

</td>
</tr>
</table>

---

## 🛠️ Tech Stack

<div align="center">

### Frontend
![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)
![React Router](https://img.shields.io/badge/React_Router-CA4245?style=flat&logo=react-router&logoColor=white)
![Material-UI](https://img.shields.io/badge/Material--UI-0081CB?style=flat&logo=material-ui&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io_Client-010101?style=flat&logo=socket.io&logoColor=white)
![Axios](https://img.shields.io/badge/Axios-5A29E4?style=flat&logo=axios&logoColor=white)

### Backend
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=flat&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-404D59?style=flat&logo=express&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=flat&logo=socket.io&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=flat&logo=mongodb&logoColor=white)
![Mongoose](https://img.shields.io/badge/Mongoose-880000?style=flat&logo=mongoose&logoColor=white)

### Development
![Nodemon](https://img.shields.io/badge/Nodemon-76D04B?style=flat&logo=nodemon&logoColor=white)
![ES Modules](https://img.shields.io/badge/ES_Modules-F7DF1E?style=flat&logo=javascript&logoColor=black)

</div>

---

## 🏗️ Architecture

```
QuickMeet/
├── 📁 frontend/                # React SPA
│   ├── 📁 src/
│   │   ├── 📁 pages/          # Landing, Auth, Home, VideoMeet, History
│   │   ├── 📁 components/     # Reusable UI components
│   │   └── 📁 utils/          # Helper functions
│   └── package.json
│
└── 📁 backend/                 # Express API Server
    ├── 📁 routes/             # REST API endpoints
    │   └── users.routes.js
    ├── 📁 models/             # MongoDB schemas
    │   ├── user.model.js
    │   └── meeting.model.js
    ├── socketManager.js       # WebSocket signaling
    └── server.js              # Entry point
```

**Data Flow:**
1. 🌐 User authenticates via REST API (JWT)
2. 🔌 Client connects to Socket.IO for real-time signaling
3. 📡 WebRTC handles peer-to-peer video/audio streams
4. 💾 Meeting metadata stored in MongoDB

---

## 🚀 Quick Start

### Prerequisites

Make sure you have these installed:
- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **npm** or **yarn**
- **MongoDB** - [Local](https://www.mongodb.com/try/download/community) or [Atlas](https://www.mongodb.com/cloud/atlas)

### Installation

```bash
# Clone the repository
git clone https://github.com/CodeLeoX16/QuickMeet.git
cd QuickMeet

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Configuration

Create a `.env` file in the `backend/` directory:

```env
# Database
MONGO_URI=mongodb://localhost:27017/quickmeet

# Server
PORT=5000

# Security
JWT_SECRET=your_super_secret_jwt_key_change_this

# Optional: Frontend URL for CORS
FRONTEND_URL=http://localhost:3000
```

Create a `.env` file in the `frontend/` directory (if needed):

```env
REACT_APP_API_URL=http://localhost:5000
```

### Running the Application

**Option 1: Run both services separately**

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm start
```

**Option 2: Use concurrently (if configured)**

```bash
npm run dev
```

The application will be available at:
- 🌐 **Frontend**: http://localhost:3000
- ⚙️ **Backend**: http://localhost:5000

---

## 📚 Documentation

### API Endpoints

#### Authentication
```http
POST /api/users/register    # Create new account
POST /api/users/login        # Login
GET  /api/users/profile      # Get user profile (JWT required)
```

#### Meetings
```http
POST /api/meetings           # Create new meeting
GET  /api/meetings/history   # Get meeting history
```

### Socket Events

**Client → Server**
```javascript
socket.emit('join-room', { roomId, userId })
socket.emit('signal', { roomId, signal, to })
```

**Server → Client**
```javascript
socket.on('user-joined', ({ userId }) => { ... })
socket.on('signal', ({ signal, from }) => { ... })
socket.on('user-left', ({ userId }) => { ... })
```

### Example: Connecting to a Meeting

```javascript
import { io } from 'socket.io-client';

const socket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000');

// Join a room
socket.emit('join-room', { 
  roomId: 'meeting-123', 
  userId: 'user-456' 
});

// Listen for signals
socket.on('signal', async (data) => {
  // Handle WebRTC signaling (offer/answer/ICE)
  console.log('Received signal:', data);
});
```

---

## 🧪 Testing

```bash
# Frontend tests (React Testing Library)
cd frontend
npm test

# Run tests in watch mode
npm test -- --watch

# Generate coverage report
npm test -- --coverage
```

> 📝 **Note**: Backend tests coming soon!

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **🍴 Fork** the repository
2. **🌿 Create** your feature branch
   ```bash
   git checkout -b feat/amazing-feature
   ```
3. **💾 Commit** your changes
   ```bash
   git commit -m 'Add some amazing feature'
   ```
4. **📤 Push** to the branch
   ```bash
   git push origin feat/amazing-feature
   ```
5. **🎉 Open** a Pull Request

### Development Guidelines
- Follow existing code style and conventions
- Add comments for complex logic
- Update documentation for new features
- Include screenshots for UI changes
- Test thoroughly before submitting

### Ideas for Contributions
- [ ] Add screen sharing functionality
- [ ] Implement chat messaging during meetings
- [ ] Add meeting recording feature
- [ ] Create mobile app (React Native)
- [ ] Add end-to-end encryption
- [ ] Implement waiting rooms
- [ ] Add virtual backgrounds
- [ ] Create admin dashboard

---

## 🗺️ Roadmap

- [x] Basic video calling functionality
- [x] User authentication
- [x] Meeting history
- [ ] Screen sharing
- [ ] In-meeting chat
- [ ] Recording capabilities
- [ ] Meeting scheduling
- [ ] Calendar integration
- [ ] Mobile applications
- [ ] AI-powered features (transcription, translation)

---

## 📝 License

This project is licensed under the **ISC License**.

See the backend `package.json` for details, or add a dedicated `LICENSE` file for clarity.

---

## 📧 Contact & Support

<div align="center">

**Created by CodeLeoX16**

[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/CodeLeoX16)

Found a bug? Have a feature request? 
[Open an issue](https://github.com/CodeLeoX16/QuickMeet/issues/new)

⭐ **Star this repo** if you find it useful!

</div>

---

## 🙏 Acknowledgments

- WebRTC community for excellent documentation
- Socket.IO team for the amazing real-time framework
- Material-UI for the beautiful component library
- All contributors who help improve QuickMeet

---

<div align="center">

**Made with ❤️ and ☕**

*Happy Meeting!* 🎉

</div>