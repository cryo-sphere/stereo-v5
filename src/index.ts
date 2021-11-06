import { config } from "dotenv";
config();

import { Client } from "./client";

void new Client({
	intents: ["GUILDS", "GUILD_MESSAGES"],
	partials: ["MESSAGE"],
	owners: (process.env.OWNERS ?? "").split(","),
	activity: [
		{
			type: "LISTENING",
			name: "DaanGamesDG"
		}
	]
}).start();
