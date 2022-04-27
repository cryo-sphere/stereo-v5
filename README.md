<h1 align="center">Stereo (v5)</h1>
<p align="center">
  <img alt="Version" src="https://img.shields.io/badge/version-5.0.0-blue.svg" />
  <a href="/" target="_blank">
    <img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-yellow.svg" />
  </a>
  <a href="https://translate.stereo-bot.xyz/project/stereo" target="_blank">
    <img alt="Localized: Crowdin" src="https://badges.crowdin.net/stereo/localized.svg" />
  </a>
    <a href="https://stereo-bot.xyz/discord" target="_blank">
    <img alt="Discord" src="https://img.shields.io/badge/-Discord-5865F2?logo=discord&logoColor=fff" />
  </a>
</p>

> Stereo is the only music bot you will ever need, the best audio quality, filters and more completely free! Big thanks to [this GitHub repo](https://github.com/FrenchDiscord/YliasDiscordBot) for making a slash commands handler for @sapphire/framework

## Important information

We expect you to have a basic understanding of JavaScript / TypeScript hosting of things like websites and Discord bots when using one of our repositories. Do **not** ask general questions like "How to install NodeJS?" or "How to update .env" in both our Discord server and the issue tracker.

Please don't open issues or ask for support with the reason "... doesn't work". If something does not work, **explain** as detailed as possible what went wrong, how to reproduce it and what versions you used (NodeJS version, etc)

Hosting your own version is allowed, however, there is **1 rule**. MIT License doesn't mean oh, I can just steal the bot and say it's mine. No, you leave credits where they are and you clearly state that the bot is created by **us**. That's easy you might think. Well not for the users who think, that credits are bullshit and don't want it. It's the only thing I want you guys to do, nothing more.

## Install

**Make sure you have the latest version of NodeJS installed (v16).**
_Note: the install guide uses yarn to explain what to do, don't forget that you don't need yarn to install packages, you can also use npm or pnpm_

To install all the dependencies, run the following command in your terminal: `yarn install`

After installing the dependencies, run: `yarn run build`. This will create a `dist` folder containing all the compiled TypeScript files.

The last step is to run `yarn start` this will start the bot. (don't forget to update the .env, there is a .env.example to show you all the required values)

Want to add your own features or need to change something (a value or something), use the `yarn run dev` command to start the dev server. It will restart the bot everytime you update something. (It doesn't use ts-node because @sapphire/framework doesn't yet support it)

A more detailed-ish coming soon

## Author

👤 **DaanGamesDG**

- Website: https://daangamesdg.wtf/
- Email: <daan@daangamesdg.wtf>
- Twitter: [@DaanGamesDG](https://twitter.com/DaanGamesDG)
- Github: [@DaanGamesDG](https://github.com/DaanGamesDG)

## Donate

This will always be open source project, even if I don't receive donations. But there are still people out there that want to donate, so if you do here is the link [@PayPal](https://paypal.me/daangamesdg). Thanks in advance! I really appriciate it <3

## Lisence

Project is licensed under the © [**MIT License**](/LICENSE)

---
