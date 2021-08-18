import { Listener, ListenerOptions } from "@sapphire/framework";
import { ApplyOptions } from "@sapphire/decorators";

@ApplyOptions<ListenerOptions>({ once: true, event: "ready" })
export default class ReadyListener extends Listener {
	public async run(): Promise<void> {
		const { client } = this.container;
		client.loggers.get("bot")?.info(`${client.user?.tag} has logged in!`);

		client.manager.init(client.user?.id);
		client.languageHandler.loadAll();
		client.Api.start();
		this.loadConfig();
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
