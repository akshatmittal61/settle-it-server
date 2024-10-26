import { AdminController, AuthController } from "../controllers";
import { adminRoute, authenticatedRoute } from "../middlewares";
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

export const apiRouter = wrapper(router);
