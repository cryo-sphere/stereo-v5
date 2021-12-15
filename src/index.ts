import { config } from "dotenv";
config();

import { Client } from "./client";

const client = new Client({
	intents: ["GUILDS", "GUILD_VOICE_STATES"],
	owners: (process.env.OWNERS ?? "").split(","),
	activity: [
		{
			type: "PLAYING",
			name: "/help - stereo-bot.tk"
		}
	]
});

void client.start();
