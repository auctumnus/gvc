import { Router } from "express";
import { authenticated, getUser, organizerOnly } from "./auth";
import { DISCORD_OAUTH_URL, IS_PROD } from "./constants";
import { DatabaseGame, DatabaseUser, db } from "./db";
import slugify from "slugify";


export const router = Router();

router.get("/", (_, res) => {
  res.view("index", { title: "Home" });
});

router.get("/login", (_, res) => {
  res.redirect(DISCORD_OAUTH_URL!);
});

declare module "express-session" {
  interface SessionData {
    user: DatabaseUser;
  }
}

router.get("/auth", async (req, res) => {
  const { code } = req.query;
  if (code && typeof code === "string") {
    try {
      const { user, avatar, oauth } = await getUser(code);

      const existingUser = db
        .prepare("select * from users where discord_id = ?")
        .get(user.id) as DatabaseUser;
      let dbUser: DatabaseUser;
      if (existingUser) {
        dbUser = db
          .prepare(
            `
                    update users set
                        username = $username,
                        display_name = $display_name,
                        avatar = $avatar,
                        refresh_token = $refresh_token
                    where discord_id = $discord_id
                    returning *
                `,
          )
          .get({
            username: user.username,
            display_name: user.global_name || "",
            avatar: avatar,
            refresh_token: oauth.refreshToken,
            discord_id: user.id,
          }) as DatabaseUser;
      } else {
        dbUser = db
          .prepare(
            `
                    insert into users (
                        discord_id,
                        username,
                        display_name,
                        avatar,
                        refresh_token
                    ) values (
                        $discord_id,
                        $username,
                        $display_name,
                        $avatar,
                        $refresh_token
                    )
                    returning *
                `,
          )
          .get({
            discord_id: user.id,
            username: user.username,
            display_name: user.global_name || user.username,
            avatar: avatar,
            refresh_token: oauth.refreshToken,
          }) as DatabaseUser;
      }
      req.session.user = dbUser;
      res.redirect("/");
    } catch (e) {
      if (IS_PROD) {
        res.status(500).view("error", {
          error: {
            message: "An error occurred.",
            status: "Internal server error",
          },
        });
      } else {
        res.status(500).view("error", {
          error: {
            message: e.message,
            status: "Internal server error",
          },
        });
      }
    }
  } else {
    res.sendStatus(403);
  }
});

router.get("/logout", authenticated, (req, res) => {
  res.view("logout", { title: "Logout" });
});

router.post("/logout", (req, res) => {
  // TODO: destroy refresh token?
  req.session.destroy(() => {
    res.redirect("/");
  });
});

router.get("/games", (req, res) => {
  const page = parseInt(req.query.page as string, 10) || 1;
  const games = db
    .prepare(
      `
        select 
            games.slug as games_slug,
            games.name as games_name,
            games.summary as games_summary,
            games.created_at as games_created_at, 
        

            users.id as users_id,
            users.display_name as users_display_name,
            users.avatar as users_avatar 
        from games
        inner join users on games.organizer = users.id
        order by created_at desc
        limit 10
        offset $offset
    `,
    )
    .all({
      $offset: (page - 1) * 10,
    }).map(row => ({
      game: {
         // @ts-ignore
        slug: row.games_slug,
         // @ts-ignore
        name: row.games_name,
         // @ts-ignore
        summary: row.games_summary,
         // @ts-ignore
        created_at: row.games_created_at,
      },
      organizer: {
         // @ts-ignore
        id: row.users_id,
         // @ts-ignore
        display_name: row.users_display_name,
         // @ts-ignore
        avatar: row.users_avatar,
      }
    }));
  console.log(games);
  res.view("games", { games });
});

router.get("/games/new", organizerOnly, (_, res) => {
  res.view("new-game", { title: "New game" });
});

router.post("/games", organizerOnly, (req, res) => {
  const { name, summary, description } = req.body;
  const slug = slugify(name);
  if (slug === "new" || slug === "") {
    res
      .status(400)
      .view("error", {
        error: { message: "Invalid game name", status: "Invalid request" },
      });
    return;
  }
  const organizer = req.session.user!.id; // safety: covered by organizerOnly
  console.log(organizer)
  db.prepare(
    `
    insert into games (slug, name, summary, description, organizer)
    values ($slug, $name, $summary, $description, $organizer)
    returning *
  `,
  ).run({
    slug: slug,
    name: name,
    summary: summary,
    description: description,
    organizer: organizer,
  });
  res.redirect(`/games/${slug}`);
});

router.get("/games/:slug", (req, res) => {
  const game = db
    .prepare("select * from games where slug = $slug")
    .get({ slug: req.params.slug });
  if (!game) {
    res.status(404).send("Game not found");
    return;
  }
});
