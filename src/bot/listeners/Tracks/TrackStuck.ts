import { Listener } from "../../../client";
import { ApplyOptions } from "@sapphire/decorators";
import type { Player } from "@stereo-bot/lavalink";

@ApplyOptions<Listener.Options>((ctx) => ({ event: "trackStuck", emitter: ctx.store.container.client.manager }))
export default class extends Listener {
	public async run({ player }: { player: Player }): Promise<void> {
		const guild = this.client.guilds.cache.get(player.guild);
		if (!guild) return;

		const channel = await this.client.utils.getChannel(player.channels.text ?? "");
		if (!channel || !channel.isText()) return;

		await channel.send(this.translate.translate(guild.id, "MusicGeneral:stuck")).catch(() => void 0);
	}
}
