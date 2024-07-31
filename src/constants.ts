import { join } from "node:path";

const fromDir = (dir: string) => join(__dirname, dir);

export const VIEWS_DIR = fromDir("../views");
export const STATIC_DIR = fromDir("../static");
export const DB_FILE = fromDir("../gvc.db");

export const HOST = process.env.HOST || "localhost:9001";
export const PORT = process.env.PORT || 9001;

export const NODE_ENV = process.env.NODE_ENV || "development";
export const IS_PROD = NODE_ENV === "production";

export const DISCORD_OAUTH_URL = process.env.DISCORD_OAUTH2_URL;
export const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
export const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;

export const COOKIE_SECRET = process.env.COOKIE_SECRET;

if (!DISCORD_OAUTH_URL || !DISCORD_CLIENT_ID || !DISCORD_CLIENT_SECRET) {
  throw new Error("Discord OAuth URL, client ID, and secret are required.");
}

if (!COOKIE_SECRET) {
  throw new Error("Cookie secret is required.");
}

if (!process.env.START_OF_CON) {
  console.error('no start time set, assuming "2024-08-09T00:00:00Z"');
}

if (!process.env.END_OF_CON) {
  console.error('no end time set, assuming "2024-08-18T23:59:59Z"');
}

export const START_OF_CON = new Date(
  process.env.START_OF_CON || "2024-08-09T00:00:00Z",
);
export const END_OF_CON = new Date(
  process.env.END_OF_CON || "2024-08-18T23:59:59Z",
);
