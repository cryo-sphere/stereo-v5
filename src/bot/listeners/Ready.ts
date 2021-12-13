import { Listener } from "../../client";
import { ApplyOptions } from "@sapphire/decorators";

@ApplyOptions<Listener.Options>({ event: "ready", once: true })
export default class extends Listener {
	public run() {
		this.container.logger.info(`${this.client.user!.tag} has logged in!`);

		this.client.manager.init(this.client.user!.id);
		this.client.translationManager.loadAll();
		void this.loadConfig();
	}

	private async loadConfig() {
		const { client } = this.container;

		const configs = await client.prisma.guild.findMany();
		client.guilds.cache.forEach(async (g) => {
			const config = configs.find((c) => c.id === g.id) || (await client.prisma.guild.create({ data: { id: g.id } }));
			client.config.set(g.id, config);
		});
	}
}
