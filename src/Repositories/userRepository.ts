import mongoose from "mongoose"
import { IChat, IChatWithParticipants } from "../Entities/IChat"
import IUsers from "../Entities/IUser"
import Chats from "../Frameworks/Models/ChatModel"
import Users from "../Frameworks/Models/usersModel"
import { hashPassword } from "../Frameworks/Utils/hashedPassword"
import { IMessage } from "../Entities/IMessage"
import Messages from "../Frameworks/Models/MessageModel"

export class UserRepository{
    async createUser(name: string, email: string, password: string, mobile: number): Promise<IUsers> {
        const hashingPassword = await hashPassword(password)
        const user = new Users({ name, email, password: hashingPassword, mobile })
        return await user.save()
    }

    async findUserEmail(email: string): Promise<IUsers | null> {
        return await Users.findOne({ email })
    }



    private commonAggratePiplineForChat(currentUserId: string) {
        return [
            {
                $lookup: {
                  from: 'messages', 
                  localField: 'chatId', 
                  foreignField: 'chatId', 
                  as: 'messages'
                }
              }, 
              {
                $addFields: {
                  messages: {
                    $filter: {
                      input: '$messages', 
                      as: 'message', 
                      cond: {
                        $and: [
                          {
                            $eq: [
                              '$$message.isRead', false
                            ]
                          }, 
                          {
                            $ne: [
                              '$$message.senderId', new mongoose.Types.ObjectId(currentUserId)
                            ]
                          }
                        ]
                      }
                    }
                  }
                }
            }, 
            {
                $addFields: {
                  unReadMessages: {
                    $size: '$messages'
                  }
                }
            }, 
            {
                $project: {
                  messages: 0
                }
            },
            {
                $lookup: {
                  from: 'users', 
                  localField: 'participants', 
                  foreignField: '_id', 
                  as: 'participantsData'
                }
            },
            {
                $project: {
                    "participantsData.password": 0
                }
            },
            {
                $lookup: {
                    from: 'messages', 
                    localField: 'lastMessage', 
                    foreignField: '_id', 
                    as: 'lastMessageData'
                }
            }, 
            {
                $unwind: {
                    path: '$lastMessageData',
                    preserveNullAndEmptyArrays: true
                }
            }
        ]
    }

    async createChat(senderId: string, receiverId: string, type: 'one-to-one' | 'group'): Promise<IChat> {
      const chatId = new mongoose.Types.ObjectId(); 
  
      const newChat = {
          chatId: chatId,
          participants: [senderId, receiverId],
          type: type,
          createdAt: new Date(),
      };
  
      const chat = new Chats(newChat); 
      return await chat.save(); 
  }
    
      async findOneByParticipants(senderId: string, receiverId: string): Promise<IChat | null> {
        return await Chats.findOne({
          participants: { $all: [senderId, receiverId] },
          type: 'one-to-one'
        });
      }

      async getAllChatsOfCurrentUser(_id: string): Promise<IChatWithParticipants[] | never> {
        try {
            const chat: IChatWithParticipants[] = await Chats.aggregate([
                {
                    $match: {
                        participants: { $elemMatch: { $eq: new mongoose.Types.ObjectId(_id) } },
                        $or: [
                            {
                                type: 'group'
                            }, 
                            {
                                $and: [
                                    {
                                        type: 'one-to-one'
                                    }, 
                                    {
                                        lastMessage: {
                                            $ne: null
                                        }
                                    }
                                ]
                            }
                        ]
                    }
                },
                ...this.commonAggratePiplineForChat(_id)
            ]).sort({ updatedAt: -1 });

            return chat;
        } catch (err: any) {
            throw err;
        }
    }

    async getAllUsers(userId:string) {
      try {
        return await Users.find({ _id: { $ne: userId } }); 
      } catch (error) {
        throw new Error('Error fetching users: ' + error);
      }
    }

    async findReceiverById(receiverId: string) {
      try {
        const receiver = await Users.findOne({_id:receiverId});
    
        if (!receiver) {
          throw new Error('User not found');
        }
        return receiver; 
      } catch (error) {
        console.error('Error finding user by ID:', error);
        throw error; 
      }
    }

  // Create a new message
  async createMessage(messageData: IMessage): Promise<IMessage> {
    const message = new Messages(messageData);
    return await message.save();
  }

  // // Get messages by chatId
  // async getMessagesByChatId(chatId: string): Promise<IMessage[]> {
  //   return await Messages.find({ chatId }).sort({ createdAt: 1 });
  // }

  async getMessagesByChatId(chatId: string): Promise<IMessage[]> {
    return await Messages.find({ chatId }).populate('chatId'); 
}
    
  }
      