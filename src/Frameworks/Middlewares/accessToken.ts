import { Request, Response, NextFunction } from "express";
import jwt from 'jsonwebtoken';

export interface authenticatedRequest extends Request {
    user?: decodedUser;
}

export interface decodedUser {
    userId: string;
    email: string;
    iat: number;
    exp: number;
}

export const authenticateToken = (req: authenticatedRequest, res: Response, next: NextFunction): void => {
    const token = req.cookies.Token; 

    if (!token) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'token') as decodedUser;
        req.user = decoded;
        console.log(req.user,'decodes');
        
        next();
    } catch (error) {
        console.error('JWT verification error:', error);
        res.status(403).json({ message: 'Forbidden' });
    }
};
