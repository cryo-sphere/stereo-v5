import { SlashCommand } from "../../../client/structures/slashCommands";
import { ApplyOptions } from "@sapphire/decorators";
import { CommandInteraction, StageChannel, VoiceChannel } from "discord.js";

@ApplyOptions<SlashCommand.Options>({
	name: "fix",
	preconditions: ["GuildOnly"],
	description: "Fixes the Discord voice connection",
	tDescription: "music:reset.description",
	userPermissions: ["MANAGE_GUILD"],
	cooldownDelay: 3e4,
	cooldownLimit: 2,
})
export default class ClearCommand extends SlashCommand {
	public async run(interaction: CommandInteraction) {
		if (!interaction.inGuild()) return;
		await interaction.deferReply();

		const player = this.client.manager.get(interaction.guildId);
		if (!player)
			return interaction.followUp(
				this.languageHandler.translate(interaction.guildId, "MusicGeneral:noPlayer")
			);

		const channel = (await this.client.utils.getChannel(
			player.channels.voice ?? ""
		)) as VoiceChannel;

		const region = channel.rtcRegion;
		const available = await this.client.fetchVoiceRegions();

		player.pause(true);
		await channel.edit({
			rtcRegion: available.filter((r) => !r.vip && !r.deprecated)?.random()?.id,
		});
		await new Promise((res) => setTimeout(res, 2e3));
		// @ts-ignore
		const newData = await this.client.api.channels(channel.id).patch({
			data: {
				name: channel.name,
				type: channel instanceof StageChannel ? 13 : 2,
				rtc_region: region,
			},
		});

		// @ts-ignore
		this.client.actions?.ChannelUpdate.handle(newData);
		player.pause(false);

		await interaction.followUp(
			this.languageHandler.translate(interaction.guildId, "music:fix.success")
		);
	}
}
