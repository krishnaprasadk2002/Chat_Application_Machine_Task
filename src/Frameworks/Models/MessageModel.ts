// models/messageModel.ts
import mongoose, { Schema } from "mongoose";
import { IMessage } from "../../Entities/IMessage";

const MessageSchema: Schema = new Schema(
    {
        chatId: { 
            type: Schema.Types.ObjectId, 
            ref: 'Chat', 
            required: true 
        },
        senderId: { 
            type: Schema.Types.ObjectId, 
            ref: 'User', 
            required: true 
        },
        message: { 
            type: String,
        },
        file: {
            key: {
                type: String,
            },
            url: {
                type: String,
            }
        },
        type: { 
            type: String, 
            enum: ['text' ,'image' , 'video' , 'audio' , 'document'],
            required: true
        },
        isRead: { 
            type: Boolean,
            default: false,
            required: true 
        }
    },
    { 
        timestamps: true
    }
);

const Messages = mongoose.model<IMessage>('Messages', MessageSchema);
export default Messages;
