import { Router } from "express";
import { authenticated, getUser, organizerOnly } from "./auth";
import {
  DISCORD_OAUTH_URL,
  END_OF_CON,
  IS_PROD,
  START_OF_CON,
} from "./constants";
import { DatabaseGame, DatabaseGameTime, DatabaseUser, db } from "./db";
import { z, ZodError } from "zod";

import slugify from "slugify";
import markdownIt from "markdown-it";
import { fromZodError } from "zod-validation-error";

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

const allowedContentWarnings = [
  "animals in peril",
  "apocalypses",
  "betrayal",
  "body horror",
  "bugs",
  "clowns",
  "cosmic horror",
  "discrimination against ancestry",
  "discrimination against culture",
  "discrimination against disabled people",
  "discrimination against gender",
  "discrimination against religion",
  "discrimination against sexuality",
  "discrimination against weight",
  "domestic violence",
  "drowning",
  "earthquake",
  "financial instability",
  "fire",
  "flood",
  "gore",
  "hate speech",
  "human sacrifice",
  "imperialism or colonialism",
  "injury to body parts",
  "involuntary commitment",
  'lovecraftian "insanity"',
  "military violence",
  "mind control",
  "police violence",
  "pregnancy complications",
  "prison",
  "rats",
  "serial killers",
  "sexual content",
  "sexual violence",
  "sharks",
  "shipwrecks",
  "snakes",
  "spider",
  "storms",
  "terrorism",
  "torture",
  "tsunami",
  "undead",
  "violence against animals",
  "violence against children",
  "violence against elders",
  "wildfire",
];

const parseStringBool = (s: string) => {
  if(s === 'true') {
    return true
  } else if(s === 'false') {
    return false
  } else {
    return undefined
  }
}

const filterSchema = z.object({
  content_warnings: z.array(z.string()).max(allowedContentWarnings.length).refine(a => a.every(s => allowedContentWarnings.includes(s))),
  entered: z.string().max(5).transform(parseStringBool),
  running: z.string().max(5).transform(parseStringBool),
  text: z.string().max(1000)
}).partial();

// SAFETY: we know that each `cw` has to be part of `allowedContentWarnings`, unless zod breaks
// if zod breaks we have worse to worry about
const makeContentWarningFilter = (cws: string[]) => cws.map(cw => `games.content_warnings not like '%${cw}%'`).join(' and ')

const makeStatusFilter = (entered: boolean | undefined, running: boolean | undefined) => {
  const runningFilter = `games.organizer = $userID`
  const enteredFilter = `exists (
        select 1
        from entries
        inner join game_times on entries.game_time = game_times.id
        where entries.user = $userID and game_times.game = games.id
      )`
  
  let filter = ''
  if(running === true) {
    filter += runningFilter
  } else if(running === false) {
    filter += `not ${runningFilter}`
  }

  if(entered === true) {
    if(filter !== '') {
      filter += ' or '
    }
    filter += enteredFilter
  } else if(entered === false) {
    if(filter !== '') {
      filter += ' or '
    }
    filter += `not ${enteredFilter}`
  }

  return filter
}

const makeTextFilter = (text?: string) => {
  if(text) {
    return `games.name like '%$filterText%' or games.summary like '%$filterText%' or games.description like '%$filterText%'`
  } else {
    return ''
  }
}


const makeGamesFilter = (filter: z.infer<typeof filterSchema>) => {
  const contentWarningFilter = makeContentWarningFilter(filter.content_warnings || [])
  const statusFilter = makeStatusFilter(filter.entered, filter.running)
  const textFilter = makeTextFilter(filter.text)
  const overall = [contentWarningFilter, statusFilter, textFilter].filter(f => f !== '').join(' and ')
  if(overall === '') {
    return ''
  } else {
    return `where ${overall}`
  }
}

