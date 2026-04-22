/**
 * Migration: Backfill post.media[] từ files collection
 *
 * Chạy: npx ts-node --files src/migrations/backfill_post_media.ts
 */
import mongoose, { Types } from 'mongoose';
import _Post from '../models/post';
import _File from '../models/file';
import dotenv from 'dotenv';

dotenv.config();
const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || '';
const BATCH_SIZE = 50;

async function main() {
    console.log('🚀 Backfill post.media[] from files collection');
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB connected\n');

    // Lấy tất cả post chưa có media[] (hoặc media rỗng nhưng có files)
    const posts = await (_Post as any).findWithDeleted({}).select('_id imageCount videoCount thumbnail').lean();
    console.log(`📋 Found ${posts.length} total posts`);

    let updated = 0;
    let skipped = 0;

    for (let i = 0; i < posts.length; i += BATCH_SIZE) {
        const batch = posts.slice(i, i + BATCH_SIZE);
        const postIds = batch.map((p: any) => p._id);

        // Lấy tất cả files của batch này
        const files = await _File.find({ postId: { $in: postIds } }).lean();

        if (files.length === 0) {
            skipped += batch.length;
            continue;
        }

        // Group files theo postId
        const filesByPost = new Map<string, any[]>();
        files.forEach((f: any) => {
            const key = f.postId.toString();
            if (!filesByPost.has(key)) filesByPost.set(key, []);
            filesByPost.get(key)!.push(f);
        });

        // Build bulk write ops
        const ops: any[] = [];
        for (const post of batch) {
            const postFiles = filesByPost.get(post._id.toString());
            if (!postFiles || postFiles.length === 0) {
                skipped++;
                continue;
            }

            const mediaItems = postFiles.map((f: any) => ({
                url: f.secure_url,
                resource_type: f.resource_type === 'video' ? 'video' : 'image' as 'image' | 'video',
                public_id: f.public_id,
                bytes: f.bytes,
                width: f.width,
                height: f.height,
                format: f.format
            }));

            const images = mediaItems.filter(m => m.resource_type === 'image');
            const videos = mediaItems.filter(m => m.resource_type === 'video');
            const thumbnail = images[0]?.url || null;

            ops.push({
                updateOne: {
                    filter: { _id: post._id },
                    update: {
                        $set: {
                            media: mediaItems,
                            imageCount: images.length,
                            videoCount: videos.length,
                            ...(thumbnail && { thumbnail })
                        }
                    }
                }
            });
        }

        if (ops.length > 0) {
            await (_Post as any).bulkWrite(ops);
            updated += ops.length;
        }

        console.log(`  → Processed ${Math.min(i + BATCH_SIZE, posts.length)}/${posts.length}...`);
    }

    console.log('\n═══════════════════════════════════');
    console.log('✅ Migration complete!');
    console.log(`   Posts updated:  ${updated}`);
    console.log(`   Posts skipped:  ${skipped} (no files)`);
    console.log('═══════════════════════════════════\n');

    await mongoose.disconnect();
    process.exit(0);
}

main().catch(err => {
    console.error('❌ Migration failed:', err);
    process.exit(1);
});
