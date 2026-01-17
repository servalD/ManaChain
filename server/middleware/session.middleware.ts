import { Request } from "express";
import { verifyToken } from '../services/jwt.service';
import { getUserById } from '../services/user.service';

export class SessionMiddleware {

    static async isLogged(req: Request): Promise<boolean> {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return false;
        }
        const token = authHeader.split(' ')[1];

        try {
            const decoded = verifyToken(token);
            const user = await getUserById(decoded.userId);
            return user.success;
        } catch (error) {
            console.error("Error checking user permissions:", error);
            return false;
        }
    }

    static async getUserId(req: Request): Promise<string | null> {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return null;
        }
        const token = authHeader.split(' ')[1];

        try {
            const decoded = verifyToken(token);
            const user = await getUserById(decoded.userId);
            if (user.success && user.data) {
                return user.data.id;
            }
            return null;
        } catch (error) {
            console.error('Error retrieving user ID from session:', error);
            return null;
        }
    }
}