import { Listener } from "../../../client";
import { ApplyOptions } from "@sapphire/decorators";
import type { Player, TrackExceptionEvent } from "@stereo-bot/lavalink";

@ApplyOptions<Listener.Options>((ctx) => ({ event: "trackError", emitter: ctx.store.container.client.manager }))
export default class extends Listener {
	public async run({ player, payload }: { player: Player; payload: TrackExceptionEvent }): Promise<void> {
		const guild = this.client.guilds.cache.get(player.guild);
		if (!guild) return;

		this.container.logger.error(`[Lavalink]: TrackError (${player.guild}): ${payload.error}`);
		const channel = await this.client.utils.getChannel(player.channels.text ?? "");
		if (!channel || !channel.isText()) return;

		await channel
			.send(
				this.translate.translate(guild.id, "MusicGeneral:error", {
					error: payload.error
				})
			)
			.catch(() => void 0);
	}
}
