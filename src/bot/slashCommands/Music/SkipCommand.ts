import { SlashCommand } from "../../../client/structures/slashCommands";
import { ApplyOptions } from "@sapphire/decorators";
import { CommandInteraction, GuildMemberRoleManager, VoiceChannel } from "discord.js";

@ApplyOptions<SlashCommand.Options>({
	name: "skip",
	preconditions: ["GuildOnly"],
	description: "Skips the current song",
	tDescription: "music:skip.description",
	cooldownDelay: 5e3,
	cooldownLimit: 1,
})
export default class SkipCommand extends SlashCommand {
	public async run(interaction: CommandInteraction) {
		if (!interaction.inGuild()) return;

		const player = this.client.manager.get(interaction.guildId);
		if (!player)
			return interaction.reply(
				this.languageHandler.translate(interaction.guildId, "MusicGeneral:noPlayer")
			);

		if (!player.queue.current)
			return interaction.reply(
				this.languageHandler.translate(interaction.guildId, "MusicGeneral:noTrack")
			);

		const state = interaction.guild?.voiceStates.cache.get(interaction.user.id);
		if (state?.channelId !== player.channels.voice) {
			await interaction.deferReply();
			const channel = (await this.client.utils.getChannel(
				player.channels.voice as string
			)) as VoiceChannel;

			return interaction.followUp(
				this.languageHandler.translate(interaction.guildId, "MusicGeneral:vc.wrong", {
					voice: channel.name,
				})
			);
		}

		const config = this.client.config.get(interaction.guildId);
		if (!config) return;

		const voice = interaction.guild?.me?.voice;
		const required = voice?.channel?.members.filter((m) => !m.user.bot).size ?? 0;

		const skips = this.client.skips.get(player.guild);
		const current = skips?.length ?? 0;

		let bool = false;
		if (Array.isArray(interaction.member.roles))
			bool = interaction.member.roles.includes(config?.djrole ?? "");
		else if (interaction.member.roles instanceof GuildMemberRoleManager)
			bool = interaction.member.roles.cache.has(config?.djrole ?? "");

		if (skips?.includes(interaction.user.id))
			return interaction.reply(
				this.languageHandler.translate(interaction.guildId, "music:skip.fail", {
					current,
					required,
				})
			);

		if (bool || required - (current + 1) <= 0 || required - 1 <= 0) {
			player.skip();
			return interaction.reply(
				this.languageHandler.translate(interaction.guildId, "MusicGeneral:skip")
			);
		}

		this.client.skips.set(interaction.guildId, [...(skips ?? []), interaction.user.id]);
		await interaction.reply(
			this.languageHandler.translate(interaction.guildId, "music:skip.success", {
				current: current + 1,
				required,
			})
		);
	}
}
