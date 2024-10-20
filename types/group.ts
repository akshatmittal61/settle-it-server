import { Group } from "./models";
import { IUser } from "./user";

export type IGroup = Omit<Group, "members" | "createdBy"> & {
	members: Array<IUser>;
	createdBy: IUser;
};

export type CreateGroupData = Omit<
	Group,
	"id" | "createdBy" | "createdAt" | "updatedAt"
>;

export type UpdateGroupData = CreateGroupData;
