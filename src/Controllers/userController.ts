import { IChatWithParticipants } from "../Entities/IChat";
import { HttpStatusCode } from "../Enum/httpStatusCode";
import { AuthenticatedRequest } from "../Frameworks/Middlewares/accessToken";
import { UserUseCase } from "../Usecases/userUseCase";
import { NextFunction, Request, Response } from "express";
import Jwt from "jsonwebtoken";

export class UserController {
  constructor(private userUseCase: UserUseCase) { }


  async userSignUp(req: Request, res: Response) {

    console.log(req.body)
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

      if (user.status === true) {
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
      const accessToken = Jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET || 'accessToken', { expiresIn: '15m' });
      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 3600000
      });

      // Token generation
      const refreshToken = Jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET || 'refreshToken', { expiresIn: '30d' });
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 3600000
      });

      // Successful login response with success: true
      return res.status(HttpStatusCode.OK).json({
        success: true,
        message: 'Login success',
        accessToken,
        refreshToken,
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

  async createNewChat(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response> {
    try {
      const senderId: string | undefined = req.user?.userId;
      const reciverId: string | undefined = req.body.reciverId;
  
      // Check if senderId and reciverId are valid
      if (!senderId || !reciverId) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "Sender or receiver ID is missing",
        });
      }
  
      // Ensure sender is not creating a chat with themselves
      if (senderId === reciverId) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "You cannot start a chat with yourself",
        });
      }
  
      // Call use case to create the chat
      const chat: IChatWithParticipants = await this.userUseCase.createNewChat(senderId, reciverId);
  
      return res.status(HttpStatusCode.OK).json({
        success: true,
        message: "Chat created successfully",
        data: chat,
      });
    } catch (error) {
      console.error('Error creating new chat:', error);
      return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Server error',
      });
    }
  }
  

  // Get all Chat of specific user
  
  async getAllChatsOfCurrentUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
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
  
}