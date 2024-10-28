import { UserController } from "../../Controllers/userController";
import { UserRepository } from "../../Repositories/userRepository";
import { UserUseCase } from "../../Usecases/userUseCase";
import express from 'express';
import { authenticateToken } from "../Middlewares/accessToken";
import cookieParser from "cookie-parser";



const userRepository = new UserRepository();
const userUseCase = new UserUseCase(userRepository);
const userController = new UserController(userUseCase);

const userRoute = express.Router();

userRoute.post('/register',(req,res)=>{userController.userSignUp(req,res)})
userRoute.post('/login', (req, res) => {userController.userLogin(req, res)});
userRoute.get('/allusers',authenticateToken, async (req, res) => {
    await userController.getALlUsers(req, res);
});
userRoute.get('/getuserid',authenticateToken, async (req, res) => {
    await userController.getUserId(req, res);
});
userRoute.get('/receiverData', (req, res) => {userController.receiverData(req, res)});

userRoute.post("/createnewchat", authenticateToken, (req, res) => userController.createNewChat(req, res));
userRoute.post("/createnewgroupchat", authenticateToken, (req, res) => userController.createNewGroupChat(req, res));
userRoute.get('/groups',authenticateToken, (req,res)=>userController.getUserGroupChats(req,res));




export default userRoute