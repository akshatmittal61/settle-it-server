import { AuthController } from "../controllers";
import { router, wrapper } from "./base";
import { authMiddleware } from "../middlewares";

router.route("/auth/otp/request").post(AuthController.requestOtp);
router.route("/auth/login").post(AuthController.login);
router.route("/auth/verify").get(authMiddleware, AuthController.verify);
router.route("/auth/logout").get(authMiddleware, AuthController.logout);

export const apiRouter = wrapper(router);
