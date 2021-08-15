import { ListenerOptions } from "@sapphire/framework";
import { LavalinkListener } from "../../../client/structures/lavalinkListener";
import { ApplyOptions } from "@sapphire/decorators";
import { LoadedTrack, Player, Utils } from "@stereo-bot/lavalink";

@ApplyOptions<ListenerOptions>({ event: "trackStart" })
export default class trackStartListener extends LavalinkListener {
	public async run({ player, track }: { player: Player; track: LoadedTrack }): Promise<void> {
		const channel = await this.client.utils.getChannel(player.channels.text ?? "");
		if (!channel || !channel.isText()) return;

		const old = this.client.announcements.get(channel.id);
		if (old && this.client.config.get(player.guild)?.deleteAnnounce)
			await channel.messages.delete(old);

		const config = this.client.config.get(player.guild);
		if (config?.announce) {
			const msg = await channel
				.send({
					embeds: [
						this.client.utils
							.embed()
							.setURL(track.externalUri ?? track.uri)
							.setThumbnail(track.displayThumbnail())
							.setTitle(
								this.client.languageHandler.translate(player.guild, "MusicGeneral:announce.title", {
									title: track.title,
								})
							)
							.setDescription(
								this.client.languageHandler.translate(
									player.guild,
									"MusicGeneral:announce.description",
									{
										user: track.requester,
										duration: Utils.convert(track.duration),
									}
								)
							),
					],
				})
				.catch();

			if (msg) this.client.announcements.set(player.guild, msg.id);
		}

		const timeout = this.client.timeouts.get(player.guild);
		if (timeout) {
			clearTimeout(timeout);
			this.client.timeouts.delete(player.guild);
		}
	}
}
