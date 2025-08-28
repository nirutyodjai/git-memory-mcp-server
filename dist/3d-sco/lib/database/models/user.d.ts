import { User } from '../../auth';
export interface CreateUserData {
    username: string;
    email: string;
    password: string;
    name?: string;
    bio?: string;
}
export interface UpdateUserData {
    name?: string;
    bio?: string;
    avatar_url?: string;
}
export declare function createUser(userData: CreateUserData): Promise<User>;
export declare function findUserByEmail(email: string): Promise<User | null>;
export declare function findUserByUsername(username: string): Promise<User | null>;
export declare function findUserById(id: number): Promise<User | null>;
export declare function verifyUserPassword(email: string, password: string): Promise<User | null>;
export declare function updateUser(id: number, updateData: UpdateUserData): Promise<User | null>;
export declare function updateLastLogin(id: number): Promise<void>;
export declare function emailExists(email: string): Promise<boolean>;
export declare function usernameExists(username: string): Promise<boolean>;
export declare function getUserCount(): Promise<number>;
export declare function getUsers(limit?: number, offset?: number): Promise<User[]>;
export declare function deactivateUser(id: number): Promise<boolean>;
export declare function reactivateUser(id: number): Promise<boolean>;
//# sourceMappingURL=user.d.ts.map