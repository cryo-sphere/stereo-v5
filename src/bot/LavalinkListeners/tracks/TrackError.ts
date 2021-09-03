import { ListenerOptions } from "@sapphire/framework";
import { LavalinkListener } from "../../../client/structures/lavalinkListener";
import { ApplyOptions } from "@sapphire/decorators";
import { Player, TrackExceptionEvent } from "@stereo-bot/lavalink";

@ApplyOptions<ListenerOptions>({ event: "trackError" })
export default class trackErrorListener extends LavalinkListener {
	public async run({
		player,
		payload,
	}: {
		player: Player;
		payload: TrackExceptionEvent;
	}): Promise<void> {
		const guild = this.client.guilds.cache.get(player.guild);
		if (!guild) return;

		player.skip();
		this.client.loggers
			.get("lavalink")
			?.error(`TrackError (${player.guild}): ${payload.error}`, payload.exception);
		const channel = await this.client.utils.getChannel(player.channels.text ?? "");
		if (!channel || !channel.isText()) return;

		await channel
			.send(
				this.client.languageHandler.translate(guild.id, "MusicGeneral:error", {
					error: payload.error,
				})
			)
			.catch(() => void 0);
	}
}
