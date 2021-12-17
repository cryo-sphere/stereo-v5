import { Listener } from "../../../client";
import { ApplyOptions } from "@sapphire/decorators";
import type { Filter, Player } from "@stereo-bot/lavalink";

@ApplyOptions<Listener.Options>((ctx) => ({ event: "playerCreate", emitter: ctx.store.container.client.manager }))
export default class extends Listener {
	public run(player: Player) {
		const config = this.client.config.get(player.guild);
		if (!config?.afk) {
			const timeout = setTimeout(() => player.destroy(), 12e4);
			this.client.timeouts.set(player.guild, timeout);
		}

		const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

		if (config) {
			if (config.autorepeat) player.queue.setRepeatQueue(true);
			if (config.defaultbassboost !== "none") player.filters.apply(`bassboost${capitalize(config.defaultbassboost)}` as Filter);
			if (config.defaultfilter !== "none") player.filters.apply(config.defaultfilter as Filter);
		}

		player.setVolume(config?.defaultvolume ?? 100);
		this.client.skips.set(player.guild, []);
	}
}
