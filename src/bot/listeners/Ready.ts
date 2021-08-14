import { SlashCommandRegistrar } from "../../client/structures/slashCommands";
import { Listener, ListenerOptions } from "@sapphire/framework";
import { ApplyOptions } from "@sapphire/decorators";
import Client from "../../client/Client";

@ApplyOptions<ListenerOptions>({ once: true, event: "ready" })
export default class ReadyListener extends Listener {
	public async run(): Promise<void> {
		const { client } = this.container;
		client.loggers.get("bot")?.info(`${client.user?.tag} has logged in!`);
		client.manager.init(client.user?.id);

		const registrar = new SlashCommandRegistrar();
		registrar.initializeData(client as Client);

		await registrar.testGuildRegister();
		await registrar.supportGuildRegister();
		if (process.env.NODE_ENV === "production") await registrar.globalRegister();

		client.loggers.get("bot")?.info("Slash commands successfully refreshed!");
	}
}
