// models/chatModel.ts
import mongoose, { Schema } from "mongoose";
import { IChat } from "../../Entities/IChat";

const ChatSchema: Schema = new Schema(
    {
        chatId: { 
            type: Schema.Types.ObjectId, 
            required: true, 
            unique: true
        },
        participants: [
            { 
                type: Schema.Types.ObjectId, 
                ref: "Users", 
                required: true 
            }
        ],
        type: { 
            type: String, 
            enum: ["one-to-one", "group"], 
            required: true 
        },
        groupName: { 
            type: String
        },
        groupProfilePicture: {
            key: {
                type: String,
            },
            url: {
                type: String
            }
        },
        lastMessage: {
            type: Schema.Types.ObjectId,
            ref: "Messages",
            default: null,
        },
        groupAdmin: {
            type: Schema.Types.ObjectId,
            ref: "Users", 
        },
        createdAt: { 
            type: Date,
            required: true
        }
    },
    { 
        timestamps: true
    }
);

// Register the model with Mongoose
const Chat = mongoose.model<IChat>("Chat", ChatSchema); 
export default Chat;
