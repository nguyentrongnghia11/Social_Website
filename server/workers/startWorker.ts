import { detectToxicWorker } from './detectToxic.worker';
import { encodePostWorker } from './encodePost.worker';
import { notificationWoker } from './upload.woker';
import { sendOtpWorker } from './sendOtp.worker';

export async function startWorkers() {
    try {
        await notificationWoker();
        await sendOtpWorker();
        await detectToxicWorker();
        await encodePostWorker();



        console.log('Start workers successfullyy');
    } catch (error) {
        console.error('Failed to start workers:', error);
        process.exit(1);
    }
}