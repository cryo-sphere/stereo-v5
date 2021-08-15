import { SlashCommand, SlashCommandPrecondition } from "../../client/structures/slashCommands";
import { GuildMemberRoleManager, Interaction, Permissions } from "discord.js";

export class DJRolePrecondition extends SlashCommandPrecondition {
	public run(interaction: Interaction, command: SlashCommand): SlashCommandPrecondition.Result {
		if (!interaction.inGuild() || command.category.toLowerCase() !== "music") return this.ok();

		const { client } = this.container;
		const config = client.config.get(interaction.guildId);
		const player = client.manager.get(interaction.guildId);
		if (!config?.djrole || !player) return this.ok();

		const voice = interaction.guild?.voiceStates.cache.get(client.user?.id ?? "");
		if (voice && (voice?.channel?.members.filter((m) => !m.user.bot).size ?? 1) < 2)
			return this.ok();

		if (
			interaction.member.permissions instanceof Permissions &&
			interaction.member.permissions.has("ADMINISTRATOR", true)
		)
			return this.ok();
		if (
			typeof interaction.member.permissions === "string" &&
			new Permissions(BigInt(interaction.member.permissions)).has("ADMINISTRATOR", true)
		)
			return this.ok();

		let bool = false;
		if (Array.isArray(interaction.member.roles))
			bool = interaction.member.roles.includes(config.djrole);
		else if (interaction.member.roles instanceof GuildMemberRoleManager)
			bool = interaction.member.roles.cache.has(config.djrole);

		return bool ? this.ok() : this.error({ identifier: "MusicGeneral:djrole" });
	}
}
