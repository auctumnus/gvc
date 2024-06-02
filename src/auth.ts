import {
  DISCORD_CLIENT_ID,
  DISCORD_CLIENT_SECRET,
  PORT,
  HOST,
} from "./constants";

const getOauthData = (code: string) =>
  fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    body: new URLSearchParams({
      client_id: DISCORD_CLIENT_ID!, // safety: if not defined, `constants.ts` throws an error
      client_secret: DISCORD_CLIENT_SECRET!,
      code,
      grant_type: "authorization_code",
      redirect_uri: `http://${HOST}:${PORT}/auth`,
    }).toString(),
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

interface DiscordUser {
  id: string;
  username: string;
  global_name?: string;
  avatar: string;
}

const getAvatar = (user: DiscordUser) =>
  `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`;

export const getUser = async (oauthCode: string) => {
  const tokenResponseData = await getOauthData(oauthCode);
  console.log(tokenResponseData);
  const oauthData = await tokenResponseData.json();
  console.log(oauthData);
  const userResult = await fetch("https://discord.com/api/users/@me", {
    headers: {
      authorization: `${oauthData.token_type} ${oauthData.access_token}`,
    },
  });
  const body = await userResult.json();
  console.log(body);
  const { id } = body;
  if (!id) {
    throw new Error("No ID found on user.");
  }

  const user = body as DiscordUser;
  const avatar = getAvatar(user);

  return {
    user,
    avatar,
    oauth: {
      refreshToken: oauthData.refresh_token as string,
      accessToken: oauthData.access_token as string,
    },
  };
};

export const authenticated = (
  req: Express.Request,
  res: Express.Response,
  next: () => void,
) => {
  if (!req.session.user) {
    res.redirect("/login");
  } else {
    next();
  }
};

export const organizerOnly = (
  req: Express.Request,
  res: Express.Response,
  next: () => void,
) => {
  if (!req.session.user?.organizer && !req.session.user?.admin) {
    res.redirect("/");
  } else {
    next();
  }
};

export const adminOnly = (
  req: Express.Request,
  res: Express.Response,
  next: () => void,
) => {
  if (!req.session.user?.admin) {
    res.redirect("/");
  } else {
    next();
  }
};