router.get("/games", (req, res) => {
  const page = parseInt(req.query.page as string, 10) || 1;

  let hasFilter = false;

  
  const filterRes = filterSchema.safeParse(req.query);
  const filter = (() => {
    if(filterRes.error) {
      console.log(filterRes.error)
      return {} as z.infer<typeof filterSchema>
    } else {
      hasFilter = true
      return filterRes.data
    }
  })()

  console.log('q', JSON.stringify(req.query))
  console.log('f', JSON.stringify(filter))

  const userID = req.session.user?.id

  if(!userID) {
    filter.entered = undefined;
    filter.running = undefined;
  }

  const total_games = db
    .prepare("select count(1) from games")
    .pluck()
    .get() as number;

  const games = db
    .prepare(
      `
        select distinct
            games.slug as games_slug,
            games.name as games_name,
            games.summary as games_summary,
            games.created_at as games_created_at, 

            users.discord_id as users_id,
            users.display_name as users_display_name,
            users.avatar as users_avatar
        from games
        
        inner join users on games.organizer = users.id
        left join game_times on games.id = game_times.game
        left join entries on game_times.id = entries.game_time
        ${makeGamesFilter(filter)}
        order by games.created_at desc
        limit 10
        offset $offset
    `,
    )
    .all({
      offset: (page - 1) * 10,
      userID,
      filterText: filter.text
    })
    .map((row) => ({
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
        },
      },
    }));

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
    filter,
    hasFilter
  });
});

router.get("/games/new", organizerOnly, (_, res) => {
  res.view("new-game", { title: "New game" });
});

const createGameSchema = z.object({
  name: z.string().max(50),
});

router.post("/games", organizerOnly, (req, res) => {
  const result = createGameSchema.safeParse(req.body);
  if (!result.success) {
    res.sendStatus(400);
    return;
  }
  const { name } = result.data;
  const slug = slugify(name);
  if (slug === "new" || slug === "") {
    res.status(400).view("error", {
      error: { message: "Invalid game name", status: "Invalid request" },
    });
    return;
  }
  const organizer = req.session.user!.id; // safety: covered by organizerOnly
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
    .prepare(
      `
      select 
        games.*,
        users.discord_id as users_id,
        users.display_name as users_display_name,
        users.avatar as users_avatar 
      from games 
      inner join users on games.organizer = users.id
      where slug = $slug
    `,
    )
    .get({ slug: req.params.slug }) as DatabaseGame & {
    users_id: string;
    users_display_name: string;
    users_avatar: string;
  };

  if (!game) {
    res.status(404).send("Game not found");
    return;
  }

  const userID = req.session.user?.id;
  const gameID = game.id

  const currentGameTimes = (
    db
      .prepare(
        `
      select 
      *, 
      (
        select count(1) 
        from entries 
        where entries.game_time = game_times.id
      ) as entries_count
      from game_times
      where game = $gameID
      order by start asc
    `,
      )
      .all({ gameID: game.id }) as (DatabaseGameTime & {
      entries_count: number;
    })[]
  );

  const otherRanGameTimes = userID ? db
    .prepare(
      `
    select
      game_times.*,
      games.name as game_name,
      games.slug as game_slug
    from game_times
    inner join games on game_times.game = games.id
    where games.organizer = $userID and games.id != $gameID
    order by start asc
  `,
    )
    .all({ userID, gameID }) as DatabaseGameTime[] : [];

  const enteredGameTimes = userID ? db
    .prepare(
      `
    select
      game_times.*,
      games.name as game_name,
      games.slug as game_slug
      from game_times
      inner join entries on game_times.id = entries.game_time
      inner join games on game_times.game = games.id
      where entries.user = $userID and games.id != $gameID
      order by start asc
    `,
    )
    .all({ userID, gameID }) as DatabaseGameTime[] : [];

  const organizer = {
    discord_id: game.users_id,
    display_name: game.users_display_name,
    avatar: game.users_avatar,
  };

  game.description = markdownIt().render(game.description);

  res.view("game", {
    game,
    currentGameTimes,
    otherRanGameTimes,
    enteredGameTimes,
    organizer,
  });
});


const filterTo = (allowed: string[]) => (arr: string[]) =>
  arr.filter((x) => allowed.includes(x));

router.get("/games/:slug/edit", organizerOnly, (req, res) => {
  const { slug } = req.params;

  const game = db
    .prepare("select * from games where slug = $slug")
    .get({ slug }) as DatabaseGame | undefined;

  if (!game) {
    res.status(404).send("Game not found");
    return;
  }

  if (req.session.user!.id !== game.organizer) {
    res.status(403).send("You are not the organizer of this game.");
    return;
  }

  res.view("edit-game", {
    game,
    allowedContentWarnings,
    error: false,
  });
});

const toErrorMessage = (e: ZodError) => fromZodError(e).message;

const contentWarningSchema = z
  .string()
  .max(1000)
  .transform((s) => s.split(","))
  .or(z.array(z.string()).max(allowedContentWarnings.length))
  .transform(filterTo(allowedContentWarnings));

