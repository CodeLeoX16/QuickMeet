import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Paper, TextField, Typography } from '@mui/material';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import VideocamOutlinedIcon from '@mui/icons-material/VideocamOutlined';

export default function GuestJoin() {
    const [meetingId, setMeetingId] = useState('');
    const navigate = useNavigate();

    const joinMeeting = () => {
        let id = meetingId.trim();
        try {
            id = new URL(id).pathname;
        } catch (error) {
            // The input is a meeting ID rather than a complete URL.
        }
        id = id.replace(/^\/+|\/+$/g, '').trim().toLowerCase();
        if (id) navigate(`/${encodeURIComponent(id)}`);
    };

    return (
        <Box sx={{ minHeight: 'calc(100vh - 90px)', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2, background: '#090d16' }}>
            <Paper sx={{ width: '100%', maxWidth: 430, p: { xs: 3, sm: 5 }, borderRadius: 4, color: '#fff', background: 'rgba(17,24,39,.92)', border: '1px solid rgba(255,255,255,.1)' }}>
                <Box sx={{ width: 58, height: 58, mb: 2, borderRadius: '50%', display: 'grid', placeItems: 'center', color: '#ff9839', background: 'rgba(255,152,57,.15)' }}>
                    <VideocamOutlinedIcon fontSize="large" />
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>Join a meeting</Typography>
                <Typography sx={{ color: '#94a3b8', mb: 3 }}>Enter the meeting ID shared by your host.</Typography>
                <TextField
                    fullWidth label="Meeting ID" value={meetingId} onChange={event => setMeetingId(event.target.value)}
                    onKeyDown={event => { if (event.key === 'Enter') joinMeeting(); }}
                    sx={{ mb: 2, '& .MuiOutlinedInput-root': { color: '#fff', borderRadius: 2, '& fieldset': { borderColor: 'rgba(255,255,255,.2)' }, '&.Mui-focused fieldset': { borderColor: '#ff9839' } }, '& .MuiInputLabel-root': { color: '#94a3b8' } }}
                />
                <Button fullWidth variant="contained" onClick={joinMeeting} disabled={!meetingId.trim()} endIcon={<KeyboardArrowRightIcon />} sx={{ py: 1.4, borderRadius: 2, textTransform: 'none', fontWeight: 700, background: '#ff9839', color: '#000' }}>
                    Continue
                </Button>
            </Paper>
        </Box>
    );
}