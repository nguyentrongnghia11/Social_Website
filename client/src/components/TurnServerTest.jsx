import React, { useState } from 'react';
import { Box, Button, Typography, Paper, CircularProgress, Alert } from '@mui/material';

const TurnServerTest = () => {
    const [testing, setTesting] = useState(false);
    const [result, setResult] = useState(null);
    const [logs, setLogs] = useState([]);

    const addLog = (message, type = 'info') => {
        setLogs(prev => [...prev, { message, type, time: new Date().toLocaleTimeString() }]);
        console.log(`[${type}] ${message}`);
    };

    const testTurnServer = async () => {
        setTesting(true);
        setResult(null);
        setLogs([]);
        addLog('🧪 Starting TURN server test...');

        const config = {
            iceServers: [
                {
                    urls: [
                        "stun:stun.l.google.com:19302",
                        "stun:47.129.30.150:3478"
                    ]
                },
                {
                    urls: [
                        "turn:47.129.30.150:3478",
                        "turn:47.129.30.150:3478?transport=tcp"
                    ],
                    username: "admin",
                    credential: "admin123"
                }
            ]
        };

        return new Promise((resolve) => {
            const pc = new RTCPeerConnection(config);
            const candidateTypes = {
                host: 0,
                srflx: 0,
                relay: 0
            };

            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    const type = event.candidate.type;
                    candidateTypes[type] = (candidateTypes[type] || 0) + 1;

                    addLog(`✅ ${type.toUpperCase()}: ${event.candidate.address}:${event.candidate.port}`, 'success');
                } else {
                    // ICE gathering complete
                    addLog('📊 ICE gathering complete', 'info');

                    const testResult = {
                        success: candidateTypes.relay > 0,
                        candidates: candidateTypes
                    };

                    if (candidateTypes.relay > 0) {
                        addLog('✅ TURN SERVER WORKING!', 'success');
                    } else {
                        addLog('❌ TURN SERVER NOT WORKING - No relay candidates!', 'error');
                        addLog('Possible issues: TURN server down, wrong credentials, or firewall blocking', 'error');
                    }

                    setResult(testResult);
                    setTesting(false);
                    pc.close();
                    resolve(testResult);
                }
            };

            pc.onicegatheringstatechange = () => {
                addLog(`ICE gathering state: ${pc.iceGatheringState}`, 'info');
            };

            // Create offer to trigger ICE gathering
            pc.createDataChannel('test');
            pc.createOffer()
                .then(offer => {
                    addLog('Creating offer...', 'info');
                    return pc.setLocalDescription(offer);
                })
                .then(() => {
                    addLog('Local description set', 'info');
                })
                .catch(error => {
                    addLog(`Error: ${error.message}`, 'error');
                    setTesting(false);
                    resolve({ success: false, error: error.message });
                });

            // Timeout after 10 seconds
            setTimeout(() => {
                if (testing) {
                    addLog('⏱️ Test timeout', 'error');
                    setResult({ success: false, candidates: candidateTypes, timeout: true });
                    setTesting(false);
                    pc.close();
                    resolve({ success: false, candidates: candidateTypes, timeout: true });
                }
            }, 10000);
        });
    };

    const getLogColor = (type) => {
        switch (type) {
            case 'success': return '#4caf50';
            case 'error': return '#f44336';
            case 'warning': return '#ff9800';
            default: return '#2196f3';
        }
    };

    return (

        <Box sx={{ 
            minHeight: '100vh',
            bgcolor: '#f5f5f5',
            p: 3
        }}>
            <Box sx={{ maxWidth: 800, mx: 'auto' }}>
                <Paper elevation={3} sx={{ p: 3, bgcolor: 'white' }}>
                    <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                        🔧 TURN Server Test
                    </Typography>
                    <Typography variant="body1" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
                        Test TURN server connectivity for cross-network WebRTC calls
                    </Typography>

                    <Button
                        variant="contained"
                        size="large"
                        onClick={testTurnServer}
                        disabled={testing}
                        sx={{ mt: 2, mb: 3 }}
                    >
                        {testing ? <CircularProgress size={24} sx={{ mr: 1, color: 'white' }} /> : null}
                        {testing ? 'Testing...' : 'Run Test'}
                    </Button>

                    {result && (
                        <Alert severity={result.success ? 'success' : 'error'} sx={{ mb: 2 }}>
                            <Typography variant="body2">
                                <strong>Results:</strong>
                            </Typography>
                            <Typography variant="body2">
                                Host candidates: {result.candidates.host}
                            </Typography>
                            <Typography variant="body2">
                                Srflx candidates (STUN): {result.candidates.srflx}
                            </Typography>
                            <Typography variant="body2">
                                Relay candidates (TURN): {result.candidates.relay}
                            </Typography>
                            {!result.success && (
                                <Typography variant="body2" sx={{ mt: 1, color: 'error.main' }}>
                                    ⚠️ TURN server is not working! Calls between different networks will fail.
                                </Typography>
                            )}
                        </Alert>
                    )}

                    {logs.length > 0 && (
                        <Paper variant="outlined" sx={{ p: 2, maxHeight: 400, overflow: 'auto', bgcolor: '#1e1e1e' }}>
                            {logs.map((log, index) => (
                                <Typography
                                    key={index}
                                    variant="body2"
                                    sx={{
                                        color: getLogColor(log.type),
                                        fontFamily: 'monospace',
                                        fontSize: '0.85rem',
                                        mb: 0.5
                                    }}
                                >
                                    [{log.time}] {log.message}
                                </Typography>
                            ))}
                        </Paper>
                    )}

                    <Box sx={{ mt: 3 }}>
                        <Typography variant="caption" color="text.secondary">
                            <strong>TURN Server Config:</strong><br />
                            Host: 47.129.30.150:3478<br />
                            Username: admin<br />
                            Password: admin123
                        </Typography>
                    </Box>
                </Paper>
            </Box>
        </Box>
    );
};

export default TurnServerTest;
