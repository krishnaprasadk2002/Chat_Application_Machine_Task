import { Request, Response, NextFunction } from "express";
import jwt from 'jsonwebtoken';
import { HttpStatusCode } from "../../Enum/httpStatusCode";

export interface AuthenticatedRequest extends Request {
    user?: DecodedUser;
}

export interface DecodedUser {
    userId: string;
    email: string;
    iat: number;
    exp: number;
}

export const authenticateToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const token = req.cookies.token;

    if (!token) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({ message: 'Unauthorized: No token provided' });
    }

    try {
        // Verify the token and decode the payload
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'chat-app') as DecodedUser;
        req.user = decoded;
        next();
    } catch (error: any) {
        // Differentiate between token errors
        if (error.name === 'TokenExpiredError') {
            return res.status(HttpStatusCode.UNAUTHORIZED).json({ message: 'Token expired. Please log in again.' });
        } else if (error.name === 'JsonWebTokenError') {
            return res.status(HttpStatusCode.FORBIDDEN).json({ message: 'Invalid token. Access forbidden.' });
        } else {
            return res.status(HttpStatusCode.FORBIDDEN).json({ message: 'Forbidden: Token validation failed' });
        }
    }
};