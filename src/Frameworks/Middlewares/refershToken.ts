import { Request, Response, NextFunction } from "express";
import jwt from 'jsonwebtoken';
import { HttpStatusCode } from "../../Enum/httpStatusCode";
import { AuthenticatedRequest, DecodedUser } from "./accessToken";

export interface authenticatedRequest extends Request {
    user?: decodedUser;
}

export interface decodedUser {
    userId: string;
    email: string;
    iat: number;
    exp: number;
}

export const refreshTokenMiddleware = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({ message: 'Refresh token is missing' });
    }

    try {
        // Verify the refresh token
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'refresh-secret') as DecodedUser;
        
        // Generate a new access token
        const newAccessToken = jwt.sign(
            { userId: decoded.userId, email: decoded.email },
            process.env.JWT_SECRET || 'chat-app',
            { expiresIn: '30m' }
        );

        // Set the new access token as a cookie
        res.cookie('token', newAccessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 30 * 60 * 1000  
        });

        return res.status(HttpStatusCode.OK).json({
            message: "New Access Token created",
            accessToken: newAccessToken
        });
    } catch (error: any) {
        console.error('Error verifying refresh token:', error);
        
        // Check if the error is related to token expiration
        if (error.name === 'TokenExpiredError') {
            return res.status(HttpStatusCode.FORBIDDEN).json({ message: 'Refresh token expired. Please log in again.' });
        }

        return res.status(HttpStatusCode.FORBIDDEN).json({ message: 'Forbidden: Invalid refresh token' });
    }
};