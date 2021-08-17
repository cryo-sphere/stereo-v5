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
		const config = client.config.get(player.guild);
		if (old && config?.deleteAnnounce) await channel.messages.delete(old);

		const str = client.languageHandler.translate(player.guild, "MusicGeneral:queueEmpty");
		const msg = await channel.send(config?.afk ? str.split(".")[0] + "." : str).catch();

		if (msg) client.announcements.set(player.guild, msg.id);

		if (!config?.afk) {
			const timeout = setTimeout(() => {
				player.destroy();
				msg.edit(client.languageHandler.translate(player.guild, "MusicGeneral:inactive")).catch();
			}, 12e4);
			client.timeouts.set(player.guild, timeout);
		}
	}
}
