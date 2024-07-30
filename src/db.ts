import Database from "better-sqlite3";
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
  slug: string;
  name: string;
  description: string;
  summary: string;
  content_warnings: string;
  custom_content_warnings: string;
  min_players: number;
  max_players: number;
  organizer: number;
  created_at: string;
}

export interface DatabaseGameTime {
  id: number;
  game: number;
  start: number;
  end: number;

  created_at: number;
}
