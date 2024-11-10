import { Socket } from "socket.io";
import { IChat, IChatWithParticipants } from "../Entities/IChat";
import IUsers from "../Entities/IUser";
import { HttpStatusCode } from "../Enum/httpStatusCode";
import { authenticatedRequest, authenticateToken } from "../Frameworks/Middlewares/accessToken";
import { UserUseCase } from "../Usecases/userUseCase";
import { NextFunction, Request, Response } from "express";
import Jwt from "jsonwebtoken";
import { IMessage } from "../Entities/IMessage";
import uploadCloudinary from "../Frameworks/Configs/cloudinary";

export class UserController {
  constructor(private userUseCase: UserUseCase) { }


  async userSignUp(req: Request, res: Response) {

    const { name, email, password, mobile } = req.body;
    try {
      const user = await this.userUseCase.signUp(name, email, password, mobile);
      res.status(HttpStatusCode.CREATED).json(user);
    } catch (error) {
      if (error instanceof Error) {
        res.status(HttpStatusCode.BAD_REQUEST).json({ message: error.message });
      } else {
        res.status(HttpStatusCode.BAD_REQUEST).json({ message: "An unknown error occurred" });
      }
    }
  }


  async userLogin(req: Request, res: Response): Promise<Response> {
    const { email, password } = req.body;

    try {
      const user = await this.userUseCase.findUserByEmail(email);

      if (!user) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          success: false,
          message: 'User not found',
        });
      }

      if (user.status) {
        return res.status(HttpStatusCode.FORBIDDEN).json({
          success: false,
          message: 'Your account is blocked',
        });
      }

      const isPasswordValid = await this.userUseCase.validatePassword(password, user.password);
      if (!isPasswordValid) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({
          success: false,
          message: 'Invalid password',
        });
      }

      // Token generation
      const accessToken = Jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET || 'Token', { expiresIn: '15m' });
      res.cookie('Token', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 3600000
      });

      const refreshToken = Jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET || 'refreshToken', { expiresIn: '30d' });
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 3600000
      });

      // Successful login response with success: true
      return res.status(HttpStatusCode.OK).json({
        success: true,
        message: 'Login success'
      });
    } catch (error) {
      console.error('Error during user login:', error);
      return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Server error',
      });
    }
  }

  //Creating chat

  async createNewChat(req: authenticatedRequest, res: Response): Promise<void> {
    try {
      const senderId: string | undefined = req.user?.userId;
      const receiverId = req.body.reciverId

      if (!senderId || !receiverId) {
        res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "Sender or receiver ID is missing",
        });
        return;
      }

      if (senderId === receiverId) {
        res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "You cannot start a chat with yourself",
        });
        return;
      }

      const chat: IChatWithParticipants = await this.userUseCase.createNewChat(senderId, receiverId);

      res.status(HttpStatusCode.OK).json({
        success: true,
        message: "Chat created successfully",
        data: chat,
      });
    } catch (error) {
      console.error('Error creating new chat:', error);
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Server error',
      });
    }
  }


  async createNewGroupChat(req: authenticatedRequest, res: Response): Promise<void> {
    try {
      const senderId: string | undefined = req.user?.userId;
      const { groupName, members } = req.body;

      if (!senderId || !groupName || !members || members.length === 0) {
        res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "Sender ID, group name, or members are missing",
        });
        return;
      }

      // Create a new group chat
      const groupChat = await this.userUseCase.createGroupChat(senderId, groupName, members);

      res.status(HttpStatusCode.OK).json({
        success: true,
        message: "Group chat created successfully",
        data: groupChat,
      });
    } catch (error) {
      console.error('Error creating new group chat:', error);
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Server error',
      });
    }
  }

  async getUserGroupChats(req: authenticatedRequest, res: Response) {
    const userId: string | undefined = req.user?.userId as string;
    try {
      const groupChats: IChat[] = await this.userUseCase.getUserGroupChats(userId);
      res.status(200).json({ success: true, data: groupChats });
    } catch (error) {
      console.error('Error fetching group chats:', error);
      res.status(500).json({ success: false, message: 'Error fetching group chats' });
    }
  }



  // Send a message and broadcast it
  async handleSendMessage(socket: Socket, messageData: IMessage) {
    try {
      let message;

      if (["image", "video", "audio", "document"].includes(messageData.type) && messageData.message) {

        const fileUrl = await uploadCloudinary(messageData.message);

        messageData.file = {
          key: `Chat_App/${messageData.type}`,
          url: fileUrl
        };
        messageData.message = '';
      }

      message = await this.userUseCase.sendMessage(messageData);
      console.log(message,'data');
      
      socket.in(messageData.chatId).emit('receiveMessage', message);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }


  // Fetch messages for a given chat
  async handleFetchMessages(socket: Socket, chatId: string) {
    try {
      const messages = await this.userUseCase.fetchMessages(chatId);

      socket.emit('messagesFetched', messages);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  }

  // Get all Chat of specific user

  async getAllChatsOfCurrentUser(req: authenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(HttpStatusCode.UNAUTHORIZED).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const data: IChatWithParticipants[] = await this.userUseCase.getAllChatsOfCurrentUser(userId);
      res.status(HttpStatusCode.OK).json({
        success: true,
        message: 'Chat data fetched',
        data,
      });
    } catch (error) {
      console.error('Error fetching chats:', error);
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Server error',
      });
    }
  }

  async getALlUsers(req: authenticatedRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      const data: IUsers[] = await this.userUseCase.getAllUsers(userId);

      return res.status(HttpStatusCode.OK).json({
        success: true,
        message: 'Users data fetched',
        data,
      });
    } catch (error) {
      console.error('Error fetching users data:', error);
      return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Server error',
      });
    }
  }

  async getUserId(req: authenticatedRequest, res: Response): Promise<Response> {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(HttpStatusCode.UNAUTHORIZED).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    return res.status(HttpStatusCode.OK).json({
      success: true,
      message: 'UserId fetched',
      userId: userId
    })
  }


  async receiverData(req: Request, res: Response): Promise<Response> {
    const receiverId = req.query.userId as string;

    if (!receiverId) {
      return res.status(HttpStatusCode.BAD_REQUEST).json({
        success: false,
        message: 'User ID is required',
      });
    }

    return this.userUseCase.receiverData(receiverId).then((data: IUsers) => {
      return res.status(HttpStatusCode.OK).json({
        success: true,
        message: 'User data fetched',
        data,
      });
    }).catch((error: any) => {
      console.error('Error fetching receiver data:', error);
      return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Error fetching user data',
      });
    });
  }


  isAuth(req: authenticatedRequest, res: Response) {
    if (req.user) {
      res.status(HttpStatusCode.OK).json({ message: "Authenticated", user: req.user });
    } else {
      res.status(401).json({ message: "Not authenticated" });
    }
  }


  async getUserData(req: authenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(HttpStatusCode.UNAUTHORIZED).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const user = await this.userUseCase.getUserData(userId);
      console.log(user, 'userData');


      res.status(HttpStatusCode.OK).json({
        success: true,
        data: user,
      });
    } catch (error) {
      console.error('Error in getUserData controller:', error);
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Error retrieving user data',
      });
    }
  }

  async fetchUserProfile(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      if (!userId) {
        res.status(HttpStatusCode.BAD_REQUEST).json({ error: 'User ID is required' });
        return;
      }

      const userProfile = await this.userUseCase.getUserProfile(userId as string);
      if (!userProfile) {
        res.status(HttpStatusCode.NOT_FOUND).json({ error: 'User not found' });
        return;
      }

      res.status(HttpStatusCode.OK).json(userProfile);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ error: 'Internal Server Error' });
    }

  }

  async updateUserProfile(req: Request, res: Response): Promise<void> {
    const userId = req.params.userId;
    const updatedProfile = req.body;

    try {
      // If there's a profile image, upload it to Cloudinary
      if (updatedProfile.profileImage) {
        const imageUrl = await uploadCloudinary(updatedProfile.profileImage);
        updatedProfile.imageUrl = imageUrl;  // Store image URL for the database
        delete updatedProfile.profileImage;  // Remove base64 data from profile data
      }

      // Update the user profile in the database
      const result = await this.userUseCase.updateUserProfile(userId, updatedProfile);
      res.status(HttpStatusCode.OK).json({
        message: "Profile updated successfully",
        data: result
      });
    } catch (error) {
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
        message: "Error updating profile",
        error
      });
    }
  }
}