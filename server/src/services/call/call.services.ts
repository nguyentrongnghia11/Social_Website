import _Call from '../../models/call';
import { Types } from 'mongoose';
import { ErrorApi } from '../../middleware/error';

export class CallService {
    async getCallHistory(userId: string, page: number = 1, limit: number = 20) {
        const userIdObj = new Types.ObjectId(userId);

        const calls = await _Call.find({
            $or: [
                { callerId: userIdObj },
                { receiverId: userIdObj }
            ]
        })
            .populate('callerId', 'name email avatar')
            .populate('receiverId', 'name email avatar')
            .populate('conversationId')
            .sort({ createdAt: -1 })
            .limit(Number(limit))
            .skip((Number(page) - 1) * Number(limit))
            .lean();

        const total = await _Call.countDocuments({
            $or: [
                { callerId: userIdObj },
                { receiverId: userIdObj }
            ]
        });

        return {
            calls,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / Number(limit))
            }
        };
    }

    async getCallsByConversation(conversationId: string, page: number = 1, limit: number = 20) {
        const calls = await _Call.find({ conversationId })
            .populate('callerId', 'name email avatar')
            .populate('receiverId', 'name email avatar')
            .sort({ createdAt: -1 })
            .limit(Number(limit))
            .skip((Number(page) - 1) * Number(limit))
            .lean();

        const total = await _Call.countDocuments({ conversationId });

        return {
            calls,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / Number(limit))
            }
        };
    }

    async getCallById(callId: string) {
        const call = await _Call.findById(callId)
            .populate('callerId', 'name email avatar')
            .populate('receiverId', 'name email avatar')
            .populate('conversationId')
            .lean();

        if (!call) {
            throw new ErrorApi(404, 'Call not found');
        }

        return call;
    }

    async deleteCallHistory(callId: string, userId: string) {
        const call = await _Call.findById(callId);

        if (!call) {
            throw new ErrorApi(404, 'Call not found');
        }

        // Verify user is part of the call
        if (call.callerId.toString() !== userId && call.receiverId.toString() !== userId) {
            throw new ErrorApi(403, 'Unauthorized to delete this call');
        }

        await _Call.findByIdAndDelete(callId);

        return { success: true };
    }

    // WebRTC Call Methods
    async initiateCall(callerId: string, receiverId: string, conversationId: string, callType: 'audio' | 'video') {
        try {
            console.log('[CallService] Initiating call:', { callerId, receiverId, conversationId, callType });

            const call = await _Call.create({
                callerId,
                receiverId,
                conversationId,
                callType,
                status: 'calling'
            });

            console.log('[CallService] Call created in DB:', call._id);

            const populatedCall = await _Call.findById(call._id)
                .populate('callerId', 'name email avatar')
                .populate('receiverId', 'name email avatar')
                .lean();

            console.log('[CallService] Call populated successfully');

            return populatedCall;
        } catch (error: any) {
            console.error('[CallService] Error creating call:', {
                error: error.message,
                code: error.code,
                name: error.name,
                callerId,
                receiverId,
                conversationId
            });
            throw error;
        }
    }

    async acceptCall(callId: string, userId: string) {
        const call = await _Call.findById(callId);

        if (!call) {
            throw new ErrorApi(404, 'Call not found');
        }

        if (call.receiverId.toString() !== userId) {
            throw new ErrorApi(403, 'Unauthorized to accept this call');
        }

        if (call.status !== 'calling') {
            throw new ErrorApi(400, 'Call is not in calling state');
        }

        call.status = 'accepted';
        call.startTime = new Date();
        await call.save();

        return call;
    }

    async rejectCall(callId: string, userId: string) {
        const call = await _Call.findById(callId);

        if (!call) {
            throw new ErrorApi(404, 'Call not found');
        }

        if (call.receiverId.toString() !== userId) {
            throw new ErrorApi(403, 'Unauthorized to reject this call');
        }

        if (call.status !== 'calling') {
            throw new ErrorApi(400, 'Call is not in calling state');
        }

        call.status = 'rejected';
        await call.save();

        return call;
    }

    async endCall(callId: string, userId: string) {
        const call = await _Call.findById(callId);

        if (!call) {
            throw new ErrorApi(404, 'Call not found');
        }

        if (call.callerId.toString() !== userId && call.receiverId.toString() !== userId) {
            throw new ErrorApi(403, 'Unauthorized to end this call');
        }

        call.status = 'ended';
        call.endTime = new Date();

        if (call.startTime) {
            const durationMs = call.endTime.getTime() - call.startTime.getTime();
            call.duration = Math.floor(durationMs / 1000);
        }

        await call.save();

        return call;
    }

    async markCallAsMissed(callId: string) {
        const call = await _Call.findById(callId);

        if (!call) {
            throw new ErrorApi(404, 'Call not found');
        }

        if (call.status === 'calling') {
            call.status = 'missed';
            await call.save();
        }

        return call;
    }

    async updateCallStatus(callId: string, status: 'calling' | 'accepted' | 'rejected' | 'missed' | 'ended') {
        const call = await _Call.findById(callId);

        if (!call) {
            throw new ErrorApi(404, 'Call not found');
        }

        call.status = status;

        if (status === 'accepted' && !call.startTime) {
            call.startTime = new Date();
        }

        if (status === 'ended') {
            call.endTime = new Date();
            if (call.startTime) {
                const durationMs = call.endTime.getTime() - call.startTime.getTime();
                call.duration = Math.floor(durationMs / 1000);
            }
        }

        await call.save();

        return call;
    }
}

export default new CallService();
