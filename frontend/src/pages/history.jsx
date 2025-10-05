import React, { useContext, useEffect, useState } from 'react'
import { AuthContext } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import HomeIcon from '@mui/icons-material/Home';
import { IconButton } from '@mui/material';
import "../App.css";

export default function History() {
    const { getHistoryOfUser } = useContext(AuthContext);
    const [meetings, setMeetings] = useState([])
    const routeTo = useNavigate();

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const history = await getHistoryOfUser();
                setMeetings(history);
            } catch {
                // IMPLEMENT SNACKBAR
            }
        }
        fetchHistory();
    }, [])

    let formatDate = (dateString) => {
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, "0");
        const month = (date.getMonth() + 1).toString().padStart(2, "0")
        const year = date.getFullYear();
        return `${day}/${month}/${year}`
    }

    return (
        <div className="historyPageContainer">
            <IconButton className="historyNavBtn" onClick={() => { routeTo("/home") }}>
                <HomeIcon fontSize="large" />
            </IconButton>
            <div className="historyTitle">Your Meeting History</div>
            <div className="historyCards">
                {
                    (meetings.length !== 0) ? meetings.map((e, i) => (
                        <Card key={i} variant="outlined" className="historyCard">
                            <CardContent>
                                <Typography className="historyCode" gutterBottom>
                                    Code: {e.meetingCode}
                                </Typography>
                                <Typography className="historyDate">
                                    Date: {formatDate(e.date)}
                                </Typography>
                            </CardContent>
                        </Card>
                    )) : (
                        <div className="noMeetingsMsg">
                            No meetings found.
                        </div>
                    )
                }
            </div>
        </div>
    )
}