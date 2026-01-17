import { Database } from './database.types';

type UserSession = Database['public']['Tables']['user_session']['Row'];

declare global {
    namespace Express {
        interface Request {
            session?: UserSession;
            userId?: number;
            token?: string;
        }
    }
}

export {}; 