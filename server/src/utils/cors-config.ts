export const cors_conf = {
    origin: [
        'http://localhost:3001',  
        'https://social-website-llf9.vercel.app/',
        'https://justvibing.com/'
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