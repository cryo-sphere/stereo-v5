import { Listener } from "../../../client";
import { ApplyOptions } from "@sapphire/decorators";
import type { Player } from "@stereo-bot/lavalink";

@ApplyOptions<Listener.Options>((ctx) => ({ event: "playerDestroy", emitter: ctx.store.container.client.manager }))
export default class extends Listener {
	public async run({ newChannel, player }: { player: Player; newChannel: string; oldChannel: string }): Promise<void> {
		if (!newChannel) {
			const channel = await this.client.utils.getChannel(player.channels.text ?? "");
			if (channel && channel.isText())
				await channel.send(this.client.translationManager.translate(player.guild, "MusicGeneral:vc.forcedDisconnect")).catch(() => void 0);

			player.destroy();
		}
	}
}
