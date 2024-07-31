import "dotenv/config";
import express from "express";
import {
  STATIC_DIR,
  VIEWS_DIR,
  PORT,
  IS_PROD,
  COOKIE_SECRET,
} from "./constants";
import { pinoHttp as logger } from "pino-http";
import { router } from "./routes";
import { renderer } from "./view";
import session from "express-session";
import { SessionStore } from "./session-store";

const app = express();

app.set("view engine", "ejs");
app.set("views", VIEWS_DIR);

app.use(express.static(STATIC_DIR));
app.use(logger());
app.use(
  session({
    secret: COOKIE_SECRET!, // safety: if not defined, `constants.ts` throws an error
    resave: false,
    cookie: {
      secure: IS_PROD,
    },
    store: new SessionStore(),
    saveUninitialized: false,
  }),
);
app.use(renderer);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(router);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
  if (IS_PROD) {
    console.log("Currently running in production mode.");
  } else {
    console.log("Currently running in development mode!");
  }
});
