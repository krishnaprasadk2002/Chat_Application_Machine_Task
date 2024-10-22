// interfaces
import { IMessage } from "./IMessage";
import IUsers from "./IUser";

export interface IChat {
    _id: string;
    chatId: string;
    participants: string[];
    type: "one-to-one" | "group";
    groupName?: string;
    groupProfilePicture?: {
        key: string | null,
        url: string
    };
    groupAdmin?: string;
    lastMessage: string;
    createdAt: Date;
}

export interface IChatWithParticipants extends IChat {
    participantsData: IUsers[];
    lastMessageData: IMessage;
    unReadMessages: number;
}