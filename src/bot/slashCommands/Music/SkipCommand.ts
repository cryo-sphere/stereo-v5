import { SlashCommand } from "../../../client/structures/slashCommands";
import { ApplyOptions } from "@sapphire/decorators";
import { CommandInteraction, GuildMemberRoleManager } from "discord.js";

@ApplyOptions<SlashCommand.Options>({
	name: "skip",
	preconditions: ["GuildOnly"],
	description: "Skips the current song",
	tDescription: "music:skip.description",
})
export default class SkipCommand extends SlashCommand {
	public async run(interaction: CommandInteraction) {
		if (!interaction.inGuild()) return;

		const player = this.client.manager.get(interaction.guildId);
		if (!player)
			return interaction.followUp(
				this.languageHandler.translate(interaction.guildId, "MusicGeneral:noPlayer")
			);

		const config = this.client.config.get(interaction.guildId);
		if (!config) return;

		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const voice = interaction.guild!.me?.voice;
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
		interaction.reply(
			this.languageHandler.translate(interaction.guildId, "music:skip.success", {
				current: current + 1,
				required,
			})
		);
	}
}
