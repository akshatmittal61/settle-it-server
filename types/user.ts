import { User } from "./models";

export interface IUser extends Omit<User, "createdAt" | "updatedAt"> {}
