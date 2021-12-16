import { Listener } from "../../client";
import { ApplyOptions } from "@sapphire/decorators";

@ApplyOptions<Listener.Options>({ event: "ready", once: true })
export default class extends Listener {
	public async run() {
		this.client.manager.init(this.client.user!.id);
		this.client.translationManager.loadAll();
		await this.loadConfig();

		this.container.logger.info(`${this.client.user!.tag} has logged in!`);
	}

	private async loadConfig() {
		const configs = await this.client.prisma.guild.findMany({ include: { permissions: true } });
		this.client.guilds.cache.forEach(async (g) => {
			const config =
				configs.find((c) => c.id === g.id) || (await this.client.prisma.guild.create({ data: { id: g.id }, include: { permissions: true } }));
			this.client.config.set(g.id, config);
		});
	}
}
