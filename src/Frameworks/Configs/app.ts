import express from 'express';
import { createServer } from "http";
import cors from 'cors';
import cookieParser from 'cookie-parser'
import morgan from 'morgan'
import dotenv from "dotenv";

const app = express()

const httpServer = createServer(app)

dotenv.config()

const allowedOrgins = [
  process.env.FRONTEND_URL || 'http://localhost:4200'
]

// Apply CORS configuration immediately after initializing the app
app.use(cors({
  origin: allowedOrgins,
  credentials: true
}));

app.use(cookieParser())


import userRoute from '../Routes/userRoute';

// Parse incoming URL-encoded form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use(morgan("dev"));

app.use('/user', userRoute)

export default httpServer