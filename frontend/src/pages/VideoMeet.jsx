import React, { useEffect, useRef, useState, useCallback } from 'react';
import io from "socket.io-client";
import {
    Badge,
    IconButton,
    TextField,
    Button,
    Tooltip,
    Card,
    CardContent,
    Typography,
    CircularProgress,
    Avatar
} from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import CallEndIcon from '@mui/icons-material/CallEnd';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare';
import ChatIcon from '@mui/icons-material/Chat';
import CloseIcon from '@mui/icons-material/Close';
import server from '../environment';

const server_url = server;
var connections = {};
const peerConfigConnections = {
    "iceServers": [{ "urls": "stun:stun.l.google.com:19302" }]
};

export default function VideoMeetComponent() {
    const socketRef = useRef();
    const socketIdRef = useRef();
    const localVideoref = useRef();

    const [videoAvailable, setVideoAvailable] = useState(true);
    const [audioAvailable, setAudioAvailable] = useState(true);
    const [video, setVideo] = useState(false);
    const [audio, setAudio] = useState(false);
    const [screen, setScreen] = useState(false);
    const [showChat, setShowChat] = useState(false);
    const [screenAvailable, setScreenAvailable] = useState(false);
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState("");
    const [newMessages, setNewMessages] = useState(0);
    const [askForUsername, setAskForUsername] = useState(true);
    const [username, setUsername] = useState("");
    const videoRef = useRef([]);
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const chatScrollRef = useRef();
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 700);

    // Presenter / fullscreen feature
    const [presenterId, setPresenterId] = useState(null);
    const handlePresenter = (socketId) => {
        setPresenterId(prev => prev === socketId ? null : socketId);
    };
    const presenterVideo = presenterId
        ? (presenterId === socketIdRef.current
            ? { socketId: socketIdRef.current, stream: window.localStream, username }
            : videos.find(v => v.socketId === presenterId))
        : null;

    useEffect(() => {
        const onResize = () => setIsMobile(window.innerWidth <= 700);
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    // helper to safely attach a MediaStream to a <video> element and start playback
    const attachStream = (el, stream) => {
        if (!el) return;
        try {
            if (el.srcObject !== stream) {
                el.srcObject = stream || null;
            }
            const p = el.play?.();
            if (p && p.catch) p.catch(() => { /* ignore autoplay errors */ });
        } catch (e) {
            /* ignore attach errors */
        }
    };

    const getPermissions = useCallback(async () => {
        try {
            const videoPermission = await navigator.mediaDevices.getUserMedia({ video: true }).catch(() => null);
            const audioPermission = await navigator.mediaDevices.getUserMedia({ audio: true }).catch(() => null);
            setVideoAvailable(!!videoPermission);
            setAudioAvailable(!!audioPermission);
            setScreenAvailable(!!navigator.mediaDevices.getDisplayMedia);
            if (videoPermission || audioPermission) {
                const userMediaStream = await navigator.mediaDevices.getUserMedia({ video: !!videoPermission, audio: !!audioPermission });
                window.localStream = userMediaStream;
                if (localVideoref.current) attachStream(localVideoref.current, userMediaStream);
                setLoading(false);
            } else setLoading(false);
        } catch (error) {
            setLoading(false);
            console.log(error);
        }
    }, []);

    useEffect(() => {
        // capture localVideoref for cleanup to avoid stale ref lint warning
        getPermissions();
        return () => {
            const localVideoEl = localVideoref.current;
            try { socketRef.current?.disconnect(); } catch (e) { }
            for (let id in connections) { try { connections[id].close(); } catch (e) { } }
            try {
                if (localVideoEl?.srcObject) {
                    localVideoEl.srcObject.getTracks().forEach(t => t.stop());
                }
                if (window.screenStream) window.screenStream.getTracks().forEach(t => t.stop());
            } catch (e) { }
        };
    }, [getPermissions]);

    useEffect(() => {
        // auto-scroll chat to bottom
        if (chatScrollRef.current) {
            chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
        }
    }, [messages, showChat]);

    useEffect(() => {
        if (video !== undefined && audio !== undefined) getUserMedia();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [video, audio]);

    const getMedia = () => {
        setVideo(videoAvailable);
        setAudio(audioAvailable);
        connectToSocketServer();
    };

    const getUserMediaSuccess = (stream) => {
        try { window.localStream?.getTracks().forEach(track => track.stop()); } catch (e) { }
        window.localStream = stream;
        if (localVideoref.current) attachStream(localVideoref.current, stream);

        for (let id in connections) {
            if (id === socketIdRef.current) continue;
            try {
                connections[id].addStream(window.localStream);
                connections[id].createOffer().then((description) => {
                    connections[id].setLocalDescription(description).then(() => {
                        socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }));
                    });
                });
            } catch (e) { console.warn(e); }
        }

        stream.getTracks().forEach(track => track.onended = () => {
            try { localVideoref.current.srcObject.getTracks().forEach(t => t.stop()); } catch (e) { }
            let blackSilence = (...args) => new MediaStream([black(...args), silence()]);
            window.localStream = blackSilence();
            if (localVideoref.current) attachStream(localVideoref.current, window.localStream);
            for (let id in connections) {
                try {
                    connections[id].addStream(window.localStream);
                    connections[id].createOffer().then((description) => {
                        connections[id].setLocalDescription(description).then(() => {
                            socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }));
                        });
                    });
                } catch (e) { }
            }
        });
    };

    const getUserMedia = () => {
        if ((video && videoAvailable) || (audio && audioAvailable)) {
            navigator.mediaDevices.getUserMedia({ video: video, audio: audio })
                .then(getUserMediaSuccess)
                .catch((e) => console.log(e));
        } else {
            try {
                if (localVideoref.current?.srcObject) {
                    localVideoref.current.srcObject.getTracks().forEach(track => track.stop());
                    localVideoref.current.srcObject = null;
                }
            } catch (e) { }
        }
    };

    const gotMessageFromServer = (fromId, message) => {
        var signal = JSON.parse(message);
        if (fromId !== socketIdRef.current) {
            if (signal.sdp) {
                connections[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(() => {
                    if (signal.sdp.type === 'offer') {
                        connections[fromId].createAnswer().then((description) => {
                            connections[fromId].setLocalDescription(description).then(() => {
                                socketRef.current.emit('signal', fromId, JSON.stringify({ 'sdp': connections[fromId].localDescription }));
                            });
                        });
                    }
                });
            }
            if (signal.ice) {
                connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice));
            }
        }
    };

    const connectToSocketServer = () => {
        socketRef.current = io.connect(server_url, { secure: false });
        socketRef.current.on('signal', gotMessageFromServer);
        socketRef.current.on('connect', () => {
            socketRef.current.emit('join-call', window.location.href);
            socketIdRef.current = socketRef.current.id;
            socketRef.current.on('chat-message', addMessage);
            socketRef.current.on('user-left', (id) => {
                setVideos((videos) => videos.filter((video) => video.socketId !== id));
                // if presenter left, clear presenter
                if (presenterId === id) setPresenterId(null);
            });
            socketRef.current.on('user-joined', (id, clients) => {
                clients.forEach((socketListId) => {
                    connections[socketListId] = new RTCPeerConnection(peerConfigConnections);
                    connections[socketListId].onicecandidate = function (event) {
                        if (event.candidate != null) {
                            socketRef.current.emit('signal', socketListId, JSON.stringify({ 'ice': event.candidate }));
                        }
                    };
                    connections[socketListId].onaddstream = (event) => {
                        // detect if incoming stream is a screen-share (best-effort)
                        const vt = event.stream.getVideoTracks()[0];
                        const settings = vt && vt.getSettings ? vt.getSettings() : {};
                        const isScreenShare = !!(settings.displaySurface && (settings.displaySurface === 'monitor' || settings.displaySurface === 'window'))
                            || (vt && /screen|window/i.test(vt.label || ''));

                        let videoExists = videoRef.current.find(video => video.socketId === socketListId);
                        if (videoExists) {
                            setVideos(videos => {
                                const updatedVideos = videos.map(video =>
                                    video.socketId === socketListId ? { ...video, stream: event.stream, isScreenShare } : video
                                );
                                videoRef.current = updatedVideos;
                                return updatedVideos;
                            });
                        } else {
                            let newVideo = {
                                socketId: socketListId,
                                stream: event.stream,
                                autoplay: true,
                                playsinline: true,
                                username: "Participant",
                                isScreenShare
                            };
                            setVideos(videos => {
                                // keep screen-shares at the front so layout can prioritize them
                                const updatedVideos = isScreenShare ? [newVideo, ...videos] : [...videos, newVideo];
                                videoRef.current = updatedVideos;
                                return updatedVideos;
                            });
                        }
                    };
                    if (window.localStream !== undefined && window.localStream !== null) {
                        try { connections[socketListId].addStream(window.localStream); } catch (e) { }
                    } else {
                        let blackSilence = (...args) => new MediaStream([black(...args), silence()]);
                        window.localStream = blackSilence();
                        connections[socketListId].addStream(window.localStream);
                    }
                });
                if (id === socketIdRef.current) {
                    for (let id2 in connections) {
                        if (id2 === socketIdRef.current) continue;
                        try { connections[id2].addStream(window.localStream); } catch (e) { }
                        connections[id2].createOffer().then((description) => {
                            connections[id2].setLocalDescription(description).then(() => {
                                socketRef.current.emit('signal', id2, JSON.stringify({ 'sdp': connections[id2].localDescription }));
                            });
                        });
                    }
                }
            });
        });
    };

    const silence = () => {
        let ctx = new AudioContext();
        let oscillator = ctx.createOscillator();
        let dst = oscillator.connect(ctx.createMediaStreamDestination());
        oscillator.start();
        ctx.resume();
        return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false });
    };
    const black = ({ width = 640, height = 480 } = {}) => {
        let canvas = Object.assign(document.createElement("canvas"), { width, height });
        canvas.getContext('2d').fillRect(0, 0, width, height);
        let stream = canvas.captureStream();
        return Object.assign(stream.getVideoTracks()[0], { enabled: false });
    };

    const handleVideo = () => {
        setVideo(prev => {
            const next = !prev;
            try { if (window.localStream) window.localStream.getVideoTracks().forEach(t => t.enabled = next); } catch (e) { }
            return next;
        });
    };
    const handleAudio = () => {
        setAudio(prev => {
            const next = !prev;
            try { if (window.localStream) window.localStream.getAudioTracks().forEach(t => t.enabled = next); } catch (e) { }
            return next;
        });
    };

    useEffect(() => {
        if (screen !== undefined) getDisplayMedia();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [screen]);

    const handleScreen = () => setScreen(prev => !prev);

    const getDisplayMedia = async () => {
        if (!screen) {
            if (window.screenStream) { window.screenStream.getTracks().forEach(t => t.stop()); delete window.screenStream; }
            getUserMedia();
            return;
        }
        try {
            const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
            window.screenStream = screenStream;
            const audioTracks = window.localStream?.getAudioTracks() || [];
            const combined = new MediaStream([...screenStream.getVideoTracks(), ...audioTracks]);
            try { window.localStream?.getTracks().forEach(t => t.stop()); } catch (e) { }
            window.localStream = combined;
            if (localVideoref.current) attachStream(localVideoref.current, combined);
            for (let id in connections) {
                try {
                    connections[id].addStream(window.localStream);
                    connections[id].createOffer().then((description) => {
                        connections[id].setLocalDescription(description).then(() => {
                            socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }));
                        });
                    });
                } catch (e) { }
            }
            screenStream.getVideoTracks()[0].onended = () => { setScreen(false); };
        } catch (e) {
            console.error("Screen share failed", e);
            setScreen(false);
        }
    };

    const handleEndCall = () => {
        try { localVideoref.current.srcObject.getTracks().forEach(track => track.stop()); } catch (e) { }
        window.location.href = "/";
    };

    const openChat = () => {
        setShowChat(true);
        setNewMessages(0);
    };
    const closeChat = () => setShowChat(false);
    const handleMessage = (e) => setMessage(e.target.value);

    const addMessage = (data, sender, socketIdSender) => {
        setMessages((prevMessages) => [...prevMessages, { sender: sender, data: data }]);
        if (socketIdSender !== socketIdRef.current) setNewMessages((prev) => prev + 1);
    };

    const sendMessage = () => {
        if (message.trim()) {
            socketRef.current.emit('chat-message', message, username);
            setMessage("");
        }
    };

    const connect = () => {
        setAskForUsername(false);
        getMedia();
    };

    // small inline style snippets for predictable layout even if CSS module missing
    const layoutStyles = {
        container: { display: "flex", height: "100vh", background: "#0f1724", color: "#fff", flexDirection: "column" },
        main: { display: "flex", flex: 1, position: "relative", padding: isMobile ? 8 : 12, gap: isMobile ? 8 : 12 },
        conference: { display: "grid", gridTemplateColumns: showChat && !isMobile ? "1fr 320px" : "1fr", flex: 1, gap: 12, width: "100%" },
        videoStage: { display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12, alignContent: "start", padding: isMobile ? 6 : 12 },
        largeLocal: { borderRadius: 8, width: "100%", height: isMobile ? "48vh" : 0, paddingBottom: isMobile ? 0 : "56%", background: "#000", position: "relative", overflow: "hidden" },
        smallVideo: { borderRadius: 8, width: "100%", height: isMobile ? 120 : 160, background: "#000", overflow: "hidden" },
        controls: {
            position: "fixed",
            left: "50%",
            transform: "translateX(-50%)",
            bottom: isMobile ? 12 : 20,
            background: "rgba(17,24,39,0.9)",
            padding: isMobile ? 6 : 8,
            borderRadius: 999,
            display: "flex",
            gap: isMobile ? 6 : 8,
            alignItems: "center",
            zIndex: 60,
            boxShadow: "0 8px 30px rgba(2,6,23,0.6)"
        },
        chatDrawer: isMobile
            ? { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "#071126", zIndex: 70, display: "flex", flexDirection: "column" }
            : { width: 320, background: "#0b1220", borderLeft: "1px solid rgba(255,255,255,0.04)", display: "flex", flexDirection: "column", height: "100%" },
        chatHeader: { padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.03)" },
        chatMessages: { padding: 12, overflowY: "auto", flex: 1 },
        chatInputWrap: { padding: 12, borderTop: "1px solid rgba(255,255,255,0.03)", display: "flex", gap: 8 }
    };

    // compute responsive layout depending on presence of a screen-share
    const screenSharePresent = videos.some(v => v.isScreenShare) || screen;
    const videoStageStyle = screenSharePresent
        ? (isMobile
            ? { display: "flex", flexDirection: "column", gap: 12, padding: 8 }
            : { display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12, alignContent: "start", padding: 12 })
        : layoutStyles.videoStage;

    return (
        <div style={layoutStyles.container}>
            <header style={{ padding: isMobile ? 8 : 12, borderBottom: "1px solid rgba(255,255,255,0.03)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="h6" style={{ color: "#fff", fontWeight: 700 }}>QuickMeet</Typography>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <Typography variant="body2" style={{ opacity: 0.8 }}>{username || "Guest"}</Typography>
                </div>
            </header>

            <div style={layoutStyles.main}>
                {askForUsername ? (
                    <div style={{ margin: "auto", width: isMobile ? "95%" : 480 }}>
                        <Card elevation={8}>
                            <CardContent>
                                <Typography variant="h6">Enter Lobby</Typography>
                                <TextField label="Username" value={username} onChange={e => setUsername(e.target.value)} fullWidth style={{ marginTop: 12 }} />
                                <Button variant="contained" onClick={connect} fullWidth style={{ marginTop: 12 }}>Join</Button>
                                <div style={{ marginTop: 18, textAlign: "center" }}>
                                    {loading ? <CircularProgress /> : <video ref={el => attachStream(el, window.localStream)} autoPlay muted style={{ width: "100%", borderRadius: 8 }} />}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                ) : (
                    <div style={layoutStyles.conference}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            <div style={videoStageStyle}>
                                {/* Presenter fullscreen view */}
                                {presenterVideo ? (
                                    <div style={{
                                        borderRadius: 8,
                                        overflow: "hidden",
                                        position: "relative",
                                        background: "#000",
                                        width: "100%",
                                        height: isMobile ? "60vh" : "80vh",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center"
                                    }}>
                                        <video
                                            ref={el => attachStream(el, presenterVideo.stream)}
                                            autoPlay
                                            playsInline
                                            style={{
                                                width: "100%",
                                                height: "100%",
                                                objectFit: "contain",
                                                background: "#000"
                                            }}
                                        />
                                        <div style={{
                                            position: "absolute",
                                            left: 12,
                                            bottom: 12,
                                            background: "rgba(0,0,0,0.45)",
                                            padding: "6px 10px",
                                            borderRadius: 6,
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 8
                                        }}>
                                            <Typography variant="subtitle2" style={{ color: "#fff" }}>
                                                {presenterVideo.username || "Presenter"}
                                            </Typography>
                                            <Button
                                                size="small"
                                                variant="contained"
                                                style={{ marginLeft: 8, background: "#1976d2" }}
                                                onClick={() => setPresenterId(null)}
                                            >
                                                Exit Fullscreen
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div
                                            style={layoutStyles.largeLocal}
                                            onDoubleClick={() => handlePresenter(socketIdRef.current)}
                                            title="Double-click to fullscreen"
                                        >
                                            <video
                                                ref={el => attachStream(el, window.localStream)}
                                                muted
                                                playsInline
                                                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                                            />
                                            <div style={{
                                                position: "absolute",
                                                left: 12,
                                                bottom: 12,
                                                background: "rgba(0,0,0,0.45)",
                                                padding: "6px 10px",
                                                borderRadius: 6
                                            }}>
                                                <Typography variant="subtitle2" style={{ color: "#fff" }}>{username || "You"}</Typography>
                                            </div>
                                        </div>

                                        <div style={{ display: "grid", gap: 12, gridTemplateColumns: isMobile ? "repeat(auto-fill,minmax(140px,1fr))" : "1fr" }}>
                                            {videos.slice(0, 4).map(v => (
                                                <div
                                                    key={v.socketId}
                                                    style={layoutStyles.smallVideo}
                                                    onDoubleClick={() => handlePresenter(v.socketId)}
                                                    title="Double-click to fullscreen"
                                                >
                                                    <video ref={el => attachStream(el, v.stream)} autoPlay playsInline style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                                                    <div style={{ position: "absolute", left: 12, bottom: 12, background: "rgba(0,0,0,0.45)", padding: "6px 10px", borderRadius: 6 }}>
                                                        <Typography variant="caption">{v.username || "Participant"}</Typography>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Additional grid for more participants */}
                            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(auto-fill,minmax(140px,1fr))" : "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
                                {videos.slice(4).map(v => (
                                    <div key={v.socketId} style={{ height: isMobile ? 120 : 160, borderRadius: 8, overflow: "hidden", background: "#000", position: "relative" }}>
                                        <video ref={el => attachStream(el, v.stream)} autoPlay playsInline style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Chat Drawer */}
                        {showChat && (
                            <div style={layoutStyles.chatDrawer}>
                                <div style={layoutStyles.chatHeader}>
                                    <Typography variant="subtitle1">Meeting Chat</Typography>
                                    <IconButton size="small" onClick={closeChat} style={{ color: "#fff" }}>
                                        <CloseIcon fontSize="small" />
                                    </IconButton>
                                </div>
                                <div style={layoutStyles.chatMessages} ref={chatScrollRef}>
                                    {messages.length === 0 ? (
                                        <Typography variant="body2" style={{ opacity: 0.7 }}>No messages yet</Typography>
                                    ) : (
                                        messages.map((m, i) => (
                                            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                                                <Avatar style={{ width: 36, height: 36, background: "#1976d2" }}>{m.sender?.[0]?.toUpperCase() || "?"}</Avatar>
                                                <div>
                                                    <Typography variant="caption" style={{ fontWeight: 700 }}>{m.sender}</Typography>
                                                    <Typography variant="body2" style={{ wordBreak: "break-word" }}>{m.data}</Typography>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                                <div style={layoutStyles.chatInputWrap}>
                                    <TextField value={message} onChange={handleMessage} placeholder="Say something..." fullWidth size="small" onKeyDown={e => { if (e.key === "Enter") sendMessage(); }} />
                                    <Button variant="contained" onClick={sendMessage}>Send</Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Controls */}
            {!askForUsername && (
                <div style={layoutStyles.controls}>
                    <Tooltip title={video ? "Turn off video" : "Turn on video"}>
                        <IconButton onClick={handleVideo} style={{ color: "#fff", width: isMobile ? 44 : undefined, height: isMobile ? 44 : undefined }}>
                            {video ? <VideocamIcon /> : <VideocamOffIcon />}
                        </IconButton>
                    </Tooltip>

                    <Tooltip title={audio ? "Mute" : "Unmute"}>
                        <IconButton onClick={handleAudio} style={{ color: "#fff", width: isMobile ? 44 : undefined, height: isMobile ? 44 : undefined }}>
                            {audio ? <MicIcon /> : <MicOffIcon />}
                        </IconButton>
                    </Tooltip>

                    {screenAvailable && (
                        <Tooltip title={screen ? "Stop screen" : "Share screen"}>
                            <IconButton onClick={handleScreen} style={{ color: screen ? "#f59e0b" : "#fff", width: isMobile ? 44 : undefined, height: isMobile ? 44 : undefined }}>
                                {screen ? <StopScreenShareIcon /> : <ScreenShareIcon />}
                            </IconButton>
                        </Tooltip>
                    )}

                    <Tooltip title="End call">
                        <IconButton onClick={handleEndCall} style={{ color: "#fff", background: "#ef4444", width: isMobile ? 52 : undefined, height: isMobile ? 52 : undefined }}>
                            <CallEndIcon />
                        </IconButton>
                    </Tooltip>

                    <Badge badgeContent={newMessages} color="warning" max={999}>
                        <Tooltip title="Open chat">
                            <IconButton onClick={openChat} style={{ color: "#fff", width: isMobile ? 44 : undefined, height: isMobile ? 44 : undefined }}>
                                <ChatIcon />
                            </IconButton>
                        </Tooltip>
                    </Badge>
                </div>
            )}

            <footer style={{ padding: 10, textAlign: "center", borderTop: "1px solid rgba(255,255,255,0.02)" }}>
                <Typography variant="caption">© {new Date().getFullYear()} QuickMeet</Typography>
            </footer>
        </div>
    );
}
