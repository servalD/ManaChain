import { Database } from './database.types';

type UserSession = Database['public']['Tables']['user_session']['Row'];
type User = Database['public']['Tables']['user']['Row'];

declare global {
    namespace Express {
        interface Request {
            session?: UserSession;
            userId?: number;
            token?: string;
            user?: User;
        }
    }
}

export {}; 