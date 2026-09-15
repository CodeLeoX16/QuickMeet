import React from 'react';
import "../App.css";
import { Link } from 'react-router-dom';
import { Box, Typography, Button } from '@mui/material';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';

export default function LandingPage() {
    return (
        <Box className="landingPageContainer">
            
            {/* Ambient Glowing Background Elements */}
            <Box sx={{
                position: 'absolute',
                width: '45vw',
                height: '45vw',
                top: '-10vw',
                right: '-10vw',
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
                left: '-10vw',
                background: 'radial-gradient(circle, rgba(255, 152, 57, 0.15) 0%, transparent 70%)',
                filter: 'blur(40px)',
                pointerEvents: 'none',
                zIndex: 0
            }} />

            {/* Main Hero Section */}
            <div className="landingMainContainer" style={{ position: 'relative', zIndex: 10 }}>
                <div style={{ maxWidth: '620px' }}>
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
                            Next-Gen Video Platform
                        </Typography>
                    </Box>

                    <h1><span style={{ color: "#ff9839" }}>Connect</span> with your loved Ones</h1>

                    <p style={{ color: '#94a3b8', marginBottom: '32px' }}>Cover a distance effortlessly with Quick Meet's secure, crystal-clear video calls.</p>
                    
                    <Button
                        component={Link}
                        to="/auth"
                        variant="contained"
                        endIcon={<KeyboardArrowRightIcon />}
                        sx={{
                            backgroundColor: '#ff9839',
                            color: '#000',
                            fontWeight: 700,
                            borderRadius: '12px',
                            textTransform: 'none',
                            px: 3,
                            py: 1.25,
                            boxShadow: '0 8px 20px rgba(255,152,57,0.25)',
                            '&:hover': { backgroundColor: '#ffad52' }
                        }}
                    >
                        Get Started
                    </Button>
                </div>
                <div>
                    <img 
                        src="/mobile.png" 
                        alt="App preview" 
                        style={{ filter: 'drop-shadow(0 20px 30px rgba(0,0,0,0.6))' }} 
                    />
                </div>
            </div>

            {/* Background Stars / Decoration */}
            <div className="star-bg">
                <img src="/stars.png" alt="" />
            </div> 
        </Box>
    );
}