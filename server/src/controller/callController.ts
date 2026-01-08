import { Request, Response, NextFunction } from 'express';
import { IUser } from '../models/user';
import callService from '../services/call/call.services';

// Get call history
export const getCallHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = req.user as IUser;
        const { page = 1, limit = 20 } = req.query;

        const result = await callService.getCallHistory(user._id.toString(), Number(page), Number(limit));

        return res.status(200).json({
            message: 'Call history retrieved successfully',
            result
        });
    } catch (error) {
        next(error);
    }
};

// Get calls by conversation
export const getCallsByConversation = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { conversationId } = req.params;
        const { page = 1, limit = 20 } = req.query;

        const result = await callService.getCallsByConversation(conversationId, Number(page), Number(limit));

        return res.status(200).json({
            message: 'Conversation calls retrieved successfully',
            result
        });
    } catch (error) {
        next(error);
    }
};

// Get call by ID
export const getCallById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { callId } = req.params;

        const call = await callService.getCallById(callId);

        return res.status(200).json({
            message: 'Call retrieved successfully',
            result: call
        });
    } catch (error) {
        next(error);
    }
};

// Delete call history
export const deleteCallHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { callId } = req.params;
        const user = req.user as IUser;

        await callService.deleteCallHistory(callId, user._id.toString());

        return res.status(200).json({
            message: 'Call deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};


export const initiateCall = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = req.user as IUser;
        const { receiverId, conversationId, callType } = req.body;

        if (!receiverId || !conversationId || !callType) {
            return res.status(400).json({
                message: 'Missing required fields: receiverId, conversationId, callType'
            });
        }

        if (!['audio', 'video'].includes(callType)) {
            return res.status(400).json({
                message: 'Invalid call type. Must be "audio" or "video"'
            });
        }

        const call = await callService.initiateCall(
            user._id.toString(),
            receiverId,
            conversationId,
            callType
        );

        return res.status(201).json({
            message: 'Call initiated successfully',
            result: call
        });
    } catch (error) {
        next(error);
    }
};

// Accept call
export const acceptCall = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { callId } = req.params;
        const user = req.user as IUser;

        const call = await callService.acceptCall(callId, user._id.toString());

        return res.status(200).json({
            message: 'Call accepted successfully',
            result: call
        });
    } catch (error) {
        next(error);
    }
};

// Reject call
export const rejectCall = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { callId } = req.params;
        const user = req.user as IUser;

        const call = await callService.rejectCall(callId, user._id.toString());

        return res.status(200).json({
            message: 'Call rejected successfully',
            result: call
        });
    } catch (error) {
        next(error);
    }
};

// End call
export const endCall = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { callId } = req.params;
        const user = req.user as IUser;

        const call = await callService.endCall(callId, user._id.toString());

        return res.status(200).json({
            message: 'Call ended successfully',
            result: call
        });
    } catch (error) {
        next(error);
    }
};

// Update call status (admin or system use)
export const updateCallStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { callId } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({
                message: 'Missing required field: status'
            });
        }

        const validStatuses = ['calling', 'accepted', 'rejected', 'missed', 'ended'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
            });
        }

        const call = await callService.updateCallStatus(callId, status);

        return res.status(200).json({
            message: 'Call status updated successfully',
            result: call
        })
    } catch (error) {
        next(error);
    }
};



