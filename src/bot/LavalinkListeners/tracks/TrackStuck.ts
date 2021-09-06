import { ListenerOptions } from "@sapphire/framework";
import { LavalinkListener } from "../../../client/structures/lavalinkListener";
import { ApplyOptions } from "@sapphire/decorators";
import { Player } from "@stereo-bot/lavalink";

@ApplyOptions<ListenerOptions>({ event: "trackStuck" })
export default class trackStuckListener extends LavalinkListener {
	public async run({ player }: { player: Player }): Promise<void> {
		const guild = this.client.guilds.cache.get(player.guild);
		if (!guild) return;

		player.queue.nextSong();
		const channel = await this.client.utils.getChannel(player.channels.text ?? "");
		if (!channel || !channel.isText()) return;

		await channel
			.send(this.client.languageHandler.translate(guild.id, "MusicGeneral:stuck"))
			.catch(() => void 0);
	}
}
