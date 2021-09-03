import { ListenerOptions } from "@sapphire/framework";
import { LavalinkListener } from "../../../client/structures/lavalinkListener";
import { ApplyOptions } from "@sapphire/decorators";
import { Player } from "@stereo-bot/lavalink";

@ApplyOptions<ListenerOptions>({ event: "trackEnd" })
export default class trackEndListener extends LavalinkListener {
	public async run({ player }: { player: Player }): Promise<void> {
		const guild = this.client.guilds.cache.get(player.guild);
		if (!guild) return;

		const members = guild.me?.voice.channel?.members.filter((m) => !m.user.bot).size;
		if (members && members < 1) {
			const channel = await this.client.utils.getChannel(player.channels.text ?? "");
			if (!channel || !channel.isText()) return;

			player.destroy();
			await channel
				.send(this.client.languageHandler.translate(guild.id, "MusicGeneral:vc.alone"))
				.catch(() => void 0);
		}
	}
}
