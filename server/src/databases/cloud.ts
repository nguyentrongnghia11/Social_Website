const cloudinary = require('cloudinary').v2;
require('dotenv').config();

// Return "https" URLs by setting secure: true
cloudinary.config({
    cloud_name: process.env.CLOUND_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET // Click 'View API Keys' above to copy your API secret
});

export default cloudinary;
