import React, { useContext, useState } from 'react';
import withAuth from '../utils/withAuth';
import { useNavigate } from 'react-router-dom';
import "../App.css";
import { Button, TextField, Paper, Box, Typography } from '@mui/material';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import { AuthContext } from '../contexts/AuthContext';

function HomeComponent() {
    let navigate = useNavigate();
    const [meetingCode, setMeetingCode] = useState("");
    const { addToUserHistory } = useContext(AuthContext);

    let handleJoinVideoCall = async () => {
        if (!meetingCode.trim()) return;
        await addToUserHistory(meetingCode);
        navigate(`/${encodeURIComponent(meetingCode.trim().toLowerCase())}`);
    };

    return (
        <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            minHeight: 'calc(100vh - 90px)', 
            backgroundColor: '#13122b', 
            position: 'relative',
            overflow: 'hidden'
        }}>
            
            {/* Ambient Glowing Background Elements */}
            <Box sx={{
                position: 'absolute',
                width: '45vw',
                height: '45vw',
                top: '-10vw',
                left: '-10vw',
                background: 'radial-gradient(circle, rgba(111, 79, 242, 0.25) 0%, transparent 70%)',
                filter: 'blur(40px)',
                pointerEvents: 'none',
                zIndex: 0
            }} />
            <Box sx={{
                position: 'absolute',
                width: '40vw',
                height: '40vw',
                bottom: '-10vw',
                right: '-10vw',
                background: 'radial-gradient(circle, rgba(255, 152, 57, 0.15) 0%, transparent 70%)',
                filter: 'blur(40px)',
                pointerEvents: 'none',
                zIndex: 0
            }} />

            {/* Main Hero Container */}
            <div className="meetContainer" style={{ 
                display: 'flex', 
                flex: 1, 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                paddingInline: '6vw', 
                width: '100%', 
                boxSizing: 'border-box',
                position: 'relative',
                zIndex: 10
            }}>
                
                {/* Left Panel: Modern Text & Action Card */}
                <div className="leftPanel" style={{ flex: 1, maxWidth: '620px', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center' }}>
                    
                    <Box sx={{ 
                        display: 'inline-block', 
                        px: 2, 
                        py: 0.75, 
                        borderRadius: '20px', 
                        backgroundColor: 'rgba(255, 152, 57, 0.1)', 
                        border: '1px solid rgba(255, 152, 57, 0.3)',
                        mb: 3
                    }}>
                        <Typography variant="caption" sx={{ color: '#ff9839', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                            Secure Video Conferencing
                        </Typography>
                    </Box>

                    <Typography variant="h2" sx={{ 
                        fontFamily: 'Montserrat, Roboto, Arial, sans-serif',
                        fontSize: { xs: '2.2rem', md: '3rem' },
                        fontWeight: 900,
                        color: '#fff',
                        marginBottom: '20px',
                        lineHeight: 1.15,
                        letterSpacing: '-0.5px'
                    }}>
                        Providing Quality Video Call Just Like Quality Education
                    </Typography>
                    
                    <Typography variant="body1" sx={{ color: '#94a3b8', fontSize: '1.15rem', marginBottom: '36px', lineHeight: 1.6 }}>
                        Connect seamlessly with your peers, teachers, or teams with high-definition, crystal-clear video communication.
                    </Typography>

                    {/* Glassmorphism Input Card */}
                    <Paper elevation={0} sx={{ 
                        p: 3.5, 
                        backgroundColor: 'rgba(255, 255, 255, 0.03)', 
                        border: '1px solid rgba(255, 255, 255, 0.08)', 
                        borderRadius: '24px',
                        backdropFilter: 'blur(16px)',
                        width: '100%',
                        boxSizing: 'border-box',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
                    }}>
                        <Box sx={{ display: 'flex', gap: "16px", alignItems: 'center', flexDirection: { xs: 'column', sm: 'row' } }}>
                            <TextField 
                                onChange={e => setMeetingCode(e.target.value)} 
                                id="outlined-basic" 
                                label="Enter Meeting Code" 
                                variant="outlined" 
                                fullWidth
                                size="medium"
                                onKeyDown={e => { if (e.key === "Enter") handleJoinVideoCall(); }}
                                sx={{ 
                                    '& .MuiOutlinedInput-root': { 
                                        borderRadius: '14px',
                                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                        color: '#fff',
                                        '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.12)' },
                                        '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.25)' },
                                        '&.Mui-focused fieldset': { borderColor: '#ff9839' }
                                    },
                                    '& .MuiInputLabel-root': { color: '#94a3b8' },
                                    '& .MuiInputLabel-root.Mui-focused': { color: '#ff9839' }
                                }}
                            />
                            <Button 
                                onClick={handleJoinVideoCall} 
                                variant='contained' 
                                size="large"
                                disabled={!meetingCode.trim()}
                                endIcon={<KeyboardArrowRightIcon />}
                                sx={{ 
                                    height: '56px', 
                                    px: 4, 
                                    borderRadius: '14px', 
                                    textTransform: 'none', 
                                    fontWeight: 700,
                                    fontSize: '1.05rem',
                                    background: 'linear-gradient(135deg, #ff9839 0%, #ffad52 100%)',
                                    color: '#000',
                                    boxShadow: '0 8px 20px rgba(255,152,57,0.3)',
                                    width: { xs: '100%', sm: 'auto' },
                                    whiteSpace: 'nowrap',
                                    '&:hover': { background: 'linear-gradient(135deg, #ffad52 0%, #ff9839 100%)' },
                                    '&.Mui-disabled': { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.3)' }
                                }}
                            >
                                Join Room
                            </Button>
                        </Box>
                    </Paper>
                </div>

                {/* Right Panel: Modern Illustration with Glow */}
                <div className='rightPanel' style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <Box sx={{
                        position: 'relative',
                        '&::after': {
                            content: '""',
                            position: 'absolute',
                            inset: '-20px',
                            background: 'radial-gradient(circle, rgba(111,79,242,0.3) 0%, transparent 70%)',
                            borderRadius: '50%',
                            zIndex: -1
                        }
                    }}>
                        <img 
                            srcSet='/logo3.png' 
                            alt="Video Call Illustration" 
                            style={{ 
                                maxWidth: '420px', 
                                width: '100%', 
                                height: 'auto', 
                                borderRadius: '28px', 
                                objectFit: 'contain',
                                filter: 'drop-shadow(0 20px 30px rgba(0,0,0,0.6))',
                                transition: 'transform 0.3s ease',
                                '&:hover': { transform: 'scale(1.02)' }
                            }} 
                        />
                    </Box>
                </div>
            </div>
        </Box>
    );
}

export default withAuth(HomeComponent);