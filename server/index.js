import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import cors from 'cors';
import {Server} from 'socket.io';
import http from 'http';
import dns from 'dns';
import dotenv from 'dotenv';

dotenv.config();

dns.setServers(['8.8.8.8', '8.8.4.4']);



import roomHandler from './socket/roomHandler.js';


import authRoutes from './routes/auth.js';
import { generateRtcToken } from './controllers/agora.js';

const app = express();

app.use(express.json());
app.use(bodyParser.json({limit: "30mb", extended: true}));
app.use(cors());

app.use('/auth', authRoutes);
app.get('/api/token', generateRtcToken);


const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE']
    }
});

io.on("connection", (socket) =>{
    console.log("User connected");

    roomHandler(socket);

    socket.on('disconnect', ()=>{
        console.log("user disconnected");
    })

})
const PORT = 6001;
const atlasURI = process.env.MONGO_URI;
const localURI = 'mongodb://127.0.0.1:27017/meet-app';
const mongoURI = atlasURI || localURI;

const connectWithFallback = async (uri) => {
  try {
    console.log(`Connecting to MongoDB at ${uri}`);
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    });
    if (!server.listening) {
      server.listen(PORT, () => {
        console.log(`Running @ ${PORT}`);
      });
    } else {
      console.warn(`Server already listening on port ${PORT}`);
    }
  } catch (err) {
    console.error(`MongoDB connection failed for ${uri}:`, err.message || err);
    if (uri !== localURI) {
      console.warn('Attempting local MongoDB fallback at', localURI);
      return connectWithFallback(localURI);
    }
    console.error('Unable to connect to MongoDB. Please ensure MongoDB is running locally or update MONGO_URI in .env.');
  }
};

connectWithFallback(mongoURI);

