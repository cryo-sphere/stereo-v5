import { config } from "dotenv";
config();

import Client from "./client/Client";
new Client({
	owners: process.env.OWNERS?.split(" ") ?? [],
	intents: ["GUILDS", "GUILD_VOICE_STATES"],
	debug: !!process.env.DEBUG,
	activity: [
		{
			type: "PLAYING",
			name: "/help - stereo-bot.tk",
		},
	],
}).start();
