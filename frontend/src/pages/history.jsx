import React, { useContext, useEffect, useState } from 'react';
import withAuth from '../utils/withAuth';
import { useNavigate } from 'react-router-dom';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import HomeIcon from '@mui/icons-material/Home';
import { IconButton } from '@mui/material';
import { AuthContext } from '../contexts/AuthContext';
import "../App.css";

function History() {
    const { getHistoryOfUser } = useContext(AuthContext);
    const [meetings, setMeetings] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        getHistoryOfUser().then(setMeetings).catch(() => setMeetings([]));
    }, [getHistoryOfUser]);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()}`;
    };

    return (
        <main className="historyPageContainer">
            <IconButton className="historyNavBtn" onClick={() => navigate("/home")}><HomeIcon fontSize="large" /></IconButton>
            <h1 className="historyTitle">Your Meeting History</h1>
            <div className="historyCards">
                {meetings.length ? meetings.map((meeting) => (
                    <Card key={meeting._id} variant="outlined" className="historyCard">
                        <CardContent>
                            <Typography className="historyCode">Code: {meeting.meetingCode}</Typography>
                            <Typography className="historyDate">Date: {formatDate(meeting.date)}</Typography>
                        </CardContent>
                    </Card>
                )) : <p className="noMeetingsMsg">No meetings found.</p>}
            </div>
        </main>
    );
}

export default withAuth(History);