import { SlashCommand, SlashCommandPrecondition } from "../../client/structures/slashCommands";
import { CommandInteraction, Permissions } from "discord.js";

export class PermissionsPrecondition extends SlashCommandPrecondition {
	public run(
		interaction: CommandInteraction,
		command: SlashCommand
	): SlashCommandPrecondition.Result {
		if (this.container.client.owners.includes(interaction.user.id) || !interaction.inGuild())
			return this.ok();

		const permissions =
			typeof interaction.member.permissions === "string"
				? new Permissions(BigInt(interaction.member.permissions))
				: interaction.member.permissions;
		const missing = permissions.missing(command.userPermissions);
		if (!missing.length) return this.ok();

		return this.error({
			identifier: "BotGeneral:permissions",
			context: { permissions: `\`${missing.map((str) => `\`{${str}}\``).join(", ")}\`` },
		});
	}
}
