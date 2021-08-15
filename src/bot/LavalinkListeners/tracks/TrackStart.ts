import { ListenerOptions } from "@sapphire/framework";
import { LavalinkListener } from "../../../client/structures/lavalinkListener";
import { ApplyOptions } from "@sapphire/decorators";
import { LoadedTrack, Player, Utils } from "@stereo-bot/lavalink";

@ApplyOptions<ListenerOptions>({ event: "trackStart" })
export default class trackStartListener extends LavalinkListener {
	public async run({ player, track }: { player: Player; track: LoadedTrack }): Promise<void> {
		const { client } = this.container;
		const channel = await client.utils.getChannel(player.channels.text ?? "");
		if (!channel || !channel.isText()) return;

		const old = client.announcements.get(channel.id);
		if (old && client.config.get(player.guild)?.deleteAnnounce) await channel.messages.delete(old);

		const msg = await channel
			.send({
				embeds: [
					client.utils
						.embed()
						.setTitle("new song")
						.setDescription(`${track.title} - ${Utils.convert(track.duration)}`),
				],
			})
			.catch();

		if (msg) client.announcements.set(channel.id, msg.id);
	}
}
