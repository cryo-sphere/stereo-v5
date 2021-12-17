import { Listener } from "../../../client";
import { ApplyOptions } from "@sapphire/decorators";
import type { Player } from "@stereo-bot/lavalink";

@ApplyOptions<Listener.Options>((ctx) => ({ event: "trackEnd", emitter: ctx.store.container.client.manager }))
export default class extends Listener {
	public async run({ player }: { player: Player }): Promise<void> {
		const guild = this.client.guilds.cache.get(player.guild);
		if (!guild) return;

		const config = this.client.config.get(guild.id);
		const members = guild.me?.voice.channel?.members.filter((m) => !m.user.bot).size;
		if (typeof members === "number" && members < 1 && !config?.afk) {
			player.queue.reset();
			player.destroy();

			const channel = await this.client.utils.getChannel(player.channels.text ?? "");
			if (!channel || !channel.isText()) return;

			await channel.send(this.translate.translate(guild.id, "MusicGeneral:vc.alone")).catch(() => void 0);
		}
	}
}
