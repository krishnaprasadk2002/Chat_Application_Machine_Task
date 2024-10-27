import { IChatWithParticipants } from "./IChat";
import IUsers from "./IUser";

export interface IMessage {
    _id: string;
    chatId: string;
    senderId: string;
    message?: string;
    file?: {
        key: string,
        url: string
    };
    type: "text" | "image" | "video" | "document";
    isRead: boolean;
    createdAt: Date;
    updatedAt?: Date;
}

export interface IMessageWithSenderDetails extends IMessage {
    senderData: IUsers;
}

export interface IMessagesGroupedByDate {
    createdAt: Date;
    messages: IMessageWithSenderDetails[];
}

export interface IMessagesAndChatData {
    messages: IMessagesGroupedByDate[];
    chat: IChatWithParticipants;
}

export interface IMessageCredentials {
    chatId: string;
    senderId: string;
    content?: string;
    file?: {
        key: string,
        url: string
    };
    type: "text" | "image" | "video" | "document";
    isRead: boolean;
    createdAt: Date;
}