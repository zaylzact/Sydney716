# Discord Selfbot

A Discord selfbot with rich presence, built with `discord.js-selfbot-v13`. Designed for Railway deployment.

## Setup

1. **Install dependencies**
   ```
   npm install
   ```

2. **Set your token**  
   In Railway, add an environment variable:
   ```
   TOKEN=your_discord_account_token_here
   ```
   Never commit your token to Git.

3. **Start the bot**
   ```
   npm start
   ```

## Railway Deployment

- Connect this repo in Railway and it will run `npm start` automatically.
- Add `TOKEN` as an environment variable in the Railway dashboard under your service settings.
