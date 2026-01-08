export const cors_conf = {
    origin: [
        'http://172.17.208.1:3001',      // Local development
        'http://192.168.0.3:3001',       // Mobile access (WiFi)
        'http://localhost:3001',         // Localhost
        /^https:\/\/.*\.ngrok-free\.app$/, // Ngrok HTTPS tunnel for mobile testing
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: [
    "Content-Type",
    "Authorization",
    "x-device-id",
    "Origin",
    "Accept",
  ],

} 