// ...existing code...
import React, { useEffect, useRef, useState, useCallback } from 'react'
import io from "socket.io-client";
import { Badge, IconButton, TextField, Avatar } from '@mui/material';
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
import server from '../environment';

const server_url = server;

// Peer connections map: socketId -> RTCPeerConnection
const connections = {};

const peerConfigConnections = {
    "iceServers": [
        { "urls": "stun:stun.l.google.com:19302" }
    ]
}

/**
 * VideoMeetComponent — compact overview
 *
 * Purpose: WebRTC meeting page with camera/mic/screen, signaling and chat.
 * Run locally:
 *  - Backend: cd backend && npm install && npm start
 *  - Frontend: cd frontend && npm install && npm start
 *
 * Main functions (one-line):
 *  - `getPermissions()`  : detect/request camera & mic, set `window.localStream`
 *  - `getUserMedia()`    : start publishing selected tracks to peers
 *  - `getUserMediaSuccess`: apply local stream and renegotiate offers
 *  - `getDislayMediaSuccess`: handle screen-share stream lifecycle
 *  - `connectToSocketServer`: socket.io signaling & chat handlers
 *  - `gotMessageFromServer`: process SDP/ICE from remote peers
 *  - UI handlers: `handleVideo`, `handleAudio`, `handleScreen`, `handleEndCall`
 */
