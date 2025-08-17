import { IUser } from '../modules/user';

declare global {
    namespace Express {
        interface Request {
            user?: IUser;
            
        }
    }
}
