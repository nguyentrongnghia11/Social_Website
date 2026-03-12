/**
 * Test TURN Server Connectivity
 * Run this in browser console to verify TURN server is working
 * 
 * HOW TO USE:
 * 1. Copy this entire file content
 * 2. Open browser console (F12)
 * 3. Paste and press Enter
 * 4. Call: testTurnServer()
 */

async function testTurnServer() {
    console.log('🧪 Testing TURN Server: 47.129.30.150:3478');
    
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
                
                console.log(`✅ ${type.toUpperCase()} candidate found:`, {
                    address: event.candidate.address,
                    port: event.candidate.port,
                    protocol: event.candidate.protocol,
                    relayProtocol: event.candidate.relayProtocol
                });
            } else {
                // ICE gathering complete
                console.log('\n📊 TURN Server Test Results:');
                console.log('================================');
                console.log(`Host candidates: ${candidateTypes.host}`);
                console.log(`Srflx candidates (STUN): ${candidateTypes.srflx}`);
                console.log(`Relay candidates (TURN): ${candidateTypes.relay}`);
                console.log('================================\n');
                
                if (candidateTypes.relay > 0) {
                    console.log('✅ TURN SERVER WORKING - Relay candidates found!');
                    resolve({ success: true, candidates: candidateTypes });
                } else {
                    console.error('❌ TURN SERVER NOT WORKING - No relay candidates!');
                    console.error('Possible issues:');
                    console.error('  1. TURN server is down');
                    console.error('  2. Wrong credentials (username/password)');
                    console.error('  3. Firewall blocking ports');
                    console.error('  4. TURN server not configured properly');
                    resolve({ success: false, candidates: candidateTypes });
                }
                
                pc.close();
            }
        };

        // Create offer to trigger ICE gathering
        pc.createDataChannel('test');
        pc.createOffer()
            .then(offer => pc.setLocalDescription(offer))
            .catch(error => {
                console.error('Error creating offer:', error);
                resolve({ success: false, error: error.message });
            });

        // Timeout after 10 seconds
        setTimeout(() => {
            console.warn('⏱️ Test timeout - ICE gathering taking too long');
            pc.close();
            resolve({ success: false, candidates: candidateTypes, timeout: true });
        }, 10000);
    });
}

// Auto-run when loaded in console
if (typeof window !== 'undefined') {
    window.testTurnServer = testTurnServer;
    console.log('✅ TURN Test loaded! Run: testTurnServer()');
}
