import { User } from "./models";

export type IUser = Omit<User, "createdAt" | "updatedAt">;
