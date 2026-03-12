import { emitEvent } from '../helpers/socketHelper';

const ICE_SERVERS = {
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
    ],
    // Force TURN for testing cross-network calls
    // iceTransportPolicy: 'relay', // Uncomment to force TURN only
    iceCandidatePoolSize: 10 // Pre-gather candidates
};


class WebRTCManager {
    constructor() {
        this.pc = null;
        this.localStream = null;
        this.remoteStream = null;
        this.iceCandidatesQueue = [];
        this.processedAnswer = false;
        this.currentCallId = null;
        this.reconnectionAttempt = 0;
        this.activeCall = null;

        // Callbacks để báo cho Store/React biết khi có thay đổi
        this.onLocalStreamReady = null;
        this.onRemoteStreamReady = null;
        this.onCallStatusChange = null;
        this.onCallEnd = null;
    }

    async initialize(callData, statusCallback) {
        // console.log('Init call', callData);

        this.activeCall = callData;
        this.currentCallId = callData.callId;
        this.onCallStatusChange = statusCallback;

        try {
            await this.initLocalStream(callData.callType);

            await this.createPeerConnection();

            if (callData.isInitiator) {
                await this.createAndSendOffer();
            }

            return true;
        } catch (error) {
            console.error('Initialization failed', error);
            this.updateStatus('Lỗi thiết bị');
            throw error;
        }
    }

    async initLocalStream(callType) {

        const constraints = {
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
            },
            video: callType === 'video' ? {
                width: { ideal: 1280, max: 1920 },
                height: { ideal: 720, max: 1080 },
                facingMode: 'user',
                frameRate: { ideal: 30, max: 30 }
            } : false,
        };

