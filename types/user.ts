import { AuthMapping, User } from "./models";

export type IUser = Omit<User, "createdAt" | "updatedAt">;
export type IAuthMapping = Omit<AuthMapping, "user"> & { user: IUser | null };
