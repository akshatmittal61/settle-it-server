import {
	AdminController,
	AuthController,
	GroupController,
} from "../controllers";
import { adminRoute, authenticatedRoute, isGroupMember } from "../middlewares";
import { router, wrapper } from "./base";

// Admin routes
router.route("/admin/groups").get(adminRoute, AdminController.getAllGroups);
router.route("/admin/users").get(adminRoute, AdminController.getAllUsers);

// Auth routes
router.route("/auth/otp/request").post(AuthController.requestOtp);
router.route("/auth/otp/verify").post(AuthController.verifyOtp);
router.route("/auth/login").post(AuthController.login);
router.route("/auth/verify").get(authenticatedRoute, AuthController.verify);
router.route("/auth/logout").get(authenticatedRoute, AuthController.logout);

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

export const apiRouter = wrapper(router);
