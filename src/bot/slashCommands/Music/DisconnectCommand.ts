import { SlashCommand } from "../../../client/structures/slashCommands";
import { ApplyOptions } from "@sapphire/decorators";
import { CommandInteraction, VoiceChannel } from "discord.js";

@ApplyOptions<SlashCommand.Options>({
	name: "disconnect",
	preconditions: ["GuildOnly", "DJRole"],
	description: "Disconnects from the voice channel",
	tDescription: "music:disconnect.description",
	cooldownDelay: 1e4,
})
export default class DisconnectCommand extends SlashCommand {
	public async run(interaction: CommandInteraction) {
		if (!interaction.inGuild()) return;

		const player = this.client.manager.get(interaction.guildId);
		if (!player)
			return interaction.reply(
				this.languageHandler.translate(interaction.guildId, "MusicGeneral:noPlayer")
			);

		const state = interaction.guild?.voiceStates.cache.get(interaction.user.id);
		if (player.channels.voice && state?.channelId !== player.channels.voice) {
			await interaction.deferReply();
			const channel = (await this.client.utils.getChannel(player.channels.voice)) as VoiceChannel;

			return interaction.followUp(
				this.languageHandler.translate(interaction.guildId, "MusicGeneral:vc.wrong", {
					voice: channel.name,
				})
			);
		}

		const channel = (await this.client.utils.getChannel(
			player.channels.voice ?? ""
		)) as VoiceChannel;

		player.destroy();
		await interaction.reply(
			this.languageHandler.translate(interaction.guildId, "MusicGeneral:vc.disconnected", {
				channel: channel.name ?? "deleted-channel",
			})
		);
	}
}
