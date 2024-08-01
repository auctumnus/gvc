import type { Request, Response } from "express";
import { DISCORD_OAUTH_URL, START_OF_CON, END_OF_CON } from "./constants";

export const render = (
  req: Request,
  res: Response,
  path: string,
  params: Record<string, any> = {},
) => {
  const authorized = !!req.session;
  res.render("layout", {
    path,
    params,
    authorized,
    user: authorized ? req.session.user : null,
    organizer: req.session.user?.organizer || false,
    admin: req.session.user?.organizer || false,
    login_url: DISCORD_OAUTH_URL,
    START_OF_CON: START_OF_CON,
    END_OF_CON: END_OF_CON,
  });
};

declare global {
  namespace Express {
    interface Response {
      view: (path: string, params?: Record<string, any>) => void;
    }
  }
}

export const renderer = (req: Request, res: Response, next: () => void) => {
  res.view = (path, params) => render(req, res, path, params);
  next();
};
