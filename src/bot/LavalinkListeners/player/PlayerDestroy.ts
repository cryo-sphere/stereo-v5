import { ListenerOptions } from "@sapphire/framework";
import { LavalinkListener } from "../../../client/structures/lavalinkListener";
import { ApplyOptions } from "@sapphire/decorators";
import { Player } from "@stereo-bot/lavalink";

@ApplyOptions<ListenerOptions>({ event: "playerDestroy" })
export default class playerDestroyListener extends LavalinkListener {
	public async run(player: Player): Promise<void> {
		const { client } = this.container;

		client.announcements.delete(player.guild);
		const timeout = client.timeouts.get(player.guild);
		if (timeout) {
			clearTimeout(timeout);
			client.timeouts.delete(player.guild);
		}
	}
}
