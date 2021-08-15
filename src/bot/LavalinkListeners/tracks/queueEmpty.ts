import { ListenerOptions } from "@sapphire/framework";
import { LavalinkListener } from "../../../client/structures/lavalinkListener";
import { ApplyOptions } from "@sapphire/decorators";
import { Player } from "@stereo-bot/lavalink";

@ApplyOptions<ListenerOptions>({ event: "queueEmpty" })
export default class queueEmptyListener extends LavalinkListener {
	public async run(player: Player): Promise<void> {
		const { client } = this.container;
		const channel = await client.utils.getChannel(player.channels.text ?? "");
		if (!channel || !channel.isText()) return;

		const old = client.announcements.get(player.guild);
		if (old && client.config.get(player.guild)?.deleteAnnounce) await channel.messages.delete(old);

		const msg = await channel
			.send(client.languageHandler.translate(player.guild, "MusicGeneral:queueEmpty"))
			.catch();

		if (msg) client.announcements.set(player.guild, msg.id);

		const timeout = setTimeout(() => player.destroy(), 12e4);
		client.timeouts.set(player.guild, timeout);
	}
}
