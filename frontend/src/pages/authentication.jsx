import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Typography from '@mui/material/Typography';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { AuthContext } from '../contexts/AuthContext';
import { Snackbar } from '@mui/material';

const defaultTheme = createTheme({
  palette: {
    primary: { main: "#22bda8" },
    secondary: { main: "#222" },
    background: { default: "#8decf6" },
    text: { primary: "#fff" }
  },
  typography: {
    fontFamily: "Inter, Roboto, Arial, sans-serif"
  }
});

export default function Authentication() {
  const [username, setUsername] = React.useState();
  const [password, setPassword] = React.useState();
  const [name, setName] = React.useState();
  const [error, setError] = React.useState();
  const [message, setMessage] = React.useState();
  const [formState, setFormState] = React.useState(0);
  const [open, setOpen] = React.useState(false);

  const { handleRegister, handleLogin } = React.useContext(AuthContext);

  let handleAuth = async () => {
    try {
      if (formState === 0) {
        let result = await handleLogin(username, password);
      }
      if (formState === 1) {
        let result = await handleRegister(name, username, password);
        setUsername("");
        setMessage(result);
        setOpen(true);
        setError("");
        setFormState(0);
        setPassword("");
      }
    } catch (err) {
      let message = (err.response.data.message);
      setError(message);
    }
  }

  return (
    <ThemeProvider theme={defaultTheme}>
      <Box
        sx={{
          minHeight:'100vh',
          width:'100vw',
          position:'absolute',
          left:0,
          top:0,
          background: 'linear-gradient(180deg, #8decf6 0%, #e9fbfa 100%)',
          overflow: 'auto',
        }}
      >
        <CssBaseline />
        {/* Background mountain and birds illustration (SVG) */}
        <Box sx={{
          width: '100vw',
          height: '100vh',
          position: 'absolute',
          zIndex: 0,
          left: 0,
          top: 0,
          pointerEvents: 'none',
        }}>
          <svg viewBox="0 0 1440 900" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100vw", height: "100vh", position: "absolute", left: 0, top: 0 }}>
            <rect width="1440" height="900" fill="#8decf6"/>
            <path d="M0 900L1440 900L1440 600C1197 653 962 781 720 680C478 579 265 700 0 600L0 900Z" fill="#67d1e5"/>
            <path d="M0 900L1440 900L1440 720C1200 760 950 845 720 780C490 715 260 825 0 720L0 900Z" fill="#45cad7"/>
            {/* Simple birds */}
            <g>
              <path d="M105 150 Q115 145 125 150" stroke="#222" strokeWidth="2" fill="none"/>
              <path d="M155 200 Q165 195 175 200" stroke="#222" strokeWidth="2" fill="none"/>
              <path d="M200 170 Q210 165 220 170" stroke="#222" strokeWidth="2" fill="none"/>
              <path d="M300 110 Q310 105 320 110" stroke="#222" strokeWidth="2" fill="none"/>
              <path d="M400 140 Q410 135 420 140" stroke="#222" strokeWidth="2" fill="none"/>
              <path d="M500 90 Q510 85 520 90" stroke="#222" strokeWidth="2" fill="none"/>
              <path d="M600 120 Q610 115 620 120" stroke="#222" strokeWidth="2" fill="none"/>
              <path d="M700 160 Q710 155 720 160" stroke="#222" strokeWidth="2" fill="none"/>
              <path d="M900 100 Q910 95 920 100" stroke="#222" strokeWidth="2" fill="none"/>
              <path d="M1100 120 Q1110 115 1120 120" stroke="#222" strokeWidth="2" fill="none"/>
            </g>
          </svg>
        </Box>
        {/* Centered Card */}
        <Box sx={{
          display:'flex',
          alignItems:'center',
          justifyContent:'center',
          minHeight:'100vh',
          position:'relative',
          zIndex:2,
        }}>
          <Box sx={{
            background:'#222',
            borderRadius:3,
            mx:2,
            minWidth:{xs:300, sm:350},
            maxWidth:370,
            width:'100%',
            boxShadow:'0 8px 32px rgba(44,62,80,.18)',
            display:'flex',
            flexDirection:'column',
            alignItems:'center',
            pt:8,
            pb:4,
            px:{xs:2, sm:4},
            position:'relative'
          }}>
            {/* Top Avatar */}
            <Box sx={{
              position:'absolute',
              top:-38,
              left:'50%',
              transform:'translateX(-50%)',
              bgcolor:'#22bda8',
              borderRadius:'50%',
              width:76,
              height:76,
              display:'flex',
              alignItems:'center',
              justifyContent:'center',
              boxShadow:'0 4px 16px rgba(44,62,80,.16)'
            }}>
              <Avatar sx={{ bgcolor: "#22bda8", width: 60, height: 60 }}>
                <LockOutlinedIcon sx={{ fontSize: 30, color:'#fff' }}/>
              </Avatar>
            </Box>
            <Box sx={{
              mt:2,
              width:'100%',
              display:'flex',
              flexDirection:'column',
              alignItems:'center'
            }}>
              <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
                <Button
                  variant={formState === 0 ? "contained" : "outlined"}
                  color="primary"
                  sx={{
                    fontWeight: "bold",
                    minWidth: 100,
                    borderRadius: 2,
                    boxShadow: 0,
                    background: formState === 0 ? "#22bda8" : undefined,
                    color: formState === 0 ? "#fff" : "#22bda8",
                    borderColor: "#22bda8"
                  }}
                  onClick={() => { setFormState(0) }}>
                  Sign In
                </Button>
                <Button
                  variant={formState === 1 ? "contained" : "outlined"}
                  color="primary"
                  sx={{
                    fontWeight: "bold",
                    minWidth: 100,
                    borderRadius: 2,
                    boxShadow: 0,
                    background: formState === 1 ? "#22bda8" : undefined,
                    color: formState === 1 ? "#fff" : "#22bda8",
                    borderColor: "#22bda8"
                  }}
                  onClick={() => { setFormState(1) }}>
                  Sign Up
                </Button>
              </div>
              <Box component="form" noValidate sx={{ mt: 1, width: "100%" }}>
                {formState === 1 ? (
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="username"
                    label="Full Name"
                    name="username"
                    value={name}
                    autoFocus
                    onChange={(e) => setName(e.target.value)}
                    InputProps={{
                      sx: { bgcolor:'#333', color:'#fff', borderRadius:2 },
                    }}
                    InputLabelProps={{ sx: { color:'#bbb' } }}
                  />
                ) : null}
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="username"
                  label="Username"
                  name="username"
                  value={username}
                  autoFocus
                  onChange={(e) => setUsername(e.target.value)}
                  InputProps={{
                    sx: { bgcolor:'#333', color:'#fff', borderRadius:2 },
                  }}
                  InputLabelProps={{ sx: { color:'#bbb' } }}
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="password"
                  label="Password"
                  value={password}
                  type="password"
                  onChange={(e) => setPassword(e.target.value)}
                  id="password"
                  InputProps={{
                    sx: { bgcolor:'#333', color:'#fff', borderRadius:2 },
                  }}
                  InputLabelProps={{ sx: { color:'#bbb' } }}
                />
                <Typography sx={{ color: "red", mt: 2 }}>{error}</Typography>
                <Button
                  type="button"
                  fullWidth
                  variant="contained"
                  sx={{
                    mt: 3,
                    mb: 2,
                    fontWeight: "bold",
                    background: "#22bda8",
                    color: "#fff",
                    borderRadius: 2,
                    fontSize: 18
                  }}
                  onClick={handleAuth}
                >
                  {formState === 0 ? "Login " : "Register"}
                </Button>
                <Link href="#" underline="none" sx={{ color:"#ddd", mt:2, textAlign:"center", display:"block", fontWeight:"bold" }}>
                  Forgot password?
                </Link>
              </Box>
            </Box>
          </Box>
        </Box>
        <Snackbar
          open={open}
          autoHideDuration={4000}
          message={message}
        />
      </Box>
    </ThemeProvider>
  );
}