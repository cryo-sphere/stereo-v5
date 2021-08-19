import { ListenerOptions } from "@sapphire/framework";
import { LavalinkListener } from "../../../client/structures/lavalinkListener";
import { ApplyOptions } from "@sapphire/decorators";
import { Player } from "@stereo-bot/lavalink";

@ApplyOptions<ListenerOptions>({ event: "playerMove" })
export default class playerMoveListener extends LavalinkListener {
	public async run({
		newChannel,
		player,
	}: {
		player: Player;
		newChannel: string;
		oldChannel: string;
	}): Promise<void> {
		if (!newChannel) {
			const channel = await this.client.utils.getChannel(player.channels.text ?? "");
			if (channel && channel.isText())
				await channel
					.send(
						this.client.languageHandler.translate(player.guild, "MusicGeneral:vc.forcedDisconnect")
					)
					.catch();

			player.destroy();
		}
	}
}
