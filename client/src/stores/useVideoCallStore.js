import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { emitEvent } from '../helpers/socketHelper';
import { isLoggedIn } from '../helpers/authHelper';
import { webRTCManager } from '../managers/WebRTCManager';

const useVideoCallStore = create(
    devtools(
        (set, get) => ({
            // state
            incomingCall: null,
            activeCall: null,
            callStatus: 'idle',
            localStream: null,
            remoteStream: null,
            pendingCandidates: [], // Queue for candidates arriving before call accepted

            // // setter
            // setIncomingCall: (call) => set({ incomingCall: call }),
            // setActiveCall: (call) => set({ activeCall: call }),
            // setCallStatus: (status) => set({ callStatus: status }),
            // setLocalStream: (stream) => set({ localStream: stream }),
            // setRemoteStream: (stream) => set({ remoteStream: stream }),

            // #2 only set state
            handleIncomingCall: ({ callId, callerId, callerName, callerAvatar, conversationId, callType }) => {
                console.log('Incoming call:', callId);
                set({
                    incomingCall: {
                        callId,
                        callerId,
                        callerName,
                        callerAvatar,
                        conversationId,
                        callType,
                    },
                    callStatus: 'ringing',
                });
            },


            // #3 (chạy sao handle incoming)
            handleCallInitiated: async ({ callId, conversationId }) => {
                console.log('Call initiated with ID:', callId);
                const { activeCall, initializeWebRTCForCaller } = get();
                
                if (activeCall) {
                    const updatedCall = { ...activeCall, callId, conversationId };
                    set({ activeCall: updatedCall });
                    
                    await initializeWebRTCForCaller();
                }
            },

            // #4 (chạy sau khi nhận offer tu server) 
            handleCallOffer: async ({ callId, offer }) => {
                const { incomingCall, activeCall } = get();
                
                // Store offer in state for reference
                if (incomingCall?.callId === callId) {
                    set({ incomingCall: { ...incomingCall, offer } });
                } else if (activeCall?.callId === callId) {
                    set({ activeCall: { ...activeCall, offer } });
                }

                if (webRTCManager.isActive() && webRTCManager.currentCallId === callId) {
                    await webRTCManager.handleReceivedOffer(offer);
                }
            },


            // #5 (chạy sau khi nhận answer tu server)
            handleCallAnswer: async ({ answer }) => {
                const { activeCall } = get();
                
                if (!activeCall) {
                    console.warn('No activeCall');
                    return;
                }                
                await webRTCManager.handleReceivedAnswer(answer);
                
                set({ 
                    activeCall: { ...activeCall, answer },
                    callStatus: 'Đang kết nối...'
                });
            },


            // #6 (chạy sau khi nhận candidate tu server)
            handleIceCandidate: async ({ callId, candidate, fromUserId }) => {
                console.log('Received ICE candidate', { callId, fromUserId });
                const { activeCall, incomingCall, pendingCandidates } = get();
                
                if (!activeCall && !incomingCall) {
                    console.warn('❌ No active or incoming call - ignoring ICE candidate');
                    return;
                }
                
                // If call is ringing (not yet accepted), queue the candidate
                if (!activeCall && incomingCall) {
                    if (incomingCall.callId === callId) {
                        console.log('⏳ Call not accepted yet, queueing candidate');
                        set({ pendingCandidates: [...pendingCandidates, candidate] });
                        return;
                    } else {
                        console.warn(`❌ ICE candidate for different call. Incoming: ${incomingCall.callId}, Received: ${callId}`);
                        return;
                    }
                }
                
                if (activeCall?.callId !== callId) {
                    console.warn(`❌ ICE candidate for different call. Active: ${activeCall.callId}, Received: ${callId}`);
                    return;
                }
                
                await webRTCManager.addIceCandidate(candidate);

            },

            handleCallEnded: () => {
                console.log('Call ended ');
                
                webRTCManager.cleanup();
                
                // reset state
                set({
                    callStatus: 'idle',
                    activeCall: null,
                    incomingCall: null,
                    localStream: null,
                    remoteStream: null,
                });
            },

            handleCallRejected: ({ reason }) => {
                webRTCManager.cleanup();
                set({
                    callStatus: 'idle',
                    activeCall: null,
                    incomingCall: null,
                    localStream: null,
                    remoteStream: null,
                });
                alert(reason || 'Cuộc gọi bị từ chối');
            },


            // #1 (co set active call)

            startCall: async (receiverId, receiverName, receiverAvatar, conversationId, callType = 'video') => {
                const { callStatus } = get();
                if (callStatus !== 'idle') {
                    alert('Bạn đang trong cuộc gọi');
                    return false;
                }

                const user = isLoggedIn();
                const callerId = user?.user?._id || user?._id || user;
                const callerName = user?.user?.name || user?.username;
                const callerAvatar = user?.user?.avatar || user?.user?.imgUrl || '';

                if (!callerId) {
                    alert('Lỗi: Không xác định được người dùng');
                    return false;
                }

                const emitSuccess = emitEvent('call-initiate', {
                    callerId,
                    receiverId,
                    conversationId,
                    callType,
                    callerName,
                    callerAvatar,
                });

                if (!emitSuccess) {
                    alert('Chưa kết nối socket');
                    return false;
                }

                const tempActiveCall = {
                    receiverId,
                    receiverName,
                    receiverAvatar,
                    conversationId,
                    callType,
                    isInitiator: true,
                };

                set({
                    activeCall: tempActiveCall,
                    callStatus: 'calling'
                });

                return true;
            },

            initializeWebRTCForCaller: async () => {
                const { activeCall } = get();
                if (!activeCall || !activeCall.isInitiator || !activeCall.callId) {
                    console.warn('Cannot initialize WebRTC: No active call or not initiator');
                    return;
                }

                try {
                    webRTCManager.onLocalStreamReady = (stream) => {
                        set({ localStream: stream });
                    };
                    webRTCManager.onRemoteStreamReady = (stream) => {
                        set({ remoteStream: stream });
                    };
                    webRTCManager.onCallStatusChange = (status) => {
                        set({ callStatus: status });
                    };
                    webRTCManager.onCallEnd = (reason) => {
                        if (reason) alert(reason);
                        get().endCall();
                    };

                    await webRTCManager.initialize(activeCall, (status) => {
                        set({ callStatus: status });
                    });
                } catch (error) {
                    console.error('Failed to initialize WebRTC:', error);
                    alert('Không thể truy cập camera/mic. Vui lòng kiểm tra quyền truy cập.');
                    get().endCall();
                }
            },

            acceptCall: async () => {
                const { incomingCall, pendingCandidates } = get();
                if (!incomingCall) return;

                const activeCallData = {
                    callId: incomingCall.callId,
                    receiverId: incomingCall.callerId,
                    receiverName: incomingCall.callerName,
                    receiverAvatar: incomingCall.callerAvatar,
                    conversationId: incomingCall.conversationId,
                    callType: incomingCall.callType,
                    isInitiator: false,
                    offer: incomingCall.offer,
                };

                set({
                    activeCall: activeCallData,
                    callStatus: 'active',
                    incomingCall: null,
                    pendingCandidates: [], // Clear queue
                });

                try {
                    webRTCManager.onLocalStreamReady = (stream) => {
                        set({ localStream: stream });
                    };
                    webRTCManager.onRemoteStreamReady = (stream) => {
                        set({ remoteStream: stream });
                    };
                    webRTCManager.onCallStatusChange = (status) => {
                        set({ callStatus: status });
                    };
                    webRTCManager.onCallEnd = (reason) => {
                        if (reason) alert(reason);
                        get().endCall();
                    };

                    await webRTCManager.initialize(activeCallData, (status) => {
                        set({ callStatus: status });
                    });

                    if (incomingCall.offer) {
                        await webRTCManager.handleReceivedOffer(incomingCall.offer);
                        
                        // Process pending ICE candidates that arrived while ringing
                        if (pendingCandidates.length > 0) {
                            console.log(`📦 Processing ${pendingCandidates.length} pending ICE candidates...`);
                            for (const candidate of pendingCandidates) {
                                try {
                                    await webRTCManager.addIceCandidate(candidate);
                                } catch (error) {
                                    console.error('Error adding pending candidate:', error);
                                }
                            }
                            console.log('✅ All pending candidates processed');
                        }
                    }
                } catch (error) {
                    console.error('Failed to initialize WebRTC:', error);
                    alert('Không thể truy cập camera/mic. Vui lòng kiểm tra quyền truy cập.');
                    get().endCall();
                }
            },

            rejectCall: () => {
                const { incomingCall } = get();
                if (!incomingCall) return;

                emitEvent('call-reject', {
                    callId: incomingCall.callId,
                    callerId: incomingCall.callerId,
                    reason: 'Call rejected by user'
                });

                set({
                    incomingCall: null,
                    callStatus: 'idle',
                    pendingCandidates: [], // Clear pending queue
                });
            },

            endCall: () => {
                const { activeCall } = get();

                if (activeCall?.callId) {
                    emitEvent('call-end', {
                        callId: activeCall.callId,
                        otherUserId: activeCall.receiverId
                    });
                }

                webRTCManager.cleanup();

                set({
                    activeCall: null,
                    incomingCall: null,
                    callStatus: 'idle',
                    localStream: null,
                    remoteStream: null,
                    pendingCandidates: [], // Clear pending queue
                });
            },

            resetCallState: () => {
                webRTCManager.cleanup();
                
                set({
                    incomingCall: null,
                    activeCall: null,
                    callStatus: 'idle',
                    localStream: null,
                    remoteStream: null,
                });
            },
        }),
        { name: 'VideoCallStore' }
    )
);

export default useVideoCallStore;
