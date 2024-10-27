import { UserRepository } from "../Repositories/userRepository";
import bcrypt from 'bcrypt';
import { config } from "dotenv";
import { IChatWithParticipants } from "../Entities/IChat";
import { IMessage } from "../Entities/IMessage";


config();

export class UserUseCase {
  constructor(private userRep: UserRepository) { }


  async signUp(name: string, email: string, password: string, mobile: number) {
    const existingUser = await this.userRep.findUserEmail(email);
    if (existingUser) {
      throw new Error("User already exists");
    }

    const user = await this.userRep.createUser(name, email, password, mobile);

    return user;
  }

  async findUserByEmail(email: string) {
    return this.userRep.findUserEmail(email);
  }

  async validatePassword(inputPassword: string, storedPassword: string): Promise<boolean> {
    return await bcrypt.compare(inputPassword, storedPassword);
  }



  async createNewChat(senderId: string, receiverId: string): Promise<IChatWithParticipants> {
    try {
      

        const existingChat = await this.userRep.findOneByParticipants(senderId, receiverId);
        
        if (existingChat) {
            return {
                ...existingChat,
                lastMessage: '',
                participantsData: [], 
                lastMessageData: null as unknown as IMessage, 
                unReadMessages: 0,
            };
        }

        // Create a new chat if it doesn't exist
        const newChat = await this.userRep.createChat(senderId, receiverId, 'one-to-one')
        

        return {
            ...newChat,
            lastMessage: '',
            participantsData: [], 
            lastMessageData: null as unknown as IMessage, 
            unReadMessages: 0,
        };
    } catch (error) {
        console.error('Error creating new chat:', error);
        throw new Error('Failed to create new chat'); 
    }
}


async getAllChatsOfCurrentUser(userId: string): Promise<IChatWithParticipants[]> {
  if (!userId) {
    throw new Error("User ID is required");
  }
  
  // Call the repository method to get the chats
  const chats = await this.userRep.getAllChatsOfCurrentUser(userId);
  
  return chats;
}

async getAllUsers(userId:string) {
  return await this.userRep.getAllUsers(userId);
}

async receiverData(receiverId:string){
  return await this.userRep.findReceiverById(receiverId)
}

  // Send a message
  async sendMessage(messageData: IMessage): Promise<IMessage> {
    return await this.userRep.createMessage(messageData);
  }

  // Fetch messages for a chat
  async fetchMessages(chatId: string): Promise<IMessage[]> {
    return await this.userRep.getMessagesByChatId(chatId);
  }

}