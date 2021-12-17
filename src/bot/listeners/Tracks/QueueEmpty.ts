import { Listener } from "../../../client";
import { ApplyOptions } from "@sapphire/decorators";
import type { Player } from "@stereo-bot/lavalink";

@ApplyOptions<Listener.Options>((ctx) => ({ event: "queueEmpty", emitter: ctx.store.container.client.manager }))
export default class extends Listener {
	public async run(player: Player) {
		const channel = await this.client.utils.getChannel(player.channels.text ?? "");
		if (!channel || !channel.isText() || !player.connected) return;

		const old = this.client.announcements.get(player.guild);
		const config = this.client.config.get(player.guild);
		if (old && config?.deleteAnnounce) await channel.messages.delete(old);

		const str = this.translate.translate(player.guild, "MusicGeneral:queueEmpty");
		const msg = await channel.send(config?.afk ? `${str.split(".")[0]}.` : str).catch(() => void 0);

		if (msg) this.client.announcements.set(player.guild, msg.id);
		this.client.skips.set(player.guild, []);

		if (!config?.afk) {
			const timeout = setTimeout(() => {
				player.destroy();
				msg?.edit(this.translate.translate(player.guild, "MusicGeneral:inactive")).catch(() => void 0);
			}, 12e4);
			this.client.timeouts.set(player.guild, timeout);
		}
	}
}
