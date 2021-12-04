import { Listener, ListenerOptions } from "@sapphire/framework";
import { ApplyOptions } from "@sapphire/decorators";
import { SlashCommandRegistrar } from "../../client/structures/slashCommands";
import Client from "../../client/Client";

@ApplyOptions<ListenerOptions>({ once: true, event: "ready" })
export default class ReadyListener extends Listener {
	public async run(): Promise<void> {
		const { client } = this.container;
		client.loggers.get("bot")?.info(`${client.user?.tag} has logged in!`);

		client.manager.init(client.user?.id);
		client.languageHandler.loadAll();
		client.Api.start();
		this.loadConfig();

		if (client.user?.id === "769595543151443970") {
			const commands = client.stores.get("slashCommands");
			commands.unload("playlists");
		}

		if (process.env.UPDATE_SLASH) {
			const registrar = new SlashCommandRegistrar(client as Client);
			await registrar.refresh();

			client.loggers.get("bot")?.info("Slash commands successfully refreshed!");
		}
	}

	private async loadConfig() {
		const { client } = this.container;

		const configs = await client.prisma.guild.findMany();
		client.guilds.cache.forEach(async (g) => {
			const config =
				configs.find((c) => c.id === g.id) ||
				(await client.prisma.guild.create({ data: { id: g.id } }));
			client.config.set(g.id, config);
		});
	}
}
