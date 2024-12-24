import {
	AdminController,
	AuthController,
	ExpenseController,
	FriendController,
	GroupController,
	MemberController,
	UserController,
} from "../controllers";
import { adminRoute, authenticatedRoute, isGroupMember } from "../middlewares";
import { router, wrapper } from "./base";

// Admin routes
router.route("/admin/groups").get(adminRoute, AdminController.getAllGroups);
router.route("/admin/users").get(adminRoute, AdminController.getAllUsers);

// Auth routes
router.route("/auth/verify").get(authenticatedRoute, AuthController.verify);
router.route("/auth/logout").get(authenticatedRoute, AuthController.logout);
router.route("/auth/otp/request").post(AuthController.requestOtp);
router.route("/auth/otp/verify").post(AuthController.verifyOtp);

// User routes
router
	.route("/users")
	.patch(authenticatedRoute, UserController.updateUserDetails);
router
	.route("/users/invite")
	.post(authenticatedRoute, UserController.inviteUser);
router
	.route("/users/search")
	.post(authenticatedRoute, UserController.searchForUsers);

// Group Routes
router
	.route("/groups")
	.get(authenticatedRoute, GroupController.getGroupsForUser)
	.post(authenticatedRoute, GroupController.createGroup);
router
	.route("/groups/:groupId")
	.get(authenticatedRoute, isGroupMember, GroupController.getGroupDetails)
	.patch(
		authenticatedRoute,
		isGroupMember,
		GroupController.updateGroupDetails
	)
	.delete(authenticatedRoute, isGroupMember, GroupController.deleteGroup);
router
	.route("/groups/:groupId/summary")
	.get(authenticatedRoute, isGroupMember, GroupController.getBalancesSummary);
router
	.route("/groups/:groupId/transactions")
	.get(authenticatedRoute, isGroupMember, GroupController.getAllTransactions);
router
	.route("/groups/:groupId/members")
	.post(authenticatedRoute, isGroupMember, GroupController.addMembers);
router
	.route("/groups/:groupId/members/settle")
	.patch(
		authenticatedRoute,
		isGroupMember,
		MemberController.settleOwedMembersInGroup
	);

// Expense routes
router
	.route("/groups/:groupId/expenses")
	.get(authenticatedRoute, isGroupMember, GroupController.getGroupExpenses)
	.post(authenticatedRoute, isGroupMember, ExpenseController.createExpense);
router
	.route("/groups/:groupId/expenses/:expenseId")
	.patch(authenticatedRoute, isGroupMember, ExpenseController.updateExpense)
	.delete(authenticatedRoute, isGroupMember, ExpenseController.removeExpense);
router
	.route("/groups/:groupId/expenses/:expenseId/settle")
	.patch(authenticatedRoute, isGroupMember, ExpenseController.settleExpense);
router
	.route("/expenses")
	.get(authenticatedRoute, ExpenseController.getUsersExpenses);

// Member routes
router
	.route("/groups/:groupId/expenses/:expenseId/members")
	.get(
		authenticatedRoute,
		isGroupMember,
		MemberController.getMembersForExpense
	);
router
	.route("/groups/:groupId/expenses/:expenseId/settle/:memberId")
	.patch(
		authenticatedRoute,
		isGroupMember,
		MemberController.settleMemberInExpense
	);
router
	.route("/friends")
	.get(authenticatedRoute, FriendController.getUserFriends);

export const apiRouter = wrapper(router);
