import { IUser } from "../types";
import { GroupService } from "./group.service";

export class FriendService {
	public static async getFriends(userId: string): Promise<Array<IUser>> {
		const groups = await GroupService.getGroupsUserIsPartOf(userId);
		const members = groups.map((group) => group.members).flat();
		const allFriends = members.filter((member) => member.id !== userId);
		const friendsMap = new Map<string, IUser>();
		for (const friend of allFriends) {
			friendsMap.set(friend.id, friend);
		}
		const uniqueUserIds = Array.from(friendsMap.keys());
		return uniqueUserIds.map((id) => friendsMap.get(id)!);
	}
}
