import { ListenerOptions } from "@sapphire/framework";
import { LavalinkListener } from "../../../client/structures/lavalinkListener";
import { ApplyOptions } from "@sapphire/decorators";
import { Player } from "@stereo-bot/lavalink";

@ApplyOptions<ListenerOptions>({ event: "trackStuck" })
export default class trackStuckListener extends LavalinkListener {
	public async run({ player }: { player: Player }): Promise<void> {
		const guild = this.client.guilds.cache.get(player.guild);
		if (!guild) return;

		setTimeout(() => player.skip(), 1e3);
		const channel = await this.client.utils.getChannel(player.channels.text ?? "");
		if (!channel || !channel.isText()) return;

		await channel
			.send(this.client.languageHandler.translate(guild.id, "MusicGeneral:stuck"))
			.catch(() => void 0);
	}
}
