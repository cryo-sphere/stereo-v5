import type { Guild } from "@prisma/client";
import { ApplyOptions } from "@sapphire/decorators";
import type { CommandInteraction, VoiceChannel } from "discord.js";
import { Command } from "../../../client";

@ApplyOptions<Command.Options>({
	name: "247",
	preconditions: ["GuildOnly", "PartnerOnly"],
	description: "Toggles 24/7 mode, only for partners",
	tDescription: "music:247.description",
	requiredUserPermissions: ["MANAGE_GUILD"],
	cooldownDelay: 1e4,
	chatInputCommand: {
		register: true,
		messageCommand: true
	}
})
export default class extends Command {
	public async chatInputRun(interaction: CommandInteraction) {
		if (!interaction.inGuild()) return;

		const player = this.client.manager.get(interaction.guildId);
		if (!player) {
			await interaction.reply(this.translate.translate(interaction.guildId, "MusicGeneral:noPlayer"));
			return;
		}

		const state = interaction.guild?.voiceStates.cache.get(interaction.user.id);
		if (player.channels.voice && state?.channelId !== player.channels.voice) {
			await interaction.deferReply();
			const channel = (await this.client.utils.getChannel(player.channels.voice)) as VoiceChannel;
			await interaction.followUp(
				this.translate.translate(interaction.guildId, "MusicGeneral:vc.wrong", {
					voice: channel.name
				})
			);

			return;
		}

		const config = this.client.config.get(interaction.guildId);
		if (!config) return;

		config.afk = !config.afk;
		const configWithOutPerms: Guild = config;
		await this.client.prisma.guild.update({ where: { id: interaction.guildId }, data: configWithOutPerms });
		this.client.config.set(interaction.guildId, config);

		if (!config.afk && !player.playing) {
			const timeout = setTimeout(() => player.destroy(), 12e4);
			this.client.timeouts.set(player.guild, timeout);
		} else if (config.afk && player.playing) {
			const timeout = this.client.timeouts.get(player.guild);
			if (timeout) {
				clearTimeout(timeout);
				this.client.timeouts.delete(player.guild);
			}
		}

		await interaction.followUp(this.translate.translate(interaction.guildId, `music:247.${config.afk ? "enabled" : "disabled"}`));
	}
}
