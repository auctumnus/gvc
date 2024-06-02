import Database from "better-sqlite3"
import { DB_FILE } from "./constants";

export const db = new Database(DB_FILE);

export interface DatabaseUser {
  id: number;
  discord_id: string;

  username: string;
  display_name: string;
  avatar: string;

  organizer: boolean;
  admin: boolean;

  refresh_token: string;

  created_at: string;
}

export interface DatabaseGame {
  id: number;
  name: string;
  description: string;
  organizer: number;
  created_at: string;
}
