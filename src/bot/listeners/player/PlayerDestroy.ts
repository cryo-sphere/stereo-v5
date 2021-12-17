import { Listener } from "../../../client";
import { ApplyOptions } from "@sapphire/decorators";
import type { Player } from "@stereo-bot/lavalink";

@ApplyOptions<Listener.Options>((ctx) => ({ event: "playerDestroy", emitter: ctx.store.container.client.manager }))
export default class extends Listener {
	public run(player: Player) {
		this.client.announcements.delete(player.guild);
		this.client.skips.delete(player.guild);

		const timeout = this.client.timeouts.get(player.guild);
		if (timeout) {
			clearTimeout(timeout);
			this.client.timeouts.delete(player.guild);
		}
	}
}
