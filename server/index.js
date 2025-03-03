
const express = require('express');
const app = express();
const { Server } = require('socket.io');
var admin = require("firebase-admin");
const mainRouter = require('./routes/server');
const { ZingMp3 } = require("zingmp3-api-full");
const connectionn = require('./config/connectMongo');
const config = require('./services/servicesOauth2');
const cors = require('cors');
const http = require('http');
const connectRedis = require('./config/connectRedis')
const passport = require('passport');
const { p } = require('./middleware/verifyToken_services');
const socketioService = require('./services/socketio');
const cookie = require('cookie-parser');

// Import the functions you need from the SDKs you need
const { initializeApp } = require("firebase/app")
//const  { getAnalytics } = require("firebase/analytics")

p(app);

app.use(cookie());

config(app)

const client = connectRedis();




const server = socketioService(app, client);






// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCa7DV7SGbGyXBy0csV8wZ9nNvWRYcu8PU",
  authDomain: "app-music-c175f.firebaseapp.com",
  projectId: "app-music-c175f",
  storageBucket: "app-music-c175f.firebasestorage.app",
  messagingSenderId: "49355523823",
  appId: "1:49355523823:web:79719624a3ffa810267d1a",
  measurementId: "G-37C4QPV86F"
};
app.use(express.json());
app.use(express.urlencoded({ extended: true }));





app.use(cors({
  origin: 'http://localhost:3001',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],

}));

// Initialize Firebase
const appFireBase = initializeApp(firebaseConfig);
connectionn();
//const analytics = getAnalytics(appFireBase);

app.use('/test', (req, res, next) => { })
mainRouter(app);

// ZingMp3.getSong("ZOACFBBU").then((data) => {
//   console.log(data)
// }).catch ((error)=>{
//   console.log('error')
// })

// console.log(ZingMp3.getFullInfo('ZWBOW9CO'))

server.listen(process.env.PORT || 8000, () => {
  console.log('Server is running on port ' + process.env.PORT || 8000);
})


// tôi đang bị lỗi hãy fix cho tôi


