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
    iceCandidatePoolSize: 10 
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

        this.onLocalStreamReady = null;
        this.onRemoteStreamReady = null;
        this.onCallStatusChange = null;
        this.onCallEnd = null;
    }

    async initialize(callData, statusCallback) {

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
                
                const emitted = emitEvent('call-ice-candidate', {
                    callId: this.currentCallId,
                    targetUserId: this.activeCall.receiverId,
                    candidate: event.candidate,
                });
                
                if (!emitted) {
                    console.error(`FAILED to send ${c.type} candidate - Socket disconnected!`);
                }
            } else if (!event.candidate) {
                console.log('ICE gathering complete');
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
            console.log('Connection state:', this.pc.connectionState);

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
                    // try {
                    //     const stats = await this.pc.getStats();
                    //     stats.forEach(report => {
                    //         if (report.type === 'candidate-pair' && report.state === 'succeeded') {
                    //             console.log('🎯 Selected candidate pair:', {
                    //                 local: report.localCandidateId,
                    //                 remote: report.remoteCandidateId,
                    //                 priority: report.priority
                    //             });
                    //         }
                    //         if (report.type === 'local-candidate' && report.candidateType) {
                    //             console.log(`📍 Local: ${report.candidateType} | ${report.ip || 'N/A'}:${report.port || 'N/A'}`);
                    //         }
                    //         if (report.type === 'remote-candidate' && report.candidateType) {
                    //             console.log(`📍 Remote: ${report.candidateType} | ${report.ip || 'N/A'}:${report.port || 'N/A'}`);
                    //         }
                    //     });
                    // } catch (e) {
                    //     console.warn('Could not get stats:', e.message);
                    // }
                    break;

                case 'disconnected':
                    this.updateStatus('Mất kết nối');
                    console.warn('ICE disconnected - May be network issue');
                    this.handleReconnection();
                    break;

                case 'failed':
                    this.updateStatus('Kết nối thất bại - Có thể do NAT/Firewall');
                    console.error('ICE failed - TURN server may not be working!');
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
            await this.pc.setRemoteDescription(new RTCSessionDescription(offer));
            // RECEIVER Remote description (offer) set;
            
            const answerDesc = await this.pc.createAnswer();
            await this.pc.setLocalDescription(answerDesc);
            // RECEIVER Local description (answer) set');

            emitEvent('call-answer', {
                callId: this.currentCallId,
                callerId: this.activeCall.receiverId,
                answer: answerDesc,
            });
            console.log('📤 rec answer sent to caller');

            this.updateStatus('Đang kết nối...');
        } catch (error) {
            console.error('Error handling offer:', error);
            this.updateStatus('Lỗi kết nối');
        }
    }

    async handleReceivedAnswer(answer) {

        if (!this.pc) {
            console.error('No peer connection');
            return;
        }
        
        if (this.pc.signalingState !== 'have-local-offer') {
            console.warn('Wrong signaling state:', this.pc.signalingState);
            return;
        }

        if (this.processedAnswer) {
            console.warn('Answer already processed');
            return;
        }

        try {
            this.processedAnswer = true;
            await this.pc.setRemoteDescription(new RTCSessionDescription(answer));
            console.log('caller setting remote description (answer)...');
            this.updateStatus('Đang kết nối...');
        } catch (error) {
            console.error('caller error handling answer:', error);
            this.updateStatus('Lỗi kết nối');
            this.processedAnswer = false;
        }
    }

    // Helper to parse candidate info from candidate string
    parseCandidateInfo(candidate) {
        try {
            const candidateStr = candidate.candidate || '';
            const parts = candidateStr.split(' ');
            
            // Find 'typ' keyword
            const typIndex = parts.indexOf('typ');
            const type = typIndex >= 0 && parts[typIndex + 1] ? parts[typIndex + 1] : 'unknown';
            const address = parts[4] || 'N/A';
            const port = parts[5] || '';
            
            return { type, address, port, full: candidateStr.substring(0, 50) };
        } catch (e) {
            return { type: 'unknown', address: 'N/A', port: '', full: '' };
        }
    }

    async addIceCandidate(candidate) {
        const info = this.parseCandidateInfo(candidate);
        console.log(`Received ICE candidate: ${info.type} | ${info.address}:${info.port}`);
        
        if (!this.pc) {
            console.error('No peer connection available');
            return;
        }

        const hasRemoteDesc = this.pc.remoteDescription && this.pc.remoteDescription.type;

        if (hasRemoteDesc) {
            try {
                await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
                console.log(`Added candidate`);
            } catch (error) {
                console.error(`Error adding candidate:`, error.message);
            }
        } else {
            this.iceCandidatesQueue.push(candidate);
            if (this.iceCandidatesQueue.length >= 5) {
                console.log(`Queue size: ${this.iceCandidatesQueue.length}`);
                await this.processQueuedIceCandidates();
            }
        }
    }

    async processQueuedIceCandidates() {
        // Check if remote description is set
        if (!this.pc.remoteDescription) {
            console.log('Cannot process queue yet');
            return;
        }
        
        if (this.iceCandidatesQueue.length === 0) {
            return; // Silent return, no need to warn
        }
                
        const typeCounts = { host: 0, srflx: 0, relay: 0, unknown: 0 };
        
        while (this.iceCandidatesQueue.length > 0) {
            const candidate = this.iceCandidatesQueue.shift();
            const info = this.parseCandidateInfo(candidate);
            typeCounts[info.type] = (typeCounts[info.type] || 0) + 1;
            
            try {
                await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (error) {
                console.error(`Error processing queued ${info.type} candidate:`, error.message);
            }
        }

        console.log('All queued candidates processed:', typeCounts);
    }

    handleReconnection() {
        if (this.reconnectionAttempt >= 3) {
            console.warn('⚠️ Max reconnection attempts reached');
            return;
        }

        setTimeout(() => {
            if (this.pc && this.pc.iceConnectionState === 'disconnected') {
                this.reconnectionAttempt++;
                try {
                    this.pc.restartIce();
                } catch (error) {
                    console.error('Error restarting ICE:', error);
                }
            }
        }, 5000);
    }

    handleConnectionFailure() {
        if (this.reconnectionAttempt >= 2) {
            setTimeout(() => {
                if (this.pc && this.pc.iceConnectionState === 'failed') {
                    console.error('Connection failed after retries');
                    if (this.onCallEnd) {
                        this.onCallEnd('Không thể kết nối. Vui lòng thử lại.');
                    }
                }
            }, 3000);
        } else {
            this.reconnectionAttempt++;
            try {
                this.pc.restartIce();
            } catch (error) {
                console.error('Error restarting ICE:', error);
            }
        }
    }

    updateStatus(status) {
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
                console.log('Peer connection closed');
            } catch (error) {
                console.error('Error closing peer connection:', error);
            }
            this.pc = null;
        }
    }

    cleanup() {
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