const editGameSchema = z
  .object({
    name: z.string().max(50),
    summary: z.string().max(100),
    description: z.string().max(10_000),
    content_warnings: contentWarningSchema,
    custom_content_warnings: z.string().max(1000),
    min_players: z.coerce.number().int(),
    max_players: z.coerce.number().int(),
  })
  .partial()
  .refine(
    ({ min_players, max_players }) =>
      !(max_players && min_players) || max_players >= min_players,
  );

// one day God (firefox) will allow me to do PATCH from a form
router.post("/games/:slug/edit", organizerOnly, (req, res) => {
  const game = db
    .prepare("select * from games where slug = $slug")
    .get({ slug: req.params.slug }) as DatabaseGame | undefined;

  if (!game) {
    res.status(404).send("Game not found");
    return;
  }

  if (req.session.user!.id !== game.organizer) {
    res.status(403).send("You are not the organizer of this game.");
    return;
  }

  const result = editGameSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).view("edit-game", {
      game,
      error: toErrorMessage(result.error),
      allowedContentWarnings,
    });
    return;
  }

  let slug = game.slug;

  if (result.data.name && result.data.name !== game.name) {
    slug = slugify(result.data.name);
  }

  db.prepare(
    `
    update games set
      slug = $slug,
      name = $name,
      summary = $summary,
      description = $description,
      content_warnings = $content_warnings,
      custom_content_warnings = $custom_content_warnings,
      min_players = $min_players,
      max_players = $max_players
    where slug = $slug
  `,
  ).run({
    name: game.name,
    summary: game.summary,
    description: game.description,
    content_warnings: game.content_warnings,
    custom_content_warnings: game.custom_content_warnings,
    min_players: game.min_players,
    max_playerss: game.max_players,
    ...result.data,
    slug,
  });

  res.redirect(`/games/${slug}`);
});

router.get("/games/:slug/times", organizerOnly, (req, res) => {
  const game = db
    .prepare("select * from games where slug = $slug")
    .get({ slug: req.params.slug }) as DatabaseGame | undefined;

  if (!game) {
    res.status(404).send("Game not found");
    return;
  }

  const userID = req.session.user!.id;

  if (userID !== game.organizer) {
    res.status(403).send("You are not the organizer of this game.");
    return;
  }

  const gameID = game.id;

  // TODO: maybe try to reduce the amount of db calls we're making ..

  const thisGameTimes = db
    .prepare(
      `
    select 
      *, 
      (
        select count(1) 
        from entries 
        where entries.game_time = game_times.id
      ) as entries_count
      from game_times
      where game = $gameID
      order by start asc
    `,
    )
    .all({ gameID }) as (DatabaseGameTime & { entries_count: number })[];

  const otherRanGameTimes = db
    .prepare(
      `
    select
      game_times.*,
      games.name as game_name,
      games.slug as game_slug
    from game_times
    inner join games on game_times.game = games.id
    where games.organizer = $userID and games.id != $gameID
    order by start asc
  `,
    )
    .all({ userID, gameID }) as DatabaseGameTime[];

  const enteredGameTimes = db
    .prepare(
      `
    select
      game_times.*,
      games.name as game_name,
      games.slug as game_slug
      from game_times
      inner join entries on game_times.id = entries.game_time
      inner join games on game_times.game = games.id
      where entries.user = $userID and games.id != $gameID
      order by start asc
    `,
    )
    .all({ userID, gameID }) as DatabaseGameTime[];

  // TODO: do we know the game times are safe to include in html, or is there a possibility for xss?
  res.view("add-game-times", {
    game,
    thisGameTimes,
    otherRanGameTimes,
    enteredGameTimes,
    START_OF_CON,
    END_OF_CON,
  });
});

const conTimeSchema = z
  .number()
  .int()
  .refine((t) => {
    const date = new Date(t);
    return date >= START_OF_CON && date <= END_OF_CON;
  })
  .transform((t) => new Date(t).valueOf());

const createGameTimeSchema = z.object({
  start: conTimeSchema,
  end: conTimeSchema,
});

