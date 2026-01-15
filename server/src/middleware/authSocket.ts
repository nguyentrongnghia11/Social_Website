import { Socket, ExtendedError } from 'socket.io';
import * as cookies from 'cookie'
import jwt, { JwtPayload, Secret } from 'jsonwebtoken'
import redisClient from '../databases/connectRedis';
import { getPublicKey } from '../services/auth/handlePublicKey.services';
import { MessageService } from '../services/message/message.services';


const KEY_USER_ONLINE_SOCKET = "USER-ONLINE-SOCKET-";
const KEY_GROUP_PREFIX = "GROUP:";
const UNAUTHORIZED_ERROR = "Unauthorized";

export const authSocket = async (socket: Socket, next: (err?: ExtendedError) => void) => {
    try {
        const cookieHeader = socket.handshake.headers.cookie;

        if (!cookieHeader) {
            console.log("No cookie header found");
            return next(new Error(UNAUTHORIZED_ERROR));
        }

        const { accessToken } = cookies.parse(cookieHeader);
        if (!accessToken) {
            console.log("No access token cookies");
            return next(new Error(UNAUTHORIZED_ERROR));
        }

        const infor = jwt.decode(accessToken, { json: true }) as JwtPayload | null;

        console.log(infor?.name)

        if (!infor?.email || !infor?.deviceId) {
            console.log("Invalid token payload");
            return next(new Error(UNAUTHORIZED_ERROR));
        }

        const key = await getPublicKey(infor.email, infor.deviceId) as Secret;

        if (!key) {
            console.log("Public key not found");
            return next(new Error(UNAUTHORIZED_ERROR));
        }

        jwt.verify(accessToken, key, { algorithms: ['RS256'] }, async (err, user) => {
            if (err || !user || typeof user === 'string') {
                return next(new Error(UNAUTHORIZED_ERROR));
            }

            const u = user as JwtPayload;
            const uid = u._id;

            if (!uid) {
                return next(new Error(UNAUTHORIZED_ERROR));
            }

            const messageService = new MessageService();
            let conversationIds: string[] = [];
            try {
                const { conversations } = await messageService.getAllConversationsOfUser(uid);
                conversationIds = conversations.map((conv: any) => conv._id?.toString()).filter(Boolean);
            } catch (err) {
                console.error('Error fetching conversations:', err);
                return next(new Error(UNAUTHORIZED_ERROR));
            }
            await Promise.all([
                redisClient.sAdd(`${KEY_USER_ONLINE_SOCKET}${uid}`, socket.id),
                ...conversationIds.map((convId: string) =>
                    redisClient.sAdd(`${KEY_GROUP_PREFIX}${convId}`, socket.id)
                )
            ]);
            socket.user = { id: uid, name: u.name || '', groups: [] };
            socket.join(conversationIds);
            return next();
        });

    } catch (error) {
        return next(new Error(UNAUTHORIZED_ERROR));
    }
}