import { SlashCommand } from "../../../client/structures/slashCommands";
import { ApplyOptions } from "@sapphire/decorators";
import { CommandInteraction, VoiceChannel } from "discord.js";

@ApplyOptions<SlashCommand.Options>({
	name: "join",
	preconditions: ["GuildOnly"],
	description: "Get Stereo to join your channel",
	tDescription: "music:join.description",
	cooldownDelay: 1e4,
})
export default class PingCommand extends SlashCommand {
	public async run(interaction: CommandInteraction) {
		if (!interaction.inGuild()) return;
		await interaction.deferReply();

		const state = interaction.guild?.voiceStates.cache.get(interaction.user.id);
		const player =
			this.client.manager.get(interaction.guildId) ||
			this.client.manager.create({ guild: interaction.guildId });

		if (!state || !state.channelId)
			return interaction.followUp(
				this.languageHandler.translate(interaction.guildId, "MusicGeneral:vc.none")
			);

		if (player.channels.voice) {
			const channel = (await this.client.utils.getChannel(player.channels.voice)) as VoiceChannel;
			return interaction.followUp(
				this.languageHandler.translate(interaction.guildId, "MusicGeneral:vc.alreadyCreated", {
					voice: channel.name,
				})
			);
		}

		player.setVoice(state.channelId).setText(interaction.channelId).connect();
		await interaction.followUp(
			this.languageHandler.translate(interaction.guildId, "MusicGeneral:vc.connected", {
				channel: state.channel?.name ?? "unknown channel",
			})
		);
	}
}
