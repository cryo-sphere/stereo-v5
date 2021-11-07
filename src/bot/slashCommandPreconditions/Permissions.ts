import { SlashCommand, SlashCommandPrecondition } from "../../client";
import { CommandInteraction, Permissions } from "discord.js";

export default class extends SlashCommandPrecondition {
	public run(interaction: CommandInteraction, command: SlashCommand): SlashCommandPrecondition.Result {
		if (this.client.owners.includes(interaction.user.id) || !interaction.inGuild()) return this.ok();

		const permissions =
			typeof interaction.member.permissions === "string"
				? new Permissions(BigInt(interaction.member.permissions))
				: interaction.member.permissions;
		const missing = permissions.missing(command.userPermissions, true);
		if (!missing.length) return this.ok();

		return this.error({
			message: `>>> 👮‍♂️ | Oops, you are missing the following permissions: \`${missing.map((str) => `\`{${str}}\``).join(", ")}\``
		});
	}
}
