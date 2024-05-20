import nodemailer from "nodemailer";
import "dotenv/config";

const { META_PASSWORD, META_FROM, BASE_URL } = process.env;
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const config = {
  host: "smtp.meta.ua",
  port: 465,
  secure: true,
  auth: {
    user: META_FROM,
    pass: META_PASSWORD,
  },
};

const transporter = nodemailer.createTransport(config);

export const sendVerifyEmail = async (emailTo, verificationToken) => {
  const emailOptions = {
    from: META_FROM,
    to: emailTo,
    subject: "Verify email",
    html: `<a target="_blank" href="${BASE_URL}/api/users/verify/${verificationToken}">Click to verify email</a>`,
  };
  try {
    const email = await transporter.sendMail(emailOptions);

    return email;
  } catch (error) {
    console.log(error);
  }
};
