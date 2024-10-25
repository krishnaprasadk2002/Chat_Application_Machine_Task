import { Request, Response, NextFunction } from "express";
import jwt from 'jsonwebtoken';
import { HttpStatusCode } from "../../Enum/httpStatusCode";

export interface authenticatedRequest extends Request {
    user?: decodedUser;
}

export interface decodedUser {
    userId: string;
    email: string;
    iat: number;
    exp: number;
}

export const refreshTokenMiddleware = async (req: authenticatedRequest, res: Response, next: NextFunction) => {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
        return res.status(401).json({ message: 'Refresh token is missing' });
    }

    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET || 'wiskandwillow') as decodedUser;
        
        const newAccessToken = jwt.sign({ userId: decoded.userId, email: decoded.email }, process.env.JWT_SECRET || 'RefershTokenn', { expiresIn: '30m' });

        res.cookie('token', newAccessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 30 * 60 * 60
        });

        res.status(HttpStatusCode.OK).json({
            message: "New Access Token created"
        })
    } catch (error) {
        return res.status(403).json({ message: 'Forbidden: Invalid refresh token' });
    }
};