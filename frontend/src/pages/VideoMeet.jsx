import React, { useEffect, useRef, useState } from 'react';
import io from "socket.io-client";
import { Badge, IconButton, TextField, Button } from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import CallEndIcon from '@mui/icons-material/CallEnd';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare';
import ChatIcon from '@mui/icons-material/Chat';
import server from '../environment';
import styles from "../styles/videoComponent.module.css";

const server_url = server;
const connections = {};
const peerConfigConnections = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};

export default function VideoMeetComponent() {
    const socketRef = useRef();
    const socketIdRef = useRef();
    const localVideoref = useRef();

    const [videoAvailable, setVideoAvailable] = useState(true);
    const [audioAvailable, setAudioAvailable] = useState(true);
    const [screenAvailable, setScreenAvailable] = useState(false);

    const [video, setVideo] = useState(true);
    const [audio, setAudio] = useState(true);
    const [screen, setScreen] = useState(false);

    const [videos, setVideos] = useState([]);
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState("");
    const [newMessages, setNewMessages] = useState(0);
    const [showModal, setModal] = useState(true);
    const [askForUsername, setAskForUsername] = useState(true);
    const [username, setUsername] = useState("");

    const videoRefs = useRef({});

    useEffect(() => {
        getPermissions();
    }, []);

    // Get video/audio permissions
    const getPermissions = async () => {
        try {
            const videoPerm = await navigator.mediaDevices.getUserMedia({ video: true });
            const audioPerm = await navigator.mediaDevices.getUserMedia({ audio: true });

            setVideoAvailable(!!videoPerm);
            setAudioAvailable(!!audioPerm);
            setScreenAvailable(!!navigator.mediaDevices.getDisplayMedia);

            // Start local stream
            const userStream = await navigator.mediaDevices.getUserMedia({
                video: !!videoPerm,
                audio: !!audioPerm
            });
            window.localStream = userStream;
            if (localVideoref.current) localVideoref.current.srcObject = userStream;
        } catch (error) {
            console.error(error);
        }
    };

    const getUserMediaSuccess = (stream) => {
        window.localStream = stream;
        if (localVideoref.current) localVideoref.current.srcObject = stream;

        // Update existing connections
        Object.keys(connections).forEach(id => {
            if (id !== socketIdRef.current) {
                connections[id].addTrack(stream.getTracks()[0], stream);
                connections[id].addTrack(stream.getTracks()[1], stream);

                connections[id].createOffer().then(desc => {
                    connections[id].setLocalDescription(desc).then(() => {
                        socketRef.current.emit('signal', id, JSON.stringify({ sdp: connections[id].localDescription }));
                    });
                });
            }
        });
    };

    const getDisplayMediaSuccess = (stream) => {
        window.localStream = stream;
        if (localVideoref.current) localVideoref.current.srcObject = stream;

        Object.keys(connections).forEach(id => {
            if (id !== socketIdRef.current) {
                stream.getTracks().forEach(track => connections[id].addTrack(track, stream));
                connections[id].createOffer().then(desc => {
                    connections[id].setLocalDescription(desc).then(() => {
                        socketRef.current.emit('signal', id, JSON.stringify({ sdp: connections[id].localDescription }));
                    });
                });
            }
        });

        stream.getTracks().forEach(track => {
            track.onended = () => {
                setScreen(false);
                startLocalStream();
            };
        });
    };

    const startLocalStream = async () => {
        const stream = await navigator.mediaDevices.getUserMedia({ video, audio });
        getUserMediaSuccess(stream);
    };

    const connectToSocketServer = () => {
        socketRef.current = io.connect(server_url, { secure: false });

        socketRef.current.on('connect', () => {
            socketIdRef.current = socketRef.current.id;
            socketRef.current.emit('join-call', window.location.href);
        });

        socketRef.current.on('signal', gotMessageFromServer);

        socketRef.current.on('user-joined', (id, clients) => {
            clients.forEach(socketListId => {
                if (!connections[socketListId]) {
                    const pc = new RTCPeerConnection(peerConfigConnections);
                    connections[socketListId] = pc;

                    pc.onicecandidate = (event) => {
                        if (event.candidate)
                            socketRef.current.emit('signal', socketListId, JSON.stringify({ ice: event.candidate }));
                    };

                    pc.ontrack = (event) => {
                        const stream = event.streams[0];
                        setVideos(prev => {
                            if (prev.find(v => v.socketId === socketListId)) {
                                return prev.map(v => v.socketId === socketListId ? { ...v, stream } : v);
                            }
                            return [...prev, { socketId: socketListId, stream }];
                        });
                    };

                    // Add local tracks
                    window.localStream.getTracks().forEach(track => pc.addTrack(track, window.localStream));
                }
            });

            // If self joined
            if (id === socketIdRef.current) {
                Object.keys(connections).forEach(id2 => {
                    if (id2 !== socketIdRef.current) {
                        connections[id2].createOffer().then(desc => {
                            connections[id2].setLocalDescription(desc).then(() => {
                                socketRef.current.emit('signal', id2, JSON.stringify({ sdp: connections[id2].localDescription }));
                            });
                        });
                    }
                });
            }
        });

        socketRef.current.on('user-left', (id) => {
            setVideos(prev => prev.filter(v => v.socketId !== id));
            delete connections[id];
        });

        socketRef.current.on('chat-message', addMessage);
    };

    const gotMessageFromServer = (fromId, message) => {
        const signal = JSON.parse(message);

        if (fromId === socketIdRef.current) return;

        if (signal.sdp) {
            connections[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(() => {
                if (signal.sdp.type === 'offer') {
                    connections[fromId].createAnswer().then(desc => {
                        connections[fromId].setLocalDescription(desc).then(() => {
                            socketRef.current.emit('signal', fromId, JSON.stringify({ sdp: connections[fromId].localDescription }));
                        });
                    });
                }
            });
        }

        if (signal.ice) {
            connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice));
        }
    };

    const addMessage = (data, sender) => {
        setMessages(prev => [...prev, { sender, data }]);
        setNewMessages(prev => prev + 1);
    };

    const sendMessage = () => {
        socketRef.current.emit('chat-message', message, username);
        setMessage("");
    };

    const handleVideo = () => {
        setVideo(prev => !prev);
        startLocalStream();
    };

    const handleAudio = () => {
        setAudio(prev => !prev);
        startLocalStream();
    };

    const handleScreen = () => {
        setScreen(prev => !prev);
        if (!screen) {
            navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
                .then(getDisplayMediaSuccess)
                .catch(console.error);
        } else {
            startLocalStream();
        }
    };

    const handleEndCall = () => {
        window.localStream.getTracks().forEach(track => track.stop());
        window.location.href = "/";
    };

    const connect = () => {
        setAskForUsername(false);
        connectToSocketServer();
        startLocalStream();
    };

    return (
        <div>
            {askForUsername ? (
                <div>
                    <h2>Enter into Lobby</h2>
                    <TextField label="Username" value={username} onChange={e => setUsername(e.target.value)} />
                    <Button variant="contained" onClick={connect}>Connect</Button>
                    <div>
                        <video ref={localVideoref} autoPlay muted></video>
                    </div>
                </div>
            ) : (
                <div className={styles.meetVideoContainer}>
                    {showModal && (
                        <div className={styles.chatRoom}>
                            <div className={styles.chatContainer}>
                                <h1>Chat</h1>
                                <div className={styles.chattingDisplay}>
                                    {messages.length > 0 ? messages.map((item, i) => (
                                        <div key={i} style={{ marginBottom: 20 }}>
                                            <p style={{ fontWeight: "bold" }}>{item.sender}</p>
                                            <p>{item.data}</p>
                                        </div>
                                    )) : <p>No Messages Yet</p>}
                                </div>
                                <div className={styles.chattingArea}>
                                    <TextField value={message} onChange={e => setMessage(e.target.value)} label="Enter Your chat" />
                                    <Button variant="contained" onClick={sendMessage}>Send</Button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className={styles.buttonContainers}>
                        <IconButton onClick={handleVideo}>{video ? <VideocamIcon /> : <VideocamOffIcon />}</IconButton>
                        <IconButton onClick={handleEndCall} style={{ color: 'red' }}><CallEndIcon /></IconButton>
                        <IconButton onClick={handleAudio}>{audio ? <MicIcon /> : <MicOffIcon />}</IconButton>
                        {screenAvailable && <IconButton onClick={handleScreen}>{screen ? <ScreenShareIcon /> : <StopScreenShareIcon />}</IconButton>}
                        <Badge badgeContent={newMessages} color="orange">
                            <IconButton onClick={() => { setModal(!showModal); setNewMessages(0); }}><ChatIcon /></IconButton>
                        </Badge>
                    </div>

                    <video className={styles.meetUserVideo} ref={localVideoref} autoPlay muted></video>

                    <div className={styles.conferenceView}>
                        {videos.map(video => (
                            <video
                                key={video.socketId}
                                ref={ref => { videoRefs.current[video.socketId] = ref; if (ref) ref.srcObject = video.stream; }}
                                autoPlay
                                playsInline
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
