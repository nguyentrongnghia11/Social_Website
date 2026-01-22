import { publishToExchange } from './rabbitmq.service';

export const AI_EXCHANGES = {
    TOXIC_DETECT: 'toxic-detect-exchange',
    HINT_POST: 'hint-post-exchange',
    ENCODE_POST: 'encode-post-exchange'
} as const;

export const AI_QUEUES = {
    TOXIC_DETECT_INPUT: 'toxic-detect-queue',
    TOXIC_DETECT_RESULT: 'result-detect-queue',
    HINT_POST_INPUT: 'hint-post-queue',
    HINT_POST_RESULT: 'result-hint-post-queue',
    ENCODE_POST_INPUT: 'encode-post-queue',
    ENCODE_POST_RESULT: 'result-encode-post-queue'
} as const;

export async function detectToxicComment(commentId: string, content: string): Promise<boolean> {
    return publishToExchange(
        AI_EXCHANGES.TOXIC_DETECT,
        AI_QUEUES.TOXIC_DETECT_INPUT,
        {
            _id: commentId,
            commentId: commentId,
            content: content
        }
    );
}

export async function encodePost(postId: string, content: string): Promise<boolean> {
    return publishToExchange(
        AI_EXCHANGES.ENCODE_POST,
        AI_QUEUES.ENCODE_POST_INPUT,
        {
            _id: postId,
            content: content
        }
    );
}

export async function getSimilarPosts(postData: {
    _id: string;
    title?: string;
    content: string;
    embedding?: number[];
}): Promise<boolean> {
    return publishToExchange(
        AI_EXCHANGES.HINT_POST,
        AI_QUEUES.HINT_POST_INPUT,
        postData
    );
}
