/**
 * Migration Script — Backfill Extended Reference Fields
 *
 * Mục đích: Backfill các field mới (author, senderInfo, participants)
 * cho tất cả documents cũ trong MongoDB.
 *
 * Chạy: npx ts-node src/migrations/backfill_extended_refs.ts
 */

import mongoose, { Types } from 'mongoose';
import _Post from '../models/post';
import _Comment from '../models/comment';
import _Notification from '../models/notification';
import _Message from '../models/message';
import _Conversation from '../models/conversation';
import _User from '../models/user';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || '';
const BATCH_SIZE = 100;

let totalUpdated = {
    posts: 0,
    comments: 0,
    notifications: 0,
    messages: 0,
    conversations: 0
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function buildUserMap(userIds: Types.ObjectId[]): Promise<Map<string, any>> {
    const uniqueIds = [...new Set(userIds.map(id => id.toString()))];
    const users = await _User.find({
        _id: { $in: uniqueIds.map(id => new Types.ObjectId(id)) }
    }).select('_id name username avt_url email').lean();

    const map = new Map<string, any>();
    users.forEach(u => map.set(u._id.toString(), u));
    return map;
}

// ─── 1. Backfill Posts ────────────────────────────────────────────────────────

async function backfillPosts() {
    console.log('\n📝 [1/5] Backfilling posts.author...');

    const cursor = (_Post as any).findWithDeleted({ author: { $exists: false } })
        .select('_id artistId')
        .lean()
        .cursor();

    let batch: any[] = [];
    let count = 0;

    for await (const post of cursor) {
        batch.push(post);

        if (batch.length >= BATCH_SIZE) {
            await processBatchPosts(batch);
            count += batch.length;
            batch = [];
            console.log(`  → Processed ${count} posts...`);
        }
    }
    if (batch.length > 0) {
        await processBatchPosts(batch);
        count += batch.length;
    }

    totalUpdated.posts = count;
    console.log(`  ✅ Posts done: ${count} updated`);
}

async function processBatchPosts(posts: any[]) {
    const artistIds = posts.map(p => p.artistId).filter(Boolean);
    const userMap = await buildUserMap(artistIds);

    const ops = posts
        .filter(p => userMap.has(p.artistId?.toString()))
        .map(p => {
            const user = userMap.get(p.artistId.toString());
            return {
                updateOne: {
                    filter: { _id: p._id },
                    update: {
                        $set: {
                            author: {
                                _id: user._id,
                                name: user.name,
                                username: user.username,
                                avt_url: user.avt_url
                            }
                        }
                    }
                }
            };
        });

    if (ops.length > 0) await (_Post as any).bulkWrite(ops);
}

// ─── 2. Backfill Comments ─────────────────────────────────────────────────────

async function backfillComments() {
    console.log('\n💬 [2/5] Backfilling comments.author...');

    const cursor = (_Comment as any).findWithDeleted({ author: { $exists: false } })
        .select('_id userId')
        .lean()
        .cursor();

    let batch: any[] = [];
    let count = 0;

    for await (const comment of cursor) {
        batch.push(comment);

        if (batch.length >= BATCH_SIZE) {
            await processBatchComments(batch);
            count += batch.length;
            batch = [];
            console.log(`  → Processed ${count} comments...`);
        }
    }
    if (batch.length > 0) {
        await processBatchComments(batch);
        count += batch.length;
    }

    totalUpdated.comments = count;
    console.log(`  ✅ Comments done: ${count} updated`);
}

async function processBatchComments(comments: any[]) {
    const userIds = comments.map(c => c.userId).filter(Boolean);
    const userMap = await buildUserMap(userIds);

    const ops = comments
        .filter(c => userMap.has(c.userId?.toString()))
        .map(c => {
            const user = userMap.get(c.userId.toString());
            return {
                updateOne: {
                    filter: { _id: c._id },
                    update: {
                        $set: {
                            author: {
                                _id: user._id,
                                name: user.name,
                                avt_url: user.avt_url
                            }
                        }
                    }
                }
            };
        });

    if (ops.length > 0) await (_Comment as any).bulkWrite(ops);
}

// ─── 3. Backfill Notifications ────────────────────────────────────────────────

async function backfillNotifications() {
    console.log('\n🔔 [3/5] Backfilling notifications.senderInfo...');

    const cursor = _Notification.find({
        sender: { $exists: true, $ne: null },
        senderInfo: { $exists: false }
    })
        .select('_id sender')
        .lean()
        .cursor();

    let batch: any[] = [];
    let count = 0;

    for await (const notif of cursor) {
        batch.push(notif);

        if (batch.length >= BATCH_SIZE) {
            await processBatchNotifications(batch);
            count += batch.length;
            batch = [];
            console.log(`  → Processed ${count} notifications...`);
        }
    }
    if (batch.length > 0) {
        await processBatchNotifications(batch);
        count += batch.length;
    }

    totalUpdated.notifications = count;
    console.log(`  ✅ Notifications done: ${count} updated`);
}

async function processBatchNotifications(notifs: any[]) {
    const senderIds = notifs.map(n => n.sender).filter(Boolean);
    const userMap = await buildUserMap(senderIds);

    const ops = notifs
        .filter(n => userMap.has(n.sender?.toString()))
        .map(n => {
            const user = userMap.get(n.sender.toString());
            return {
                updateOne: {
                    filter: { _id: n._id },
                    update: {
                        $set: {
                            senderInfo: {
                                _id: user._id,
                                name: user.name,
                                avt_url: user.avt_url
                            }
                        }
                    }
                }
            };
        });

    if (ops.length > 0) await _Notification.bulkWrite(ops as any);
}

// ─── 4. Backfill Messages ─────────────────────────────────────────────────────

async function backfillMessages() {
    console.log('\n✉️  [4/5] Backfilling messages.senderInfo...');

    const cursor = _Message.find({ senderInfo: { $exists: false } })
        .select('_id senderId')
        .lean()
        .cursor();

    let batch: any[] = [];
    let count = 0;

    for await (const msg of cursor) {
        batch.push(msg);

        if (batch.length >= BATCH_SIZE) {
            await processBatchMessages(batch);
            count += batch.length;
            batch = [];
            console.log(`  → Processed ${count} messages...`);
        }
    }
    if (batch.length > 0) {
        await processBatchMessages(batch);
        count += batch.length;
    }

    totalUpdated.messages = count;
    console.log(`  ✅ Messages done: ${count} updated`);
}

async function processBatchMessages(messages: any[]) {
    const senderIds = messages.map(m => m.senderId).filter(Boolean);
    const userMap = await buildUserMap(senderIds);

    const ops = messages
        .filter(m => userMap.has(m.senderId?.toString()))
        .map(m => {
            const user = userMap.get(m.senderId.toString());
            return {
                updateOne: {
                    filter: { _id: m._id },
                    update: {
                        $set: {
                            senderInfo: {
                                _id: user._id,
                                name: user.name,
                                avt_url: user.avt_url
                            }
                        }
                    }
                }
            };
        });

    if (ops.length > 0) await _Message.bulkWrite(ops as any);
}

// ─── 5. Backfill Conversations ────────────────────────────────────────────────

async function backfillConversations() {
    console.log('\n🗨️  [5/5] Backfilling conversations.participants...');

    // Query cả participants chưa tồn tại VÀ participants rổng [] (do default: [] trong schema mới)
    const cursor = _Conversation.find({
        $or: [
            { participants: { $exists: false } },
            { participants: { $size: 0 } }
        ]
    })
        .select('_id senderId receiverId participantIds type')
        .lean()
        .cursor();

    let batch: any[] = [];
    let count = 0;

    for await (const conv of cursor) {
        batch.push(conv);

        if (batch.length >= BATCH_SIZE) {
            await processBatchConversations(batch);
            count += batch.length;
            batch = [];
            console.log(`  → Processed ${count} conversations...`);
        }
    }
    if (batch.length > 0) {
        await processBatchConversations(batch);
        count += batch.length;
    }

    totalUpdated.conversations = count;
    console.log(`  ✅ Conversations done: ${count} updated`);
}

async function processBatchConversations(convs: any[]) {
    // Thu thập tất cả user IDs: từ participantIds (model mới) HOẶC senderId/receiverId (cũ)
    const allUserIds = convs.flatMap(c => {
        if (Array.isArray(c.participantIds) && c.participantIds.length > 0) return c.participantIds;
        return [c.senderId, c.receiverId].filter(Boolean);
    });
    const userMap = await buildUserMap(allUserIds);

    const ops = convs
        .map(c => {
            const participants: any[] = [];

            if (Array.isArray(c.participantIds) && c.participantIds.length > 0) {
                // Model mới: dùng participantIds
                c.participantIds.forEach((id: any) => {
                    const user = userMap.get(id?.toString());
                    if (user) participants.push({ _id: user._id, name: user.name, avt_url: user.avt_url, email: user.email });
                });
            } else {
                // Model cũ: dùng senderId/receiverId
                const sender = userMap.get(c.senderId?.toString());
                const receiver = userMap.get(c.receiverId?.toString());
                if (sender) participants.push({ _id: sender._id, name: sender.name, avt_url: sender.avt_url, email: sender.email });
                if (receiver) participants.push({ _id: receiver._id, name: receiver.name, avt_url: receiver.avt_url, email: receiver.email });
            }

            if (participants.length === 0) return null; // skip nếu không tìm được user

            // Backfill cả participantIds nếu chưa có (model cũ chỉ có senderId/receiverId)
            const updateSet: any = { participants };
            if (!c.participantIds || c.participantIds.length === 0) {
                const legacyIds = [c.senderId, c.receiverId].filter(Boolean);
                if (legacyIds.length > 0) updateSet.participantIds = legacyIds;
            }

            return {
                updateOne: {
                    filter: { _id: c._id },
                    update: { $set: updateSet }
                }
            };
        })
        .filter(Boolean);

    if (ops.length > 0) await _Conversation.bulkWrite(ops as any);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
    console.log('🚀 Starting migration: Backfill Extended Reference Fields');
    console.log(`   Connecting to: ${MONGO_URI.replace(/:([^:@]+)@/, ':****@')}`);

    await mongoose.connect(MONGO_URI);
    console.log('   ✅ MongoDB connected\n');

    const startTime = Date.now();

    await backfillPosts();
    await backfillComments();
    await backfillNotifications();
    await backfillMessages();
    await backfillConversations();

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log('\n═══════════════════════════════════════');
    console.log('✅ Migration Complete!');
    console.log(`   Posts updated:         ${totalUpdated.posts}`);
    console.log(`   Comments updated:      ${totalUpdated.comments}`);
    console.log(`   Notifications updated: ${totalUpdated.notifications}`);
    console.log(`   Messages updated:      ${totalUpdated.messages}`);
    console.log(`   Conversations updated: ${totalUpdated.conversations}`);
    console.log(`   Total time: ${duration}s`);
    console.log('═══════════════════════════════════════\n');

    await mongoose.disconnect();
    process.exit(0);
}

main().catch(err => {
    console.error('❌ Migration failed:', err);
    process.exit(1);
});
