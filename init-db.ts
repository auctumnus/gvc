import { Database } from "bun:sqlite";
import { unlink } from "node:fs/promises";

const schema = Bun.file(__dirname + "/schema.sql");

// normally i would just `drop table if exists`
// but i'm running into an issue where the database ends up being 0 bytes ??
const dbFile = __dirname + "/gvc.db";
await unlink(dbFile).catch(() => {});

const db = new Database(dbFile);

db.query(await schema.text()).all();
console.log("Created database!");
