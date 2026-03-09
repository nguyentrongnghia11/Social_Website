import { Model } from 'mongoose';

import { Schema, Document, model, Types } from 'mongoose'
import { type } from 'os';

export enum Role {
    Admin = 'admin',
    User = 'user',
    Moderator = 'moderator'
}

export interface IUser extends Document {
    _id: Types.ObjectId;
    name: string;
    email: string;
    role: Role;
    permissions: string[];
    password: string;
    imgUrl?: string;
    type: 'local' | 'google';
    postId: Array<any>;
    tokenFcms: Array<any>,
    avt_url?: string;
    status: 'active' | 'banned' | 'suspended';
    followers: Array<Types.ObjectId>;
    following: Array<Types.ObjectId>;
    loginHistory: Array<{
        action: string;
        ip: string;
        userAgent?: string;
        timestamp: Date;
    }>;
    lastLoginAt?: Date;
    totalUnreadCount: number;
}

const userSchema = new Schema<IUser>({

    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: Object.values(Role),
        required: true,
        default: Role.Admin
    },
    permissions: [{
        type: String,
        default: []
    }],
    password: {
        type: String,
        required: function (this: any) {
            return this.type === 'local';
        }
    },

    imgUrl: {

        type: String,
        required: false
    },

    type: {
        type: String,
        enum: ['local', 'google'],
        required: true

    },

    postId: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Post',
            default: []
        }
    ],
    avt_url: { type: String, require: false },
    tokenFcms: [
        {
            type: String,
            default: []
        }
    ],
    status: {
        type: String,
        enum: ['active', 'banned', 'suspended'],
        default: 'active'
    },
    followers: [
        {
            type: Schema.Types.ObjectId,
            ref: 'User',
            default: []
        }
    ],
    following: [
        {
            type: Schema.Types.ObjectId,
            ref: 'User',
            default: []
        }
    ],
    loginHistory: [
        {
            action: { type: String },
            ip: { type: String },
            userAgent: { type: String },
            timestamp: { type: Date, default: Date.now }
        }
    ],
    lastLoginAt: {
        type: Date
    },
    totalUnreadCount: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

userSchema.index({ email: 1 });
userSchema.index({ name: 1 });
userSchema.index({ email: 1, type: 1 });

export default model<IUser>('User', userSchema);