        try {
            this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
            console.log('Local stream ready');

            // Notify React about local stream
            if (this.onLocalStreamReady) {
                this.onLocalStreamReady(this.localStream);
            }

            return this.localStream;
        } catch (error) {
            console.error('Cannot access camera/mic', error);
            throw error;
        }
    }

    async createPeerConnection() {
        console.log('WebRTCManager: Creating peer connection');

        if (this.pc) {
            this.closePeerConnection();
        }

        this.pc = new RTCPeerConnection(ICE_SERVERS);

        console.log("day la connect tion ", this.pc)


        if (this.localStream) {
            this.localStream.getTracks().forEach(track => {
                const sender = this.pc.addTrack(track, this.localStream);
                console.log('Added track:', track.kind, 'sender:', sender);
            });
        }
        this.setupPeerConnectionHandlers();

        return this.pc;
    }

    setupPeerConnectionHandlers() {
        // Handle ICE candidates
        this.pc.onicecandidate = (event) => {
            if (event.candidate && this.currentCallId) {
                const c = event.candidate;
                const relayInfo = c.relayProtocol ? ` via ${c.relayProtocol}` : '';
                console.log(`🧪 ICE Candidate: ${c.type} (${c.protocol})${relayInfo} | Address: ${c.address || 'N/A'}`);
                
                const emitted = emitEvent('call-ice-candidate', {
                    callId: this.currentCallId,
                    targetUserId: this.activeCall.receiverId,
                    candidate: event.candidate,
                });
                
                if (!emitted) {
                    console.error(`❌ FAILED to send ${c.type} candidate - Socket disconnected!`);
                }
            } else if (!event.candidate) {
                console.log('✅ ICE gathering complete');
            }
        };

        // Handle remote tracks
        this.pc.ontrack = (event) => {
            console.log('ontrack event:', {
                streams: event.streams.length,
                track: event.track.kind,
                enabled: event.track.enabled
            });

            const [stream] = event.streams;
            if (stream) {
                console.log('Received remote stream:', stream.getTracks().map(t => `${t.kind}:${t.enabled}`));
                this.remoteStream = stream;

                if (this.onRemoteStreamReady) {
                    this.onRemoteStreamReady(stream);
                }
            }
        };

        // Handle connection state changes
        this.pc.onconnectionstatechange = () => {
            console.log('🔗 Connection state:', this.pc.connectionState);

            switch (this.pc.connectionState) {
                case 'connected':
                    console.log('Peer connection established');
                    this.updateStatus('Đã kết nối');
                    break;
                case 'failed':
                    console.error('Peer connection failed');
                    this.updateStatus('Kết nối thất bại');
                    break;
                case 'disconnected':
                    console.warn('Peer connection disconnected');
                    this.updateStatus('Mất kết nối');
                    break;
                case 'closed':
                    console.log('Peer connection closed');
                    break;
            }
        };

        // Handle ICE connection state changes
        this.pc.oniceconnectionstatechange = async () => {
            console.log('ICE connection state:', this.pc.iceConnectionState);

            switch (this.pc.iceConnectionState) {
                case 'connected':
                case 'completed':
                    this.updateStatus('Đã kết nối');
                    this.reconnectionAttempt = 0;
                    
                    // Log which candidate pair was selected
                    try {
                        const stats = await this.pc.getStats();
                        stats.forEach(report => {
                            if (report.type === 'candidate-pair' && report.state === 'succeeded') {
                                console.log('🎯 Selected candidate pair:', {
                                    local: report.localCandidateId,
                                    remote: report.remoteCandidateId,
                                    priority: report.priority
                                });
                            }
                            if (report.type === 'local-candidate' && report.candidateType) {
                                console.log(`📍 Local: ${report.candidateType} | ${report.ip || 'N/A'}:${report.port || 'N/A'}`);
                            }
                            if (report.type === 'remote-candidate' && report.candidateType) {
                                console.log(`📍 Remote: ${report.candidateType} | ${report.ip || 'N/A'}:${report.port || 'N/A'}`);
                            }
                        });
                    } catch (e) {
                        console.warn('Could not get stats:', e.message);
                    }
                    break;

                case 'disconnected':
                    this.updateStatus('Mất kết nối');
                    console.warn('⚠️ ICE disconnected - May be network issue');
                    this.handleReconnection();
                    break;

                case 'failed':
                    this.updateStatus('Kết nối thất bại - Có thể do NAT/Firewall');
                    console.error('❌ ICE failed - TURN server may not be working!');
                    this.handleConnectionFailure();
                    break;

                case 'closed':
                    this.updateStatus('Đã đóng');
                    this.reconnectionAttempt = 0;
                    break;
            }
        };

        // Handle signaling state changes
        this.pc.onsignalingstatechange = () => {
            console.log('Signaling state:', this.pc.signalingState);
        };
    }

    async createAndSendOffer() {
        try {
            const offerDesc = await this.pc.createOffer();
            await this.pc.setLocalDescription(offerDesc);

            emitEvent('call-offer', {
                callId: this.currentCallId,
                receiverId: this.activeCall.receiverId,
                offer: offerDesc,
            });

            console.log('Offer sent to receiver');
            this.updateStatus('Đang gọi...');
        } catch (error) {
            console.error('Error creating offer:', error);
            this.updateStatus('Lỗi kết nối');
            throw error;
        }
    }

    async handleReceivedOffer(offer) {
        if (!this.pc) {
            console.error('No peer connection ');
            return;
        }

        try {
            console.log('📥 [RECEIVER] Received offer, setting remote description...');
            await this.pc.setRemoteDescription(new RTCSessionDescription(offer));
            console.log('✅ [RECEIVER] Remote description (offer) set');
            
            const answerDesc = await this.pc.createAnswer();
            await this.pc.setLocalDescription(answerDesc);
            console.log('✅ [RECEIVER] Local description (answer) set');

            emitEvent('call-answer', {
                callId: this.currentCallId,
                callerId: this.activeCall.receiverId,
                answer: answerDesc,
            });
            console.log('📤 [RECEIVER] Answer sent to caller');

            this.updateStatus('Đang kết nối...');

            console.log(`📦 [RECEIVER] Processing ${this.iceCandidatesQueue.length} queued candidates...`);
            await this.processQueuedIceCandidates();
        } catch (error) {
            console.error('❌ [RECEIVER] Error handling offer:', error);
            this.updateStatus('Lỗi kết nối');
        }
    }

    async handleReceivedAnswer(answer) {

        if (!this.pc) {
            console.error('No peer connection');
            return;
        }

        console.log('📥 [CALLER] Received answer, current state:', this.pc.signalingState);
        
        if (this.pc.signalingState !== 'have-local-offer') {
            console.warn('⚠️ [CALLER] Wrong signaling state:', this.pc.signalingState);
            return;
        }

        if (this.processedAnswer) {
            console.warn('⚠️ [CALLER] Answer already processed');
            return;
        }

        try {
            this.processedAnswer = true;
            console.log('⚙️ [CALLER] Setting remote description (answer)...');
            await this.pc.setRemoteDescription(new RTCSessionDescription(answer));
            console.log('✅ [CALLER] Remote description (answer) set');

            this.updateStatus('Đang kết nối...');

            // Process queued ICE candidates
            console.log(`📦 [CALLER] Processing ${this.iceCandidatesQueue.length} queued candidates...`);
            await this.processQueuedIceCandidates();
        } catch (error) {
            console.error('❌ [CALLER] Error handling answer:', error);
            this.updateStatus('Lỗi kết nối');
            this.processedAnswer = false;
        }
    }

    async addIceCandidate(candidate) {
        const type = candidate.type || 'unknown';
        const address = candidate.address || 'N/A';
        console.log(`📥 Received ICE candidate: ${type} | ${address}`);
        
        if (!this.pc) {
            console.error('No peer connection available');
            return;
        }

        const hasRemoteDesc = this.pc.remoteDescription && this.pc.remoteDescription.type;

        if (hasRemoteDesc) {
            try {
                await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
                console.log(`✅ Added ${type} candidate`);
            } catch (error) {
                console.error(`❌ Error adding ${type} candidate:`, error.message);
            }
        } else {
            console.log(`⏳ Queueing ${type} candidate (no remote description yet)`);
            this.iceCandidatesQueue.push(candidate);
        }
    }

    async processQueuedIceCandidates() {
        if (this.iceCandidatesQueue.length === 0) {
            console.log('No queued candidates to process');
            return;
        }
        
        console.log(`⚙️ Processing ${this.iceCandidatesQueue.length} queued candidates...`);
        
        while (this.iceCandidatesQueue.length > 0) {
            const candidate = this.iceCandidatesQueue.shift();
            const type = candidate.type || 'unknown';
            try {
                await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
                console.log(`✅ Processed queued ${type} candidate`);
            } catch (error) {
                console.error(`❌ Error processing queued ${type} candidate:`, error.message);
            }
        }

        console.log('✅ All queued candidates processed');
    }

    handleReconnection() {
        if (this.reconnectionAttempt >= 3) {
            console.warn('⚠️ Max reconnection attempts reached');
            return;
        }

        setTimeout(() => {
            if (this.pc && this.pc.iceConnectionState === 'disconnected') {
                this.reconnectionAttempt++;
                console.log(`🔄 Reconnection attempt ${this.reconnectionAttempt}/3`);
                try {
                    this.pc.restartIce();
                } catch (error) {
                    console.error('❌ Error restarting ICE:', error);
                }
            }
        }, 5000);
    }

    handleConnectionFailure() {
        if (this.reconnectionAttempt >= 2) {
            setTimeout(() => {
                if (this.pc && this.pc.iceConnectionState === 'failed') {
                    console.error('❌ Connection failed after retries');
                    if (this.onCallEnd) {
                        this.onCallEnd('Không thể kết nối. Vui lòng thử lại.');
                    }
                }
            }, 3000);
        } else {
            this.reconnectionAttempt++;
            console.log(`🔄 Reconnection attempt ${this.reconnectionAttempt}/2`);
            try {
                this.pc.restartIce();
            } catch (error) {
                console.error('❌ Error restarting ICE:', error);
            }
        }
    }

    updateStatus(status) {
        console.log('📊 Status:', status);
        if (this.onCallStatusChange) {
            this.onCallStatusChange(status);
        }
    }

    closePeerConnection() {
        if (this.pc) {
            try {
                this.pc.onicecandidate = null;
                this.pc.ontrack = null;
                this.pc.oniceconnectionstatechange = null;
                this.pc.onsignalingstatechange = null;
                this.pc.onconnectionstatechange = null;
                this.pc.close();
                console.log('🔒 Peer connection closed');
            } catch (error) {
                console.error('❌ Error closing peer connection:', error);
            }
            this.pc = null;
        }
    }

    cleanup() {
        // console.log('🧹 WebRTCManager: Cleaning up...');

        // Stop local stream
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => {
                track.stop();
                track.enabled = false;
            });
            this.localStream = null;
        }

        // Stop remote stream
        if (this.remoteStream) {
            this.remoteStream.getTracks().forEach(track => {
                track.stop();
                track.enabled = false;
            });
            this.remoteStream = null;
        }

        // Close peer connection
        this.closePeerConnection();

        // Reset state
        this.iceCandidatesQueue = [];
        this.processedAnswer = false;
        this.currentCallId = null;
        this.reconnectionAttempt = 0;
        this.activeCall = null;

        // console.log('✅ WebRTCManager: Cleanup complete');
    }

    getLocalStream() {
        return this.localStream;
    }


    getRemoteStream() {
        return this.remoteStream;
    }

    isActive() {
        return this.pc !== null && this.currentCallId !== null;
    }
}

export const webRTCManager = new WebRTCManager();

if (typeof window !== 'undefined') {
    window.webRTCManager = webRTCManager;
}
