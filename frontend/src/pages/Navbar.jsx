import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button, Box, Typography } from '@mui/material';
import VideoCallIcon from '@mui/icons-material/VideoCall';
import RestoreIcon from '@mui/icons-material/Restore';
import LogoutIcon from '@mui/icons-material/Logout';
import "../App.css";

export default function Navbar() {
    const navigate = useNavigate();
    const location = useLocation();
    
    // Check if user is logged in (has token)
    const token = localStorage.getItem("token");
    
    const isMeetingPage = location.pathname !== "/" &&
        location.pathname !== "/auth" &&
        location.pathname !== "/home" &&
        location.pathname !== "/history";

    if (isMeetingPage || location.pathname === "/auth") {
        return null;
    }

    return (
        <Box component="nav" className="navBar" sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            px: { xs: 4, md: 6 }, 
            py: 2.5,
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            backdropFilter: 'blur(10px)',
            position: 'relative',
            zIndex: 10
        }}>
            {/* Logo / Brand */}
            <Box className="navBrand" sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer' }} onClick={() => navigate(token ? "/home" : "/")}>
                <VideoCallIcon sx={{ color: '#ff9839', fontSize: 32 }} />
                <Typography variant="h6" className="quickMeetTitle" sx={{ fontWeight: 700, letterSpacing: '-0.5px' }}>
                    Quick Meet
                </Typography>
            </Box>

            {/* Dynamic Navigation Items */}
            <Box className="navActions" sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                {!token ? (
                    // Guest / Unauthenticated Links
                    <>
                        <p onClick={() => navigate("/aljk23")}>Join as Guest</p>
                        <p onClick={() => navigate("/auth")}>Register</p>
                        <Button 
                            variant="contained" 
                            onClick={() => navigate("/auth")}
                            sx={{ 
                                backgroundColor: '#ff9839', 
                                color: '#000', 
                                fontWeight: 600, 
                                borderRadius: '10px', 
                                textTransform: 'none',
                                px: 3,
                                '&:hover': { backgroundColor: '#ffad52' }
                            }}
                        >
                            Login
                        </Button>
                    </>
                ) : (
                    // Logged-in / Authenticated Links
                    <>
                        <Button 
                            startIcon={<RestoreIcon />} 
                            onClick={() => navigate("/history")}
                            sx={{ color: '#fff', textTransform: 'none', fontWeight: 600, '&:hover': { color: '#ff9839' } }}
                        >
                            History
                        </Button>

                        <Button 
                            variant="outlined" 
                            size="small"
                            startIcon={<LogoutIcon />}
                            onClick={() => {
                                localStorage.removeItem("token");
                                navigate("/");
                            }}
                            sx={{ 
                                textTransform: 'none', 
                                borderRadius: '10px', 
                                fontWeight: 600,
                                borderColor: 'rgba(239, 68, 68, 0.4)',
                                color: '#f87171',
                                '&:hover': { borderColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.08)' }
                            }}
                        >
                            Logout
                        </Button>
                    </>
                )}
            </Box>
        </Box>
    );
}