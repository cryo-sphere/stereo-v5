import { SlashCommand } from "../../../client/structures/slashCommands";
import { ApplyOptions } from "@sapphire/decorators";
import { CommandInteraction, VoiceChannel } from "discord.js";

@ApplyOptions<SlashCommand.Options>({
	name: "volume",
	preconditions: ["GuildOnly", "DJRole"],
	description: "Changes the volume of the player",
	tDescription: "music:volume.description",
	cooldownDelay: 5e3,
	arguments: [
		{
			name: "volume",
			description: "The value to set the volume to",
			tDescription: "music:volume.args.volume",
			type: "INTEGER",
			required: true,
		},
	],
})
export default class VolumeCommand extends SlashCommand {
	public async run(interaction: CommandInteraction, args: SlashCommand.Args) {
		if (!interaction.inGuild()) return;

		const player = this.client.manager.get(interaction.guildId);
		if (!player)
			return interaction.reply(
				this.languageHandler.translate(interaction.guildId, "MusicGeneral:noPlayer")
			);

		const state = interaction.guild?.voiceStates.cache.get(interaction.user.id);
		if (player.channels.voice && state?.channelId !== player.channels.voice) {
			const channel = (await this.client.utils.getChannel(player.channels.voice)) as VoiceChannel;
			await interaction.deferReply();

			return interaction.followUp(
				this.languageHandler.translate(interaction.guildId, "MusicGeneral:vc.wrong", {
					voice: channel.name,
				})
			);
		}

		const volume = args.getInteger("volume", true);
		if (volume > 200 || volume < 1)
			return interaction.reply(
				this.languageHandler.translate(interaction.guildId, "music:volume.invalid")
			);

		player.setVolume(volume);
		await interaction.reply(
			this.languageHandler.translate(interaction.guildId, "music:volume.success", { volume })
		);
	}
}
