import { Router } from "express";
import {
  register,
  verify,
  resendVerifyEmail,
  login,
  logout,
  getCurrent,
  updateAvatar,
} from "../controllers/userControllers.js";
import validateBody from "../helpers/validateBody.js";
import { registerSchema, loginSchema, userEmailSchema } from "../models/userModel.js";
import { authenticate } from "../helpers/authenticate.js";
import { upload } from "../helpers/upload.js";

const userRouter = Router();

// signup

userRouter.post("/register", validateBody(registerSchema), register);

// verify email

userRouter.get("/verify/:verificationToken", verify);

// resend verification email

userRouter.post("/verify", validateBody(userEmailSchema), resendVerifyEmail);

// signin

userRouter.post("/login", validateBody(loginSchema), login);

// logout

userRouter.post("/logout", authenticate, logout);

// check current user if token is available

userRouter.get("/current", authenticate, getCurrent);

// update avatar

userRouter.patch("/avatars", authenticate, upload.single("avatar"), updateAvatar);

export default userRouter;
