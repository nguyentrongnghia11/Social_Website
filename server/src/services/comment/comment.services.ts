import _Comment from '../../models/comment';
import { ErrorApi } from '../../middleware/error';
import { detectToxicProducer } from '../queue/detectToxicProducer.services';
import { handleNotification } from '../notification/notification.services';
import _Post from '../../models/post';
import _User from '../../models/user';
import { Types } from 'mongoose';

export class CommentService {
    async createComment(postId: string, content: string, userId: string, parentID?: string) {
        const newComment = await _Comment.create({
            postId,
            content,
            userId,
            parentID,
            path: "abc"
        });

        if (newComment) {
            await detectToxicProducer(newComment);
            console.log("Post id ", postId)
            const post = await _Post.findById(postId);
            console.log('Post found for comment notification:', post?.artistId);

            console.log("Fucking ", post, ' ', post?.artistId.toString(), ' ', userId)
            if (post && post.artistId.toString() !== userId) {
                const user = await _User.findById(userId).select('name');

                console.log('🔔 Sending comment notification:', {
                    from: user?.name,
                    to: post.artistId,
                    postId
                });

                await handleNotification({
                    message: `${user?.name || 'Someone'} đã bình luận về bài viết của bạn: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`,
                    title: 'Bình luận mới',
                    receiver: post.artistId,
                    sender: new Types.ObjectId(userId),
                    type: 'comment',
                    read: false,
                    link: `/posts/${postId}`,
                    postId: new Types.ObjectId(postId)
                } as any);
            }

            // If it's a reply to a comment, notify the parent comment author
            if (parentID) {
                const parentComment = await _Comment.findById(parentID).select('userId');
                if (parentComment && parentComment.userId.toString() !== userId) {
                    const user = await _User.findById(userId).select('name');

                    await handleNotification({
                        message: `${user?.name || 'Someone'} đã trả lời bình luận của bạn: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`,
                        title: 'Trả lời bình luận',
                        receiver: parentComment.userId,
                        sender: new Types.ObjectId(userId),
                        type: 'comment',
                        read: false,
                        link: `/posts/${postId}`,
                        postId: new Types.ObjectId(postId)
                    } as any);
                }
            }
        }

        return newComment;
    }

    buildTree(comments: any[]) {
        const map = new Map<string, any>();
        const tree: any[] = [];

        comments.forEach((comment) => {
            map.set(comment._id.toString(), { ...comment, children: [] });
        });

        comments.forEach((comment) => {
            if (comment.parentID !== null) {
                const parent = map.get(comment.parentID.toString());
                if (parent) {
                    parent.children.push(map.get(comment._id.toString()));
                }
            } else {
                tree.push(map.get(comment._id.toString()));
            }
        });

        return tree;
    }

    async getComment(postId: string) {
        const comments = await _Comment.findWithDeleted({ postId })
            .select('_id content userId parentID createdAt isToxic')
            .lean();

        const tree = this.buildTree(comments);

        return tree;
    }

    async updateComment(id: string, content: any) {
        const data = await _Comment.findByIdAndUpdate(id, content, { new: true });

        if (!data) {
            throw new ErrorApi(400, "Update comment fail");
        }

        return data;
    }

    async removeComment(id: string) {
        const findComment = await _Comment.findById(id);

        if (!findComment) {
            throw new ErrorApi(404, 'Comment not found');
        }

        const comment = await _Comment.deleteById(id);

        if (!comment) {
            throw new ErrorApi(500, 'Delete comment failed');
        }

        return { success: true };
    }

    async setCommentVisibility(id: string, visible: boolean) {
        const findComment = await _Comment.findWithDeleted({ _id: id });

        if (!findComment) {
            throw new ErrorApi(404, 'Comment not found');
        }

        const CommentModel = _Comment as any;

        if (visible) {
            await CommentModel.restore({ _id: id });
        } else {
            await CommentModel.deleteById(id);
        }

        return { success: true };
    }
}

export default new CommentService();
