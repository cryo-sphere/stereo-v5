import { ListenerOptions } from "@sapphire/framework";
import { LavalinkListener } from "../../../client/structures/lavalinkListener";
import { ApplyOptions } from "@sapphire/decorators";
import { Filter, Player } from "@stereo-bot/lavalink";

@ApplyOptions<ListenerOptions>({ event: "playerCreate" })
export default class playerCreateListener extends LavalinkListener {
	public async run(player: Player): Promise<void> {
		const { client } = this.container;

		const config = client.config.get(player.guild);
		if (!config?.afk) {
			const timeout = setTimeout(() => player.destroy(), 12e4);
			client.timeouts.set(player.guild, timeout);
		}

		if (config?.autorepeat) player.queue.setRepeatQueue(true);
		if (config?.defaultbassboost !== "none")
			player.filters.apply(config?.defaultbassboost as Filter);
		if (config?.defaultfilter !== "none") player.filters.apply(config?.defaultfilter as Filter);

		player.setVolume(config?.defaultvolume ?? 100);
	}
}
