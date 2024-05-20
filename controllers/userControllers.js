import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import gravatar from "gravatar";
import path from "path";
import { promises as fs } from "fs";
import HttpError from "../helpers/HttpError.js";
import { User } from "../models/userModel.js";
import { ctrlWrapper } from "../helpers/ctrlWrapper.js";
import Jimp from "jimp";
import { nanoid } from "nanoid";
import { sendVerifyEmail } from "../helpers/sendEmail.js";

const { SECRET_KEY, BASE_URL } = process.env;

const avatarsDir = path.resolve("public/avatars");

// Registration

const registerUser = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (user) throw HttpError(409, "Email in use");

  const hashPassword = await bcrypt.hash(password, 10);
  const verificationToken = nanoid();

  const avatarURL = gravatar.url(email);

  const newUser = await User.create({
    ...req.body,
    password: hashPassword,
    avatarURL,
    verificationToken,
  });

  await sendVerifyEmail(email, verificationToken);

  res.status(201).json({
    user: { email: newUser.email, subscription: newUser.subscription },
  });
};

export const register = ctrlWrapper(registerUser);

// Verify email

const verifyEmail = async (req, res) => {
  const { verificationToken } = req.params;
  const user = await User.findOne({ verificationToken });

  if (!user) throw HttpError(404, "User not found");

  await User.findByIdAndUpdate(user._id, { verify: true, verificationToken: null });

  res.json({
    message: "Verification successful",
  });
};
export const verify = ctrlWrapper(verifyEmail);

// Resend Email with Verification Token

const resendVerifyEmailUser = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    throw HttpError(401, "User not found");
  }
  if (user.verify) {
    throw HttpError(400, "Verification has already been passed");
  }

  const verifyEmail = {
    to: email,
    subject: "Verify email",
    html: `<a target="_blank" href="${BASE_URL}/api/auth/verify/${user.verificationToken}">Click to verify email</a>`,
  };

  await sendEmail(verifyEmail);

  res.json({
    message: "Verify email send success",
  });
};
export const resendVerifyEmail = ctrlWrapper(resendVerifyEmailUser);

// Login

const loginUser = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).exec();

  if (!user) {
    throw HttpError(401, "Email or password is wrong");
  }

  if(!user.verify) {
    throw HttpError(401, "Email not verified");
}

  const passwordCompare = await bcrypt.compare(password, user.password);

  if (!passwordCompare) {
    throw HttpError(401, "Email or password is wrong");
  }

  const payload = {
    id: user._id,
  };

  const token = jwt.sign(payload, SECRET_KEY, { expiresIn: "23h" });

  await User.findByIdAndUpdate(user._id, { token });

  res.status(200).json({
    token,
    user: { email: user.email, subscription: user.subscription },
  });
};

export const login = ctrlWrapper(loginUser);

// logout

const logoutUser = async (req, res) => {
  const { _id } = req.user;
  await User.findByIdAndUpdate(_id, { token: null });

  res.status(204).send();
};

export const logout = ctrlWrapper(logoutUser);

const getCurrentUser = async (req, res) => {
  const { email, subscription } = req.user;

  res.status(200).json({
    email,
    subscription,
  });
};
export const getCurrent = ctrlWrapper(getCurrentUser);

// update user's Subscription

const updateSubscription = async (req, res, next) => {
  const { _id: user } = req.user;

  const userSubscription = await User.findByIdAndUpdate(user, req.body, {
    new: true,
  });

  if (!userSubscription) return next();

  const { email, subscription } = userSubscription;

  res.status(200).json({
    email,
    subscription,
  });
};
export const subscriprion = ctrlWrapper(updateSubscription);

// update user's Avatar

const updateUserAvatar = async (req, res) => {
  const { _id } = req.user;
  const { path: tempUpload, originalname } = req.file;

  const filename = `${_id}_${originalname}`;
  const resultUpload = path.join(avatarsDir, filename);

  async function resize() {
    const image = await Jimp.read(tempUpload);
    image
      .resize(250, 250, function (err) {
        if (err) throw err;
      })
      .write(tempUpload);

    await fs.rename(tempUpload, resultUpload);
  }

  resize();

  const avatarURL = path.join("avatars", filename);

  await User.findByIdAndUpdate(_id, { avatarURL });

  res.json({
    avatarURL,
  });
};

export const updateAvatar = ctrlWrapper(updateUserAvatar);