export default function VideoMeetComponent() {

    var socketRef = useRef();
    let socketIdRef = useRef();

    let localVideoref = useRef();

    // presenter overlay refs/state
    const presenterRef = useRef();
    const lastTapRef = useRef(0);
    const [presenterId, setPresenterId] = useState(null); // 'local' or remote socketId

    let [videoAvailable, setVideoAvailable] = useState(true);

    let [audioAvailable, setAudioAvailable] = useState(true);

    // whether user wants to publish video/audio (booleans)
    let [video, setVideo] = useState(true);

    let [audio, setAudio] = useState(true);

    let [screen, setScreen] = useState(false);

    let [showModal, setModal] = useState(true);

    let [screenAvailable, setScreenAvailable] = useState(false);

    let [messages, setMessages] = useState([])

    let [message, setMessage] = useState("");

    let [newMessages, setNewMessages] = useState(3);

    let [askForUsername, setAskForUsername] = useState(true);

    let [username, setUsername] = useState("");

    const videoRef = useRef([])

    let [videos, setVideos] = useState([])

    // small helpers and state are below

    useEffect(() => {
        if (typeof navigator === 'undefined' || typeof navigator.mediaDevices === 'undefined') {
            setVideoAvailable(false);
            setAudioAvailable(false);
            setScreenAvailable(false);
            return;
        }

        getPermissions();
    }, [])

    // when presenterId or videos/local stream change, attach stream to presenter video element
    useEffect(() => {
        const el = presenterRef.current;
        if (!el) return;
        const stream = presenterId === 'local' ? window.localStream : videos.find(v => v.socketId === presenterId)?.stream;
        try {
            el.srcObject = stream || null;
            const p = el.play?.();
            if (p && p.catch) p.catch(() => { /* ignore autoplay errors */ });
        } catch (e) { /* ignore */ }
    }, [presenterId, videos]);

    // display media is requested directly where needed; helper removed to avoid unused-vars

    const getPermissions = async () => {
        try {
            if (!(navigator?.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function')) {
                setVideoAvailable(false);
                setAudioAvailable(false);
                setScreenAvailable(typeof navigator?.mediaDevices?.getDisplayMedia === 'function');
                return;
            }

            // Try to request both audio and video in a single prompt
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                const hasVideo = stream.getVideoTracks().length > 0;
                const hasAudio = stream.getAudioTracks().length > 0;
                setVideoAvailable(hasVideo);
                setAudioAvailable(hasAudio);
                setScreenAvailable(typeof navigator.mediaDevices?.getDisplayMedia === 'function');

                window.localStream = stream;
                if (localVideoref.current) {
                    localVideoref.current.srcObject = stream;
                }
                return;
            } catch (err) {
                // Combined request failed — fall back gently to detect availability without spamming prompts
                console.warn('Combined getUserMedia failed:', err);

                // Attempt individual requests but avoid double-prompts when possible
                let stream = null;
                let hasVideo = false;
                let hasAudio = false;

                try {
                    if (typeof navigator?.mediaDevices?.getUserMedia === 'function') {
                        const v = await navigator.mediaDevices.getUserMedia({ video: true });
                        hasVideo = v.getVideoTracks().length > 0;
                        stream = v;
                    } else {
                        hasVideo = false;
                    }
                } catch (e) {
                    hasVideo = false;
                }

                try {
                    if (typeof navigator?.mediaDevices?.getUserMedia === 'function') {
                        const a = await navigator.mediaDevices.getUserMedia({ audio: true });
                        hasAudio = a.getAudioTracks().length > 0;
                        if (stream) {
                            a.getAudioTracks().forEach(t => stream.addTrack(t));
                        } else stream = a;
                    } else {
                        hasAudio = false;
                    }
                } catch (e) {
                    hasAudio = false;
                }

                setVideoAvailable(hasVideo);
                setAudioAvailable(hasAudio);
                setScreenAvailable(typeof navigator.mediaDevices?.getDisplayMedia === 'function');

                if (stream) {
                    window.localStream = stream;
                    if (localVideoref.current) localVideoref.current.srcObject = stream;
                }
            }
        } catch (error) {
            console.error(error);
        }
    };

    /* effect moved below to avoid using getUserMedia before its definition */
    let getMedia = () => {
        setVideo(videoAvailable);
        setAudio(audioAvailable);
        connectToSocketServer();

    }

    const getUserMediaSuccess = useCallback((stream) => {
        try {
            window.localStream.getTracks().forEach(track => track.stop())
        } catch (e) { console.log(e) }

        window.localStream = stream
        localVideoref.current.srcObject = stream

        for (let id in connections) {
            if (id === socketIdRef.current) continue

            // fallback to addStream for older browsers, prefer addTrack where available
            try { connections[id].addStream(window.localStream) } catch (e) { /* ignore */ }

            connections[id].createOffer().then((description) => {
                connections[id].setLocalDescription(description)
                    .then(() => socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription })))
                    .catch(() => { })
            })
        }

        stream.getTracks().forEach(track => track.onended = () => {
            setVideo(false);
            setAudio(false);

            try { localVideoref.current.srcObject.getTracks().forEach(t => t.stop()) } catch (e) { }

            let blackSilence = (...args) => new MediaStream([black(...args), silence()])
            window.localStream = blackSilence()
            localVideoref.current.srcObject = window.localStream

            for (let id in connections) {
                try { connections[id].addStream(window.localStream) } catch (e) { }
                connections[id].createOffer().then((description) => {
                    connections[id].setLocalDescription(description)
                        .then(() => socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription })))
                        .catch(() => { })
                })
            }
        })
    }, [])

    const getUserMedia = useCallback(() => {
        if ((video && videoAvailable) || (audio && audioAvailable)) {
            if (typeof navigator?.mediaDevices?.getUserMedia === 'function') {
                navigator.mediaDevices.getUserMedia({ video: video, audio: audio })
                    .then(getUserMediaSuccess)
                    .catch((e) => console.log(e))
            } else {
                console.warn('getUserMedia not available in this environment');
            }
        } else {
            try {
                let tracks = localVideoref.current.srcObject.getTracks()
                tracks.forEach(track => track.stop())
            } catch (e) { }
        }
    }, [video, audio, videoAvailable, audioAvailable, getUserMediaSuccess])

    const getDislayMediaSuccess = useCallback((stream) => {
        console.log("HERE")
        try {
            window.localStream.getTracks().forEach(track => track.stop())
        } catch (e) { console.log(e) }

        window.localStream = stream
        localVideoref.current.srcObject = stream

        for (let id in connections) {
            if (id === socketIdRef.current) continue

            connections[id].addStream(window.localStream)

            connections[id].createOffer().then((description) => {
                connections[id].setLocalDescription(description)
                    .then(() => {
                        socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }))
                    })
                    .catch(e => console.log(e))
            })
        }

        stream.getTracks().forEach(track => track.onended = () => {
            setScreen(false)

            try {
                let tracks = localVideoref.current.srcObject.getTracks()
                tracks.forEach(track => track.stop())
            } catch (e) { console.log(e) }

            let blackSilence = (...args) => new MediaStream([black(...args), silence()])
            window.localStream = blackSilence()
            localVideoref.current.srcObject = window.localStream

            getUserMedia()

        })
    }, [getUserMedia])

    // call getUserMedia when user toggles audio/video
    useEffect(() => {
        if (video !== undefined && audio !== undefined) {
            getUserMedia();
            console.log("SET STATE HAS ", video, audio);
        }
    }, [video, audio, getUserMedia])

    let gotMessageFromServer = (fromId, message) => {
        var signal = JSON.parse(message)

        if (fromId !== socketIdRef.current) {
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
        socketRef.current = io.connect(server_url, { secure: false })

        socketRef.current.on('signal', gotMessageFromServer)

        socketRef.current.on('connect', () => {
            socketRef.current.emit('join-call', window.location.href)
            socketIdRef.current = socketRef.current.id

            socketRef.current.on('chat-message', addMessage)

            socketRef.current.on('user-left', (id) => {
                setVideos((videos) => videos.filter((video) => video.socketId !== id))
            })

            socketRef.current.on('user-joined', (id, clients) => {
                clients.forEach((socketListId) => {

                    connections[socketListId] = new RTCPeerConnection(peerConfigConnections)
                    // Wait for their ice candidate       
                    connections[socketListId].onicecandidate = function (event) {
                        if (event.candidate != null) {
                            socketRef.current.emit('signal', socketListId, JSON.stringify({ 'ice': event.candidate }))
                        }
                    }

                    // Wait for their video stream
                    connections[socketListId].onaddstream = (event) => {
                        // locate existing video slot for this socket id

                        let videoExists = videoRef.current.find(video => video.socketId === socketListId);

                        if (videoExists) {

                            // Update the stream of the existing video
                            setVideos(videos => {
                                const updatedVideos = videos.map(video =>
                                    video.socketId === socketListId ? { ...video, stream: event.stream } : video
                                );
                                videoRef.current = updatedVideos;
                                return updatedVideos;
                            });
                        } else {
                            // Create a new video
                            // creating new remote video entry
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


                    // Add the local video stream
                    if (window.localStream) {
                        try { connections[socketListId].addStream(window.localStream) } catch (e) { /* ignore */ }
                    } else {
                        let blackSilence = (...args) => new MediaStream([black(...args), silence()])
                        window.localStream = blackSilence()
                        try { connections[socketListId].addStream(window.localStream) } catch (e) { /* ignore */ }
                    }
                })

                if (id === socketIdRef.current) {
                    for (let id2 in connections) {
                        if (id2 === socketIdRef.current) continue

                        try {
                            connections[id2].addStream(window.localStream)
                        } catch (e) { }

                        connections[id2].createOffer().then((description) => {
                            connections[id2].setLocalDescription(description)
                                .then(() => {
                                    socketRef.current.emit('signal', id2, JSON.stringify({ 'sdp': connections[id2].localDescription }))
                                })
                                .catch(e => console.log(e))
                        })
                    }
                }
            })
        })
    }

    let silence = () => {
        let ctx = new AudioContext()
        let oscillator = ctx.createOscillator()
        let dst = oscillator.connect(ctx.createMediaStreamDestination())
        oscillator.start()
        ctx.resume()
        return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false })
    }
    let black = ({ width = 640, height = 480 } = {}) => {
        let canvas = Object.assign(document.createElement("canvas"), { width, height })
        canvas.getContext('2d').fillRect(0, 0, width, height)
        let stream = canvas.captureStream()
        return Object.assign(stream.getVideoTracks()[0], { enabled: false })
    }

    let handleVideo = () => {
        setVideo(!video);
        // getUserMedia();
    }
    let handleAudio = () => {
        setAudio(!audio)
        // getUserMedia();
    }

    // double-tap detector for touch devices
    const handleTouchTap = (id) => {
        const now = Date.now();
        if (now - lastTapRef.current < 300) {
            // double-tap detected
            handlePresenter(id);
        }
        lastTapRef.current = now;
    };

    const handlePresenter = (id) => {
        setPresenterId(prev => prev === id ? null : id);
    };

    useEffect(() => {
        if (screen !== undefined && screen) {
            if (typeof navigator?.mediaDevices?.getDisplayMedia === 'function') {
                navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
                    .then(getDislayMediaSuccess)
                    .catch((e) => console.log(e))
            } else {
                console.warn('getDisplayMedia not available in this environment');
            }
        }
    }, [screen, getDislayMediaSuccess])
    let handleScreen = () => {
        setScreen(!screen);
    }

    let handleEndCall = () => {
        try {
            let tracks = localVideoref.current.srcObject.getTracks()
            tracks.forEach(track => track.stop())
        } catch (e) { }
        window.location.href = "/"
    }


    const addMessage = (data, sender, socketIdSender) => {
        setMessages((prevMessages) => [
            ...prevMessages,
            { sender: sender, data: data }
        ]);
        if (socketIdSender !== socketIdRef.current) {
            setNewMessages((prevNewMessages) => prevNewMessages + 1);
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
        setAskForUsername(false);
        getMedia();
    }


    return (
        <div>

            {askForUsername === true ?

                <div>


                    <h2>Enter into Lobby </h2>
                    <TextField id="outlined-basic" label="Username" value={username} onChange={e => setUsername(e.target.value)} variant="outlined" />
                    <Button variant="contained" onClick={connect}>Connect</Button>


                    <div>
                        <video
                            ref={localVideoref}
                            autoPlay
                            muted
                            onDoubleClick={() => handlePresenter('local')}
                            onTouchStart={() => handleTouchTap('local')}
                        ></video>
                    </div>

                </div> :


                <div className={styles.meetVideoContainer}>

                    {showModal ? (
                        <div style={{
                            position: "absolute",
                            right: 20,
                            top: 20,
                            width: 360,
                            maxHeight: "75vh",
                            display: "flex",
                            flexDirection: "column",
                            borderRadius: 12,
                            overflow: "hidden",
                            background: "linear-gradient(180deg, #071226, #0b1220)",
                            boxShadow: "0 12px 40px rgba(2,6,23,0.6)",
                            color: "#fff",
                            zIndex: 80
                        }}>
                            <div style={{ padding: 12, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                                <h2 style={{ margin: 0, fontSize: 16 }}>Meeting Chat</h2>
                                <IconButton size="small" onClick={() => setModal(false)} style={{ color: "#fff" }}>
                                    <CloseIcon fontSize="small" />
                                </IconButton>
                            </div>

                            <div style={{ padding: 12, overflowY: "auto", flex: 1 }}>
                                        {messages.length === 0 ? (
                                            <p style={{ opacity: 0.6, margin: 0 }}>No messages yet</p>
                                        ) : (
                                            messages.map((item, index) => (
                                                <div key={index} className={item.sender === username ? styles.chatMessageSelfWrapper : styles.chatMessageWrapper}>
                                                    <Avatar className={styles.chatAvatar}>{item.sender?.[0]?.toUpperCase() || "?"}</Avatar>
                                                    <div className={item.sender === username ? styles.chatBubbleSelf : styles.chatBubble}>
                                                        <div className={styles.chatSender}>{item.sender}</div>
                                                        <div className={styles.chatText}>{item.data}</div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                            </div>

                            <div style={{ padding: 12, borderTop: "1px solid rgba(255,255,255,0.04)", display: "flex", gap: 8 }}>
                                <TextField
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Say something..."
                                    fullWidth
                                    size="small"
                                    variant="outlined"
                                    onKeyDown={e => { if (e.key === "Enter") sendMessage(); }}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            background: 'rgba(255,255,255,0.03)',
                                            borderRadius: 1,
                                            '& fieldset': { borderColor: 'rgba(255,255,255,0.06)' },
                                            '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.12)' }
                                        },
                                        '& .MuiInputBase-input::placeholder': { color: 'rgba(255,255,255,0.6)' },
                                        '& .MuiInputBase-input': { color: '#ffffff' }
                                    }}
                                />
                                <Button variant="contained" onClick={sendMessage} style={{ background: "#1976d2" }}>Send</Button>
                            </div>
                        </div>
                    ) : <></>}

                    <div className={styles.buttonContainers}>
                        <IconButton onClick={handleVideo} style={{ color: "white" }}>
                            {(video === true) ? <VideocamIcon /> : <VideocamOffIcon />}
                        </IconButton>
                        <IconButton onClick={handleEndCall} style={{ color: "red" }}>
                            <CallEndIcon  />
                        </IconButton>
                        <IconButton onClick={handleAudio} style={{ color: "white" }}>
                            {audio === true ? <MicIcon /> : <MicOffIcon />}
                        </IconButton>

                        {screenAvailable === true ?
                            <IconButton onClick={handleScreen} style={{ color: "white" }}>
                                {screen === true ? <ScreenShareIcon /> : <StopScreenShareIcon />}
                            </IconButton> : <></>}

                        <Badge badgeContent={newMessages} max={999} color='primary' sx={{ '& .MuiBadge-badge': { backgroundColor: '#ff9800', color: '#fff' } }}>
                            <IconButton onClick={() => setModal(!showModal)} style={{ color: "white" }}>
                                <ChatIcon />                        </IconButton>
                        </Badge>

                    </div>


                    <video className={styles.meetUserVideo} ref={localVideoref} autoPlay muted
                        onDoubleClick={() => handlePresenter('local')}
                        onTouchStart={() => handleTouchTap('local')}
                    ></video>

                    <div className={styles.conferenceView}>
                        {videos.map((video) => (
                            <div key={video.socketId}
                                onDoubleClick={() => handlePresenter(video.socketId)}
                                onTouchStart={() => handleTouchTap(video.socketId)}
                            >
                                <video

                                    data-socket={video.socketId}
                                    ref={ref => {
                                        if (ref && video.stream) {
                                            ref.srcObject = video.stream;
                                        }
                                    }}
                                    autoPlay
                                >
                                </video>
                            </div>

                        ))}

                    </div>

                    {/* Presenter overlay */}
                    {presenterId && (
                        <div
                            onClick={() => setPresenterId(null)}
                            style={{
                                position: "fixed",
                                inset: 0,
                                background: "rgba(0,0,0,0.8)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                zIndex: 2000,
                                padding: 20
                            }}
                        >
                            <div
                                onClick={(e) => e.stopPropagation()}
                                style={{ position: "relative", width: "90%", maxWidth: 1100, borderRadius: 12, overflow: "hidden", background: "#000" }}
                            >
                                <video
                                    ref={presenterRef}
                                    autoPlay
                                    playsInline
                                    controls={false}
                                    style={{ width: "100%", height: "100%", objectFit: "contain", display: "block", background: "#000" }}
                                />
                                <IconButton
                                    onClick={() => setPresenterId(null)}
                                    style={{ position: "absolute", right: 8, top: 8, color: "#fff", background: "rgba(0,0,0,0.4)" }}
                                >
                                    <CloseIcon />
                                </IconButton>
                            </div>
                        </div>
                    )}

                </div>

            }

        </div>
    )
}
// ...existing code...