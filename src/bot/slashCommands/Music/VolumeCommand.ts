import { SlashCommand } from "../../../client/structures/slashCommands";
import { ApplyOptions } from "@sapphire/decorators";
import { CommandInteraction } from "discord.js";

@ApplyOptions<SlashCommand.Options>({
	name: "volume",
	preconditions: ["GuildOnly", "DJRole"],
	description: "Changes the volume of the player",
	tDescription: "music:volume.description",
	arguments: [
		{
			name: "volume",
			description: "The value to set the volume to",
			type: "INTEGER",
			required: true,
		},
	],
})
export default class DisconnectCommand extends SlashCommand {
	public async run(interaction: CommandInteraction, args: SlashCommand.Args) {
		if (!interaction.inGuild()) return;

		const player = this.client.manager.get(interaction.guildId);
		if (!player)
			return interaction.reply(
				this.languageHandler.translate(interaction.guildId, "MusicGeneral:noPlayer")
			);

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
