import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { emitEvent } from '../helpers/socketHelper';
import { isLoggedIn } from '../helpers/authHelper';

const useVideoCallStore = create(
    devtools(
        (set, get) => ({
            // ============= BASIC STATES =============
            incomingCall: null,
            activeCall: null,
            callStatus: 'idle',
            localStream: null,
            remoteStream: null,

            // ============= SETTERS =============
            setIncomingCall: (call) => set({ incomingCall: call }),
            setActiveCall: (call) => set({ activeCall: call }),
            setCallStatus: (status) => set({ callStatus: status }),
            setLocalStream: (stream) => set({ localStream: stream }),
            setRemoteStream: (stream) => set({ remoteStream: stream }),

            // ============= SOCKET EVENT HANDLERS =============
            handleIncomingCall: ({ callId, callerId, callerName, callerAvatar, conversationId, callType }) => {
                console.log('📱 Incoming call:', callId);
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

            handleCallInitiated: ({ callId, conversationId }) => {
                console.log('Call initiated:', callId);
                const { activeCall } = get();
                if (activeCall) {
                    set({ activeCall: { ...activeCall, callId, conversationId } });
                }
            },

            handleCallOffer: ({ callId, offer }) => {
                console.log('Received offer');
                const { incomingCall, activeCall } = get();
                
                if (incomingCall?.callId === callId) {
                    set({ incomingCall: { ...incomingCall, offer } });
                } else if (activeCall?.callId === callId) {
                    set({ activeCall: { ...activeCall, offer } });
                }
            },

            handleCallAnswer: ({ answer }) => {
                console.log('Received answer socket event');
                const { activeCall } = get();
                if (activeCall) {
                    console.log('Current activeCall:', activeCall.callId, 'isInitiator:', activeCall.isInitiator);
                    set({ 
                        activeCall: { ...activeCall, answer },
                        callStatus: 'active'
                    });
                    console.log('Answer stored in activeCall');
                } else {
                    console.warn('No activeCall when receiving answer');
                }
            },

            handleIceCandidate: ({ callId, candidate }) => {
                console.log('ICE candidate');
                const { activeCall } = get();
                if (activeCall?.callId === callId) {
                    set({
                        activeCall: {
                            ...activeCall,
                            newIceCandidate: candidate,
                            iceCandidateTimestamp: Date.now(),
                        }
                    });
                }
            },

            handleCallEnded: () => {
                console.log('Call ended');
                set({
                    callStatus: 'idle',
                    activeCall: null,
                    incomingCall: null,
                });
            },

            handleCallRejected: ({ reason }) => {
                console.log('Call rejected');
                set({
                    callStatus: 'idle',
                    activeCall: null,
                    incomingCall: null,
                });
                alert(reason || 'Cuộc gọi bị từ chối');
            },

            // ============= CALL CONTROL ACTIONS =============
            startCall: (receiverId, receiverName, receiverAvatar, conversationId, callType = 'video') => {
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

                set({
                    activeCall: {
                        receiverId,
                        receiverName,
                        receiverAvatar,
                        conversationId,
                        callType,
                        isInitiator: true,
                    },
                    callStatus: 'calling'
                });

                return true;
            },

            acceptCall: () => {
                const { incomingCall } = get();
                if (!incomingCall) return;

                set({
                    activeCall: {
                        callId: incomingCall.callId,
                        receiverId: incomingCall.callerId,
                        receiverName: incomingCall.callerName,
                        receiverAvatar: incomingCall.callerAvatar,
                        conversationId: incomingCall.conversationId,
                        callType: incomingCall.callType,
                        isInitiator: false,
                        offer: incomingCall.offer,
                    },
                    callStatus: 'active',
                    incomingCall: null,
                });
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

                set({
                    activeCall: null,
                    incomingCall: null,
                    callStatus: 'idle',
                });
            },

            resetCallState: () => {
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
