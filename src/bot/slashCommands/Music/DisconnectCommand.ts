import { SlashCommand } from "../../../client/structures/slashCommands";
import { ApplyOptions } from "@sapphire/decorators";
import { CommandInteraction, VoiceChannel } from "discord.js";

@ApplyOptions<SlashCommand.Options>({
	name: "disconnect",
	preconditions: ["GuildOnly", "DJRole"],
	description: "Disconnects from the voice channel",
	tDescription: "music:disconnect.description",
})
export default class DisconnectCommand extends SlashCommand {
	public async run(interaction: CommandInteraction) {
		if (!interaction.inGuild()) return;

		const player = this.client.manager.get(interaction.guildId);
		if (!player)
			return interaction.reply(
				this.languageHandler.translate(interaction.guildId, "MusicGeneral:noPlayer")
			);

		player.destroy();

		const channel = (await this.client.utils.getChannel(
			player.channels.text ?? ""
		)) as VoiceChannel;
		await interaction.reply(
			this.languageHandler.translate(interaction.guildId, "MusicGeneral:disconnected", {
				channel: channel.name ?? "deleted-channel",
			})
		);
	}
}
