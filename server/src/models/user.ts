
import { Schema, Document, model, Types } from 'mongoose'

export enum Role {
    Admin = 'admin',
    User = 'user'
}

export interface IUser extends Document {
    _id: Types.ObjectId;
    name: string;
    email: string;
    role: Role;
    password: string;
    imgUrl?: string;
    type: 'local' | 'google';
    postId: Array<any>;
    tokenFcms: Array<any>
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
    tokenFcms: [
        {
            type: String,
            default: []
        }
    ]
})


export default model<IUser>('User', userSchema);