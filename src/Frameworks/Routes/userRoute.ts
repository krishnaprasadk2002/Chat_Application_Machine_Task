import { UserController } from "../../Controllers/userController";
import { UserRepository } from "../../Repositories/userRepository";
import { UserUseCase } from "../../Usecases/userUseCase";
import express from 'express';


const userRepository = new UserRepository();
const userUseCase = new UserUseCase(userRepository);
const userController = new UserController(userUseCase);

const userRoute = express()

userRoute.post('/register',(req,res)=>{userController.userSignUp(req,res)})
userRoute.post('/login', (req, res) => {userController.userLogin(req, res)});


export default userRoute