import { randomBytes } from "crypto";
import { writeFileSync } from "fs";

const secret = randomBytes(32).toString("hex");
const password = randomBytes(12).toString("base64url");
const body = [
  'DATABASE_URL="file:./dev.db"',
  `AUTH_SECRET="${secret}"`,
  'NEXT_PUBLIC_SITE_URL="http://localhost:3000"',
  'ADMIN_EMAIL="desk@thehostels.local"',
  `ADMIN_PASSWORD="${password}"`,
  'DEV_EXPOSE_RESET_LINKS="true"',
  'NEXT_PUBLIC_CONTACT_EMAIL=""',
  'NEXT_PUBLIC_CONTACT_PHONE=""',
  'NEXT_PUBLIC_INSTAGRAM_URL=""',
  'RAZORPAY_KEY_ID=""',
  'RAZORPAY_KEY_SECRET=""',
  'RAZORPAY_WEBHOOK_SECRET=""',
  'SMTP_HOST=""',
  'SMTP_PORT="587"',
  'SMTP_USER=""',
  'SMTP_PASSWORD=""',
  'SMTP_FROM=""',
  'WHATSAPP_TOKEN=""',
  'WHATSAPP_PHONE_NUMBER_ID=""',
].join("\n");
writeFileSync(".env", body + "\n");
writeFileSync(".admin-local.txt", `Local staff sign-in (development only)\nEmail: desk@thehostels.local\nPassword: ${password}\n`);
console.log("env written");
