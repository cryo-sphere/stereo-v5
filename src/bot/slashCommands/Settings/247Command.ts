import { SlashCommand } from "../../../client/structures/slashCommands";
import { ApplyOptions } from "@sapphire/decorators";
import { CommandInteraction, VoiceChannel } from "discord.js";

@ApplyOptions<SlashCommand.Options>({
	name: "247",
	preconditions: ["GuildOnly", "PartnerOnly"],
	description: "Toggles 24/7 mode, only for partners",
	tDescription: "music:247.description",
	userPermissions: ["MANAGE_GUILD"],
	cooldownDelay: 1e4,
})
export default class AfkCommand extends SlashCommand {
	public async run(interaction: CommandInteraction) {
		if (!interaction.inGuild()) return;
		await interaction.deferReply();

		const player = this.client.manager.get(interaction.guildId);
		if (!player)
			return interaction.followUp(
				this.languageHandler.translate(interaction.guildId, "MusicGeneral:noPlayer")
			);

		const state = interaction.guild?.voiceStates.cache.get(interaction.user.id);
		if (player.channels.voice && state?.channelId !== player.channels.voice) {
			const channel = (await this.client.utils.getChannel(player.channels.voice)) as VoiceChannel;
			return interaction.followUp(
				this.languageHandler.translate(interaction.guildId, "MusicGeneral:vc.wrong", {
					voice: channel.name,
				})
			);
		}

		const config = this.client.config.get(interaction.guildId);
		if (!config) return;

		config.afk = !config.afk;
		await this.client.prisma.guild.update({ where: { id: interaction.guildId }, data: config });
		this.client.config.set(interaction.guildId, config);

		if (!config?.afk && !player.playing) {
			const timeout = setTimeout(() => player.destroy(), 12e4);
			this.client.timeouts.set(player.guild, timeout);
		}

		await interaction.followUp(
			this.languageHandler.translate(
				interaction.guildId,
				`music:247.${config.afk ? "enabled" : "disabled"}`
			)
		);
	}
}
