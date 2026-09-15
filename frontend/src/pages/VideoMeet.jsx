import React, { useEffect, useRef, useState, useCallback } from 'react'
import io from "socket.io-client";
import { Badge, IconButton, TextField, Avatar, Paper, Box, Typography, Tooltip } from '@mui/material';
import { Button } from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff'
import styles from "../styles/videoComponent.module.css";
import CallEndIcon from '@mui/icons-material/CallEnd'
import MicIcon from '@mui/icons-material/Mic'
import MicOffIcon from '@mui/icons-material/MicOff'
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare'
import ChatIcon from '@mui/icons-material/Chat'
import CloseIcon from '@mui/icons-material/Close'
import VideocamOutlinedIcon from '@mui/icons-material/VideocamOutlined';
import server from '../environment';

const server_url = server;
const connections = {};

const peerConfigConnections = {
    "iceServers": [
        { "urls": "stun:stun.l.google.com:19302" }
    ]
}

export default function VideoMeetComponent() {
    var socketRef = useRef();
    let socketIdRef = useRef();
    let localVideoref = useRef();

    const presenterRef = useRef();
    const lastTapRef = useRef(0);
    const [presenterId, setPresenterId] = useState(null);

    let [videoAvailable, setVideoAvailable] = useState(true);
    let [audioAvailable, setAudioAvailable] = useState(true);

    let [video, setVideo] = useState(true);
    let [audio, setAudio] = useState(true);
    let [screen, setScreen] = useState(false);
    let [showModal, setModal] = useState(false);
    let [screenAvailable, setScreenAvailable] = useState(false);

    let [messages, setMessages] = useState([]);
    let [message, setMessage] = useState("");
    let [newMessages, setNewMessages] = useState(0);

    let [askForUsername, setAskForUsername] = useState(true);
    let [username, setUsername] = useState("");

    const videoRef = useRef([]);
    let [videos, setVideos] = useState([]);

    useEffect(() => {
        if (typeof navigator === 'undefined' || typeof navigator.mediaDevices === 'undefined') {
            setVideoAvailable(false);
            setAudioAvailable(false);
            setScreenAvailable(false);
            return;
        }
        getPermissions();
    }, []);

    useEffect(() => {
        const el = presenterRef.current;
        if (!el) return;
        const stream = presenterId === 'local' ? window.localStream : videos.find(v => v.socketId === presenterId)?.stream;
        if (presenterId && presenterId !== 'local' && !stream) {
            setPresenterId(null);
            return;
        }
        try {
            el.srcObject = stream || null;
            const p = el.play?.();
            if (p && p.catch) p.catch(() => { });
        } catch (e) { }
    }, [presenterId, videos]);

    useEffect(() => () => {
        try { window.localStream?.getTracks().forEach(track => track.stop()); } catch (e) { }
        Object.keys(connections).forEach(id => {
            try { connections[id].close(); } catch (e) { }
            delete connections[id];
        });
        try { socketRef.current?.disconnect(); } catch (e) { }
    }, []);

    const getPermissions = async () => {
        try {
            if (!(navigator?.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function')) {
                setVideoAvailable(false);
                setAudioAvailable(false);
                setScreenAvailable(typeof navigator?.mediaDevices?.getDisplayMedia === 'function');
                return;
            }
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            setVideoAvailable(stream.getVideoTracks().length > 0);
            setAudioAvailable(stream.getAudioTracks().length > 0);
            setScreenAvailable(typeof navigator.mediaDevices?.getDisplayMedia === 'function');
            window.localStream = stream;
            if (localVideoref.current) {
                localVideoref.current.srcObject = stream;
            }
        } catch (error) {
            console.error(error);
        }
    };

    let getMedia = () => {
        setVideo(videoAvailable);
        setAudio(audioAvailable);
        connectToSocketServer();
    }

    const getUserMediaSuccess = useCallback((stream) => {
        try { window.localStream.getTracks().forEach(track => track.stop()) } catch (e) {}
        window.localStream = stream;
        localVideoref.current.srcObject = stream;

        for (let id in connections) {
            if (id === socketIdRef.current) continue;
            try { connections[id].addStream(window.localStream) } catch (e) {}
            connections[id].createOffer().then((description) => {
                connections[id].setLocalDescription(description)
                    .then(() => socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription })))
                    .catch(() => {})
            });
        }
    }, []);

    const getUserMedia = useCallback(() => {
        if ((video && videoAvailable) || (audio && audioAvailable)) {
            if (typeof navigator?.mediaDevices?.getUserMedia === 'function') {
                navigator.mediaDevices.getUserMedia({ video: video, audio: audio })
                    .then(getUserMediaSuccess)
                    .catch((e) => console.log(e))
            }
        } else {
            try {
                let tracks = localVideoref.current.srcObject.getTracks();
                tracks.forEach(track => track.stop());
            } catch (e) {}
        }
    }, [video, audio, videoAvailable, audioAvailable, getUserMediaSuccess]);

    const getDislayMediaSuccess = useCallback((stream) => {
        try { window.localStream.getTracks().forEach(track => track.stop()) } catch (e) {}
        window.localStream = stream;
        localVideoref.current.srcObject = stream;

        for (let id in connections) {
            if (id === socketIdRef.current) continue;
            connections[id].addStream(window.localStream);
            connections[id].createOffer().then((description) => {
                connections[id].setLocalDescription(description)
                    .then(() => socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription })))
                    .catch(e => console.log(e))
            });
        }

        stream.getTracks().forEach(track => track.onended = () => {
            setScreen(false);
            getUserMedia();
        });
    }, [getUserMedia]);

    useEffect(() => {
        if (video !== undefined && audio !== undefined) {
            getUserMedia();
        }
    }, [video, audio, getUserMedia]);

    let gotMessageFromServer = (fromId, message) => {
        let signal;
        try { signal = JSON.parse(message); } catch (e) { return; }

        if (fromId !== socketIdRef.current && connections[fromId]) {
            if (signal.sdp) {
                connections[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(() => {
                    if (signal.sdp.type === 'offer') {
                        connections[fromId].createAnswer().then((description) => {
                            connections[fromId].setLocalDescription(description).then(() => {
                                socketRef.current.emit('signal', fromId, JSON.stringify({ 'sdp': connections[fromId].localDescription }))
                            }).catch(e => console.log(e))
                        }).catch(e => console.log(e))
                    }
                }).catch(e => console.log(e))
            }
            if (signal.ice) {
                connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice)).catch(e => console.log(e))
            }
        }
    }

    let connectToSocketServer = () => {
        socketRef.current = io.connect(server_url, { secure: false });
        socketRef.current.on('signal', gotMessageFromServer);

        socketRef.current.on('connect', () => {
            socketRef.current.emit('join-call', window.location.href);
            socketIdRef.current = socketRef.current.id;

            socketRef.current.on('chat-message', addMessage);

            socketRef.current.on('user-left', (id) => {
                try { connections[id]?.close(); } catch (e) { }
                delete connections[id];
                setVideos((videos) => videos.filter((video) => video.socketId !== id));
                setPresenterId(current => current === id ? null : current);
            });

            socketRef.current.on('user-joined', (id, clients) => {
                clients.forEach((socketListId) => {
                    if (socketListId === socketIdRef.current || connections[socketListId]) return;
                    connections[socketListId] = new RTCPeerConnection(peerConfigConnections);
                    
                    connections[socketListId].onicecandidate = function (event) {
                        if (event.candidate != null) {
                            socketRef.current?.emit('signal', socketListId, JSON.stringify({ 'ice': event.candidate }))
                        }
                    }

                    connections[socketListId].onaddstream = (event) => {
                        let videoExists = videoRef.current.find(video => video.socketId === socketListId);
                        if (videoExists) {
                            setVideos(videos => {
                                const updatedVideos = videos.map(video =>
                                    video.socketId === socketListId ? { ...video, stream: event.stream } : video
                                );
                                videoRef.current = updatedVideos;
                                return updatedVideos;
                            });
                        } else {
                            let newVideo = {
                                socketId: socketListId,
                                stream: event.stream,
                                autoplay: true,
                                playsinline: true
                            };
                            setVideos(videos => {
                                const updatedVideos = [...videos, newVideo];
                                videoRef.current = updatedVideos;
                                return updatedVideos;
                            });
                        }
                    };

                    if (window.localStream) {
                        try { connections[socketListId].addStream(window.localStream) } catch (e) { }
                    }
                })

                if (id === socketIdRef.current) {
                    for (let id2 in connections) {
                        if (id2 === socketIdRef.current) continue;
                        try { connections[id2].addStream(window.localStream) } catch (e) { }
                        connections[id2].createOffer().then((description) => {
                            connections[id2].setLocalDescription(description)
                                .then(() => socketRef.current.emit('signal', id2, JSON.stringify({ 'sdp': connections[id2].localDescription })))
                                .catch(e => console.log(e))
                        });
                    }
                }
            })
        })
    }

    let handleVideo = () => { setVideo(!video); }
    let handleAudio = () => { setAudio(!audio); }

    const handleTouchTap = (id) => {
        const now = Date.now();
        if (now - lastTapRef.current < 300) {
            setPresenterId(prev => prev === id ? null : id);
        }
        lastTapRef.current = now;
    };

    useEffect(() => {
        if (screen !== undefined && screen) {
            if (typeof navigator?.mediaDevices?.getDisplayMedia === 'function') {
                navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
                    .then(getDislayMediaSuccess)
                    .catch((e) => console.log(e))
            }
        }
    }, [screen, getDislayMediaSuccess]);

    let handleScreen = () => { setScreen(!screen); }

    let handleEndCall = () => {
        try {
            let tracks = localVideoref.current.srcObject.getTracks();
            tracks.forEach(track => track.stop());
        } catch (e) { }
        window.location.href = "/home";
    }

    const addMessage = (data, sender, socketIdSender) => {
        setMessages((prevMessages) => [...prevMessages, { sender, data }]);
        if (socketIdSender !== socketIdRef.current) {
            setNewMessages((prev) => prev + 1);
        }
    };

    let sendMessage = () => {
        const msg = (message || "").trim();
        if (!msg) return;
        setMessage("");
        if (socketRef.current && typeof socketRef.current.emit === 'function') {
            socketRef.current.emit('chat-message', msg, username);
        }
    }

    let connect = () => {
        if (!username.trim()) return;
        setAskForUsername(false);
        getMedia();
    }

    return (
        <Box sx={{ width: '100vw', height: '100vh', backgroundColor: '#0b0f19', overflow: 'hidden', position: 'relative' }}>

            {askForUsername === true ? (
                // Pre-Join Lobby View
                <Box sx={{ 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', 
                    background: 'radial-gradient(circle at center, #1e1b4b 0%, #0b0f19 100%)', p: 3 
                }}>
                    <Paper elevation={24} sx={{ 
                        p: 5, display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: 450, width: '100%', 
                        borderRadius: 4, backgroundColor: 'rgba(17, 24, 39, 0.85)', backdropFilter: 'blur(16px)',
                        border: '1px solid rgba(255,255,255,0.08)', color: '#fff', boxShadow: '0 25px 50px rgba(0,0,0,0.7)' 
                    }}>
                        <Box sx={{ width: 64, height: 64, borderRadius: '50%', backgroundColor: 'rgba(255, 152, 57, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2, color: '#ff9839' }}>
                            <VideocamOutlinedIcon fontSize="large" />
                        </Box>
                        
                        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>Ready to join?</Typography>
                        <Typography variant="body2" sx={{ color: '#94a3b8', mb: 3, textAlign: 'center' }}>Check your camera and enter your name to start.</Typography>

                        <Box sx={{ width: '100%', height: 220, backgroundColor: '#000', borderRadius: 3, overflow: 'hidden', mb: 3, border: '1px solid rgba(255,255,255,0.08)' }}>
                            <video ref={localVideoref} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}></video>
                        </Box>

                        <TextField 
                            label="Your Name" value={username} onChange={e => setUsername(e.target.value)} variant="outlined" fullWidth size="medium"
                            onKeyDown={e => { if (e.key === "Enter") connect(); }}
                            sx={{ 
                                mb: 3,
                                '& .MuiOutlinedInput-root': { color: '#fff', borderRadius: '12px', '& fieldset': { borderColor: 'rgba(255,255,255,0.15)' }, '&:hover fieldset': { borderColor: '#ff9839' }, '&.Mui-focused fieldset': { borderColor: '#ff9839' } },
                                '& .MuiInputLabel-root': { color: '#94a3b8' }, '& .MuiInputLabel-root.Mui-focused': { color: '#ff9839' }
                            }} 
                        />

                        <Button 
                            variant="contained" onClick={connect} disabled={!username.trim()} size="large" fullWidth
                            sx={{ py: 1.5, borderRadius: '12px', textTransform: 'none', fontWeight: 700, fontSize: '1rem', background: 'linear-gradient(135deg, #ff9839 0%, #ffad52 100%)', color: '#000', '&:hover': { background: 'linear-gradient(135deg, #ffad52 0%, #ff9839 100%)' } }}
                        >
                            Join Room
                        </Button>
                    </Paper>
                </Box>
            ) : (
                // Active Full-Screen Video Call Layout (WhatsApp / Meet Style)
                <Box sx={{ width: '100vw', height: '100vh', position: 'relative', display: 'flex' }}>

                    {/* Main Video Stage */}
                    <Box sx={{ flex: 1, height: '100%', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2, boxSizing: 'border-box' }}>
                        
                        {videos.length === 0 ? (
                            // Waiting State for Single User
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', gap: 2 }}>
                                <Typography variant="h6" sx={{ fontWeight: 600 }}>Waiting for others to join...</Typography>
                                <Typography variant="body2" sx={{ opacity: 0.7 }}>Share your meeting code with participants.</Typography>
                            </Box>
                        ) : (
                            // Dynamic Grid for Remote Participants
                            <Box sx={{
                                width: '100%', height: '100%',
                                display: 'grid',
                                gridTemplateColumns: videos.length === 1 ? '1fr' : videos.length <= 4 ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
                                gap: '16px',
                                alignItems: 'center',
                                justifyItems: 'center',
                                maxH: 'calc(100vh - 100px)'
                            }}>
                                {videos.map((vid) => (
                                    <Box key={vid.socketId} 
                                        onDoubleClick={() => setPresenterId(vid.socketId)}
                                        onTouchStart={() => handleTouchTap(vid.socketId)}
                                        sx={{ 
                                            width: '100%', height: '100%', maxHeight: 'calc(100vh - 120px)', 
                                            backgroundColor: '#111827', borderRadius: '20px', overflow: 'hidden', 
                                            position: 'relative', boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                                            border: '1px solid rgba(255,255,255,0.08)'
                                        }}>
                                        <video
                                            ref={ref => { if (ref && vid.stream) ref.srcObject = vid.stream; }}
                                            autoPlay playsInline
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                    </Box>
                                ))}
                            </Box>
                        )}

                        {/* PiP Local Video (Bottom-Right Floating Thumbnail) */}
                        <Box sx={{
                            position: 'absolute', bottom: 100, right: 24, width: 200, height: 130, 
                            backgroundColor: '#000', borderRadius: '16px', overflow: 'hidden', 
                            border: '2px solid rgba(255,255,255,0.15)', boxShadow: '0 10px 25px rgba(0,0,0,0.6)',
                            zIndex: 40
                        }}>
                            <video
                                ref={localVideoref}
                                autoPlay muted playsInline
                                style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
                            />
                        </Box>
                    </Box>

                    {/* Floating WhatsApp-Style Bottom Control Dock */}
                    <Box sx={{
                        position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
                        display: 'flex', alignItems: 'center', gap: 1.5,
                        backgroundColor: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(16px)',
                        border: '1px solid rgba(255,255,255,0.1)', padding: '10px 24px',
                        borderRadius: '9999px', boxShadow: '0 15px 35px rgba(0,0,0,0.6)', zIndex: 90
                    }}>
                        <Tooltip title={video ? "Turn off camera" : "Turn on camera"}>
                            <IconButton onClick={handleVideo} sx={{ color: "white", backgroundColor: video ? 'rgba(255,255,255,0.08)' : '#ef4444', '&:hover': { backgroundColor: video ? 'rgba(255,255,255,0.15)' : '#dc2626' }, p: 1.5 }}>
                                {video ? <VideocamIcon fontSize="small" /> : <VideocamOffIcon fontSize="small" />}
                            </IconButton>
                        </Tooltip>

                        <Tooltip title={audio ? "Mute microphone" : "Unmute microphone"}>
                            <IconButton onClick={handleAudio} sx={{ color: "white", backgroundColor: audio ? 'rgba(255,255,255,0.08)' : '#ef4444', '&:hover': { backgroundColor: audio ? 'rgba(255,255,255,0.15)' : '#dc2626' }, p: 1.5 }}>
                                {audio ? <MicIcon fontSize="small" /> : <MicOffIcon fontSize="small" />}
                            </IconButton>
                        </Tooltip>

                        {screenAvailable && (
                            <Tooltip title={screen ? "Stop sharing" : "Share screen"}>
                                <IconButton onClick={handleScreen} sx={{ color: "white", backgroundColor: screen ? '#ff9839' : 'rgba(255,255,255,0.08)', '&:hover': { backgroundColor: screen ? '#e8872e' : 'rgba(255,255,255,0.15)' }, p: 1.5 }}>
                                    {screen ? <StopScreenShareIcon fontSize="small" /> : <ScreenShareIcon fontSize="small" />}
                                </IconButton>
                            </Tooltip>
                        )}

                        <Tooltip title="Chat">
                            <Badge badgeContent={newMessages} max={999} color='primary' sx={{ '& .MuiBadge-badge': { backgroundColor: '#ff9839', color: '#000', fontWeight: 700 } }}>
                                <IconButton onClick={() => { setModal(!showModal); setNewMessages(0); }} sx={{ color: "white", backgroundColor: showModal ? '#ff9839' : 'rgba(255,255,255,0.08)', '&:hover': { backgroundColor: showModal ? '#e8872e' : 'rgba(255,255,255,0.15)' }, p: 1.5 }}>
                                    <ChatIcon fontSize="small" />
                                </IconButton>
                            </Badge>
                        </Tooltip>

                        <Tooltip title="End call">
                            <IconButton onClick={handleEndCall} sx={{ color: "white", backgroundColor: "#dc2626", '&:hover': { backgroundColor: '#b91c1c' }, p: 1.5, ml: 1 }}>
                                <CallEndIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Box>

                    {/* Floating Slide-over Chat Drawer */}
                    {showModal && (
                        <Box sx={{
                            position: "absolute", right: 20, top: 20, bottom: 90, width: 360,
                            display: "flex", flexDirection: "column", borderRadius: 4, overflow: "hidden",
                            background: "rgba(15, 23, 42, 0.95)", backdropFilter: 'blur(16px)',
                            border: '1px solid rgba(255,255,255,0.08)', boxShadow: "0 20px 50px rgba(0,0,0,0.7)",
                            color: "#fff", zIndex: 100
                        }}>
                            <Box sx={{ p: 2, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Meeting Chat</Typography>
                                <IconButton size="small" onClick={() => setModal(false)} sx={{ color: "#94a3b8", '&:hover': { color: '#fff' } }}>
                                    <CloseIcon fontSize="small" />
                                </IconButton>
                            </Box>

                            <Box sx={{ p: 2, overflowY: "auto", flex: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                {messages.length === 0 ? (
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                        <Typography variant="body2" sx={{ opacity: 0.5 }}>No messages yet</Typography>
                                    </Box>
                                ) : (
                                    messages.map((item, index) => (
                                        <div key={index} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', flexDirection: item.sender === username ? 'row-reverse' : 'row' }}>
                                            <Avatar sx={{ width: 32, height: 32, fontSize: '0.85rem', bgcolor: item.sender === username ? '#ff9839' : '#3b82f6', color: item.sender === username ? '#000' : '#fff' }}>{item.sender?.[0]?.toUpperCase() || "?"}</Avatar>
                                            <div style={{ background: item.sender === username ? 'rgba(255, 152, 57, 0.15)' : 'rgba(255,255,255,0.05)', border: item.sender === username ? '1px solid rgba(255, 152, 57, 0.3)' : '1px solid rgba(255,255,255,0.04)', padding: '8px 12px', borderRadius: '12px', maxWidth: '75%' }}>
                                                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '2px' }}>{item.sender}</div>
                                                <div style={{ fontSize: '0.9rem', wordBreak: 'break-word' }}>{item.data}</div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </Box>

                            <Box sx={{ p: 2, borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: 1, backgroundColor: 'rgba(0,0,0,0.3)' }}>
                                <TextField
                                    value={message} onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Type a message..." fullWidth size="small" variant="outlined"
                                    onKeyDown={e => { if (e.key === "Enter") sendMessage(); }}
                                    sx={{
                                        '& .MuiOutlinedInput-root': { background: 'rgba(255,255,255,0.03)', borderRadius: '10px', color: '#fff', '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' }, '&:hover fieldset': { borderColor: '#ff9839' }, '&.Mui-focused fieldset': { borderColor: '#ff9839' } },
                                        '& .MuiInputBase-input::placeholder': { color: 'rgba(255,255,255,0.4)' }
                                    }}
                                />
                                <Button variant="contained" onClick={sendMessage} sx={{ background: "#ff9839", color: '#000', fontWeight: 700, borderRadius: '10px', textTransform: 'none', px: 2, '&:hover': { background: '#ffad52' } }}>Send</Button>
                            </Box>
                        </Box>
                    )}

                    {/* Spotlight / Presenter Modal Overlay */}
                    {presenterId && (
                        <div onClick={() => setPresenterId(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", backdropFilter: 'blur(10px)', display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000, padding: 20 }}>
                            <div onClick={(e) => e.stopPropagation()} style={{ position: "relative", width: "90%", maxWidth: 1100, borderRadius: 20, overflow: "hidden", background: "#000", border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 60px rgba(0,0,0,0.9)' }}>
                                <video ref={presenterRef} autoPlay playsInline controls={false} style={{ width: "100%", height: "100%", maxHeight: '80vh', objectFit: "contain", display: "block", background: "#000" }} />
                                <IconButton onClick={() => setPresenterId(null)} style={{ position: "absolute", right: 12, top: 12, color: "#fff", background: "rgba(0,0,0,0.6)" }}>
                                    <CloseIcon />
                                </IconButton>
                            </div>
                        </div>
                    )}
                </Box>
            )}
        </Box>
    );
}