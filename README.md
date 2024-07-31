# Game Vault Con website

This is a website for Game Vault Con, an online convention centered around playing
tabletop roleplaying games.

## Configuration

1. Create a Discord application, and enable OAuth2. Take note of the client ID and secret.
2. Add a redirect URI of the form `https://HOST/auth`, with HOST denoting the host (and port)
   that the application will be running on.
3. Fill in the values in `.env.example` and move it to `.env`.

## Running

Build the Vue application with `npm run build`.

Ensure you're in the nix shell, then `npm install` and `npm run start`.
