import jwt from 'jsonwebtoken';
import IJWTService, { IPayload } from '../Utils/IJWTservices';

import { config } from "dotenv";

config();

class JWTService implements IJWTService {
    private secret: string;

    constructor() {
        this.secret = process.env.JWT_SECRET || 'your-secret-key';
        
    }

    // Method to sign a token
    public sign(payload: IPayload, expiresIn: string | number): string | never {
        return jwt.sign(payload, this.secret, { expiresIn });
    }

    // Method to verify the JWT token
    public verifyToken(token: string): IPayload | never {
        try {
            return jwt.verify(token, this.secret) as IPayload; 
        } catch (error) {
            throw new Error('Invalid token');
        }
    }
}

const jwtService = new JWTService();
export default jwtService;