import mongoose from 'mongoose';

const connectMongo = async () => {
    const mongoUri = process.env.MONGO_URI;

    console.log ('MONGO_URI:', mongoUri); 

    if (!mongoUri) {
        throw new Error('Missing MONGO_URI in environment variables');
    }

    try {
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('Error connecting to MongoDB:', (error as Error).message);
        process.exit(1);
    }
};

export default connectMongo;
