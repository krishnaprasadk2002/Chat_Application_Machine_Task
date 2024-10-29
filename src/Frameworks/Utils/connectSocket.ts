import { Server, Socket } from "socket.io";
import http from "http";
import { parse } from "cookie";
import IJWTService, { IPayload } from '../Utils/IJWTservices'
// constants
import { ChatEnum } from "../../constants/socketEvents";
import { HttpStatusCode } from "../../Enum/httpStatusCode";
import jwtService from "../Configs/JWTservices";
import { isObjectIdOrHexString } from "mongoose";
import { IMessage } from "../../Entities/IMessage";
import { UserRepository } from "../../Repositories/userRepository";
import { UserUseCase } from "../../Usecases/userUseCase";
import { UserController } from "../../Controllers/userController";

class CustomError extends Error {
    constructor(public statusCode: number, message: string) {
        super(message);
        this.name = "CustomError";
    }
}

interface IAuthSocket extends Socket {
    userId?: string;
}

export function ConnectSocket(httpServer: http.Server) {
    const activeChat: Map<string, Set<string>> = new Map();

    const io = new Server(httpServer, {
        pingTimeout: 60000,
        cors: {
            origin: process.env.FRONTEND_URL || 'http://localhost:4200',
            methods: ["GET", 'POST'],
            credentials: true
        }
    });

    io.use((socket: IAuthSocket, next) => {
        try {
            const rawCookie = socket.handshake.headers.cookie;

            if (!rawCookie) {
                console.error('No cookies found');
                return next(new CustomError(HttpStatusCode.UNAUTHORIZED, 'No cookies found'));
            }
            const { Token } = parse(rawCookie);


            if (!Token) {
                throw new CustomError(HttpStatusCode.UNAUTHORIZED, 'User is not authenticated: No token found.');
            }


            const decoded: IPayload = jwtService.verifyToken(Token);

            if (!decoded || !isObjectIdOrHexString(decoded.userId)) {
                console.error('Decoded token is invalid or ID is not a valid ObjectId');
                throw new CustomError(HttpStatusCode.UNAUTHORIZED, 'User is not authenticated: Invalid token ID.');
            }


            socket.userId = decoded.userId;
            next();
        } catch (error: any) {
            console.error('Socket authentication error:', error);
            next(error);
        }
    });

    const userRepository = new UserRepository();
    const userUseCase = new UserUseCase(userRepository);
    const userController = new UserController(userUseCase);

    io.on(ChatEnum.CONNECTION, (socket: IAuthSocket) => {
        console.log(`Socket connected with ID: ${socket.id}`);

        socket.on('join-chat', (chatId) => {
            socket.join(chatId);
            console.log(`Socket ${socket.id} joined room ${chatId}`);
        });


        // Handle sendMessage event
        socket.on('sendMessage', async (messageData: IMessage) => {
            if (!messageData) {
                console.error('No data received for sendMessage event');
            }
            await userController.handleSendMessage(socket, messageData);

            io.in(messageData.chatId).emit('receiveMessage', messageData);

        });

        socket.on('fetchMessages', (chatId: string) => {
            if (!chatId) {
                console.log('not get Chat Id');
            }
            userController.handleFetchMessages(socket, chatId)
        })


          // Handle joining a group chat
          socket.on(ChatEnum.JOIN_GROUP_CHAT_EVENT, (groupId: string) => {
            socket.join(groupId);
            console.log(`User ${socket.id} joined group chat ${groupId}`);
        });

        // Handle leaving a group chat
        socket.on(ChatEnum.LEAVE_GROUP_CHAT_EVENT, (groupId: string) => {
            socket.leave(groupId);
            console.log(`User ${socket.id} left group chat ${groupId}`);
        });

        // Handle sending group messages
        socket.on(ChatEnum.SEND_GROUP_MESSAGE_EVENT, async (messageData: IMessage) => {
            console.log('GroupMessage received:', messageData);
        
            try {
                // Save the message to the database
                await userController.handleSendMessage(socket,messageData);
                
                
                // Emit the message to all clients in the group
                io.in(messageData.chatId).emit(ChatEnum.RECEIVE_GROUP_MESSAGE_EVENT, messageData);
                console.log('emited grp message Success ful',messageData);
                
            } catch (error) {
                console.error('Error handling group message:', error);
            }
        });
        



        socket.on('error', (err) => {
            console.error('Socket error occurred:', err);
        });
        
        socket.join(socket.userId!)
        joinAndLeaveChat(socket, activeChat)

        socket.on(ChatEnum.DISCONNECT_EVENT, async () => {
            console.log('socket Disconnected');

        });
    })

    return {
        emitSocketEvent: function <T>(roomId: string, event: string, payload: T) {
            io.in(roomId).emit(event, payload)
        },
        isReciverInChat(chatId: string, reciverId: string) {
            const userJoined: Set<string> | undefined = activeChat.get(chatId);

            if (!userJoined) return false

            return userJoined.has(reciverId);
        }
    }

}

// Manage user joining and leaving chats
const joinAndLeaveChat = (socket: IAuthSocket, activeChat: Map<string, Set<string>>) => {
    socket.on(ChatEnum.JOIN_CHAT_EVENT, (chatId: string) => {
        socket.join(chatId);

        if (socket.userId) {
            if (activeChat.has(chatId)) {
                activeChat.get(chatId)?.add(socket.userId);
            } else {
                activeChat.set(chatId, new Set<string>([socket.userId]));
            }
        }
    });

    socket.on(ChatEnum.LEAVE_CHAT_EVENT, (chatId: string) => {
        socket.leave(chatId);

        const userSet = activeChat.get(chatId);
        if (userSet) {
            userSet.delete(socket.userId!);
            if (userSet.size === 0) {
                activeChat.delete(chatId);
            }
        }
    });

};
