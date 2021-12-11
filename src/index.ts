import { config } from "dotenv";
config();

import { Client } from "./client";

const client = new Client({
	intents: ["GUILDS", "GUILD_MESSAGES"],
	partials: ["MESSAGE"],
	owners: (process.env.OWNERS ?? "").split(","),
	activity: [
		{
			type: "LISTENING",
			name: "DaanGamesDG"
		}
	]
});

void client.start();
