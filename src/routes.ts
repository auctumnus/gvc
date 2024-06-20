import { Router } from "express";
import { authenticated, getUser, organizerOnly } from "./auth";
import { DISCORD_OAUTH_URL, IS_PROD } from "./constants";
import { DatabaseGame, DatabaseGameTime, DatabaseUser, db } from "./db";

import slugify from "slugify";
import markdownIt from "markdown-it";


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
  const total_games = db.prepare('select count(1) from games').pluck().get() as number
  const games = db
    .prepare(
      `
        select 
            games.slug as games_slug,
            games.name as games_name,
            games.summary as games_summary,
            games.created_at as games_created_at, 

            users.discord_id as users_id,
            users.display_name as users_display_name,
            users.avatar as users_avatar
        from games
        inner join users on games.organizer = users.id
        order by games.created_at desc
        limit 10
        offset $offset
    `,
    )
    .all({
      offset: (page - 1) * 10,
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

        organizer: {
          // @ts-ignore
         discord_id: row.users_id,
          // @ts-ignore
         display_name: row.users_display_name,
          // @ts-ignore
         avatar: row.users_avatar,
       }
      }
    }));
  console.log(games)

  const lastPage = Math.ceil(total_games / 10);
  const pagesLeft = lastPage - page;
  const isFirstPage = page === 1;
  const isLastPage = pagesLeft === 0;
  const nextPage = isLastPage ? null : page + 1;
  const prevPage = isFirstPage ? null : page - 1;
  res.view("games", {
    games,
    page,
    lastPage,
    pagesLeft,
    nextPage,
    prevPage,
    isFirstPage,
    isLastPage,
  });
});

router.get("/games/new", organizerOnly, (_, res) => {
  res.view("new-game", { title: "New game" });
});

router.post("/games", organizerOnly, (req, res) => {
  const { name } = req.body;
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
    insert into games (slug, name, organizer)
    values ($slug, $name, $organizer)
    returning *
  `,
  ).run({ slug, name, organizer });
  res.redirect(`/games/${slug}`);
});


router.get("/games/:slug", (req, res) => {
  const game = db
    .prepare(`
      select 
        games.*,
        users.discord_id as users_id,
        users.display_name as users_display_name,
        users.avatar as users_avatar 
      from games 
      inner join users on games.organizer = users.id
      where slug = $slug
    `)
    .get({ slug: req.params.slug }) as DatabaseGame & { users_id: string, users_display_name: string, users_avatar: string};

  if (!game) {
    res.status(404).send("Game not found");
    return;
  }

  const gameTimes = (db
    .prepare(`
      select
        game_times.*,
        count(entries.game_time) as num_entries
      from game_times
      left join entries on (game_times.id == entries.game_time)
      where 
        game_times.game = $gameID
      
    `)
    .all({ gameID: game.id }) as (DatabaseGameTime & {num_entries: number})[]).filter(gt => gt.num_entries > 0)

    const organizer = {
      discord_id: game.users_id,
      display_name: game.users_display_name,
      avatar: game.users_avatar
    }

    game.description = markdownIt().render(game.description)

    res.view('game', {
      game,
      gameTimes,
      organizer
    })
});

const allowedContentWarnings = [
  'violence',
  'sexual-content',
  'body-horror',
  'existential-horror'
]

const filterTo = (arr: string[], allowed: string[]) => arr.filter(x => allowed.includes(x))

router.get("/games/:slug/edit", organizerOnly, (req, res) => {
  const { slug } = req.params;

  const game = db
    .prepare("select * from games where slug = $slug")
    .get({ slug }) as DatabaseGame | undefined;

  if(!game) {
    res.status(404).send("Game not found");
    return;
  }

  if(req.session.user!.id !== game.organizer) {
    res.status(403).send("You are not the organizer of this game.");
    return;
  }

  res.view("edit-game", {
    game
  })
})

// one day God (firefox) will allow me to do PATCH from a form
router.post("/games/:slug/edit", organizerOnly, (req, res) => {
  const game = db
    .prepare("select * from games where slug = $slug")
    .get({ slug: req.params.slug }) as DatabaseGame | undefined;

  if(!game) {
    res.status(404).send("Game not found");
    return;
  }

  if(req.session.user!.id !== game.organizer) {
    res.status(403).send("You are not the organizer of this game.");
    return;
  }

  let slug = game.slug

  if(req.body.name && req.body.name !== game.name) {
    slug = slugify(req.body.name)
  }

  let contentWarnings = game.content_warnings

  if(req.body.contentWarnings) {
    let cws = req.body.contentWarnings
    if(typeof req.body.contentWarnings === 'string') {
      cws = [req.body.contentWarnings]
    }
    contentWarnings = filterTo(cws, allowedContentWarnings).join(',')
  }

  db.prepare(`
    update games set
      slug = $slug,
      name = $name,
      summary = $summary,
      description = $description,
      content_warnings = $contentWarnings,
      custom_content_warnings = $customContentWarnings,
      min_players = $minPlayers,
      max_players = $maxPlayers
    where slug = $slug
  `).run({
    name: game.name,
    summary: game.summary,
    description: game.description,
    customContentWarnings: game.custom_content_warnings,
    minPlayers: game.min_players,
    maxPlayers: game.max_players,
    ...req.body,
    slug,
    contentWarnings
  })

  res.redirect(`/game/${slug}`)

})