router.post("/games/:slug/times", organizerOnly, (req, res) => {
  const game = db
    .prepare("select * from games where slug = $slug")
    .get({ slug: req.params.slug }) as DatabaseGame | undefined;

  if (!game) {
    res.status(404).send("Game not found");
    return;
  }

  const userID = req.session.user!.id;

  if (userID !== game.organizer) {
    res.status(403).send("You are not the organizer of this game.");
    return;
  }

  

  const result = createGameTimeSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).send(toErrorMessage(result.error));
    return;
  }

  const rowid = db.prepare(
    `
    insert into game_times (game, start, end)
    values ($gameID, $start, $end)
    returning *
  `,
  ).run({
    gameID: game.id,
    start: result.data.start,
    end: result.data.end,
  });

  const gameTime = db
    .prepare("select * from game_times where id = $id")
    .get({ id: rowid.lastInsertRowid }) as DatabaseGameTime;

  res.status(201).send({ ...gameTime, entries_count: 0});
});

router.patch("/games/:slug/times/:id", organizerOnly, (req, res) => {
  const game = db
    .prepare("select * from games where slug = $slug")
    .get({ slug: req.params.slug }) as DatabaseGame | undefined;

  if (!game) {
    res.status(404).send("Game not found");
    return;
  }

  const userID = req.session.user!.id;

  if (userID !== game.organizer) {
    res.status(403).send("You are not the organizer of this game.");
    return;
  }

  const result = createGameTimeSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).send(toErrorMessage(result.error));
    return;
  }

  db.prepare(
    `
    update game_times set
      start = $start,
      end = $end
    where id = $timeID
  `,
  ).run({
    timeID: req.params.id,
    start: result.data.start,
    end: result.data.end,
  });

  res.status(200).send("Game time updated.");
});

router.delete("/games/:slug/times/:id", organizerOnly, (req, res) => {
  const game = db
    .prepare("select * from games where slug = $slug")
    .get({ slug: req.params.slug }) as DatabaseGame | undefined;

  if (!game) {
    res.status(404).send("Game not found");
    return;
  }

  const userID = req.session.user!.id;

  if (userID !== game.organizer) {
    res.status(403).send("You are not the organizer of this game.");
    return;
  }

  const gameTime = db
    .prepare("select * from game_times where id = $timeID and game = $gameID")
    .get({ timeID: req.params.id, gameID: game.id });

  if (!gameTime) {
    res.status(400).send("No game time by this ID found.");
  }

  db.prepare("delete from game_times where id = $timeID").run({
    timeID: req.params.id,
  });

  res.sendStatus(204);
});

router.get('/schedule', (req, res) => {
  if(!req.session.user) {
    const otherGameTimes = db
      .prepare(
        `
      select 
        game_times.*,
        games.name as game_name,
        games.slug as game_slug
      from game_times
      inner join games on game_times.game = games.id
      order by start asc
    `,
      )
      .all() as DatabaseGameTime[];

    res.view('schedule', {
      otherGameTimes,
      START_OF_CON,
      END_OF_CON,
      thisGameTimes: [],
      otherRanGameTimes: [],
      enteredGameTimes: [],
    });
  } else {
    const userID = req.session.user.id
    const otherRanGameTimes = db
      .prepare(
        `
      select
        game_times.*,
        games.name as game_name,
        games.slug as game_slug
      from game_times
      inner join games on game_times.game = games.id
      where games.organizer = $userID
      order by start asc
    `,
      )
      .all({ userID }) as DatabaseGameTime[];

    const enteredGameTimes = db
      .prepare(
        `
      select
        game_times.*,
        games.name as game_name,
        games.slug as game_slug
      from game_times
      inner join entries on game_times.id = entries.game_time
      inner join games on game_times.game = games.id
      where entries.user = $userID
      order by start asc
    `,
      )
      .all({ userID }) as DatabaseGameTime[];

    const otherGameTimes = db
      .prepare(
        `
      select 
        game_times.*,
        games.name as game_name,
        games.slug as game_slug
      from game_times
      inner join games on game_times.game = games.id
      where games.organizer != $userID and not exists (
        select 1
        from entries
        where entries.user = $userID and entries.game_time = game_times.id
      )
      order by start asc
    `,
      )
      .all({ userID }) as DatabaseGameTime[];

    res.view('schedule', {
      otherGameTimes,
      START_OF_CON,
      END_OF_CON,
      thisGameTimes: [],
      otherRanGameTimes,
      enteredGameTimes,
    });
  }
})


router.get('/users/:id', (req, res) => {
  const user = db
    .prepare("select * from users where discord_id = $id")
    .get({ id: req.params.id }) as DatabaseUser | undefined;

  if (!user) {
    res.status(404).send("User not found");
    return;
  }

  res.view('user', { user });
})