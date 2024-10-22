import httpServer from './src/Frameworks/Configs/app';
import dotenv from 'dotenv';
import connectDB from "./src/Frameworks/Configs/db";

import { ConnectSocket } from "./src/Frameworks/Utils/connectSocket";

// connecting mongoDB
connectDB();

dotenv.config()
console.log('Frontend URL:', process.env.FRONTEND_URL);


const {emitSocketEvent,isReciverInChat}=ConnectSocket(httpServer) // socket configuration and event listn initailazation

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
})

export { emitSocketEvent, isReciverInChat };