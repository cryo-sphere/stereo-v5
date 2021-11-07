import { SlashCommand } from "../../../client";
import { ApplyOptions } from "@sapphire/decorators";
import type { CommandInteraction, EmbedFieldData } from "discord.js";
import ms from "ms";

@ApplyOptions<SlashCommand.Options>({
	name: "help",
	description: "A list of all the commands",
	requiredClientPermissions: ["EMBED_LINKS"],
	arguments: [
		{
			type: "STRING",
			description: "The command name",
			name: "command",
			required: false
		}
	]
})
export default class extends SlashCommand {
	public async run(interaction: CommandInteraction, args: SlashCommand.Args, context: SlashCommand.Context): Promise<void> {
		const embed = this.client.utils
			.embed()
			.setTitle(`Help Command - ${interaction.user.tag}`)
			.setFooter("Bot created by DaanGamesDG#7621", "https://static.daangamesdg.xyz/discord/pfp.gif");

		const cmd = args.getString("command", false);
		const command = this.container.stores.get("slashCommands").get(cmd ?? "") as SlashCommand | undefined;

		if (command) {
			const userPermissions = this.client.utils.formatPerms(command.userPermissions);
			const clientPermissions = this.client.utils.formatPerms(command.clientPermissions);

			embed.setDescription(
				[
					`>>> 🏷 | **Name**: ${command.name}`,
					`📁 | **Category**: ${command.category}`,
					`🔖 | **Aliases**: \`${command.aliases.join("`, `") || "-"}\`\n`,
					`📋 | **Usage**: ${command.usage ? `${context.commandPrefix}${command.usage}` : "-"}`,
					`📘 | **Description**: ${command.description ?? "-"}\n`,
					`👮‍♂️ | **User Permissions**: ${userPermissions ?? "-"}`,
					`🤖 | **Client Permissions**: ${clientPermissions ?? "-"}`,
					`⌚ | **Cooldown**: \`${ms(command.cooldown, { long: false })}\``,
					`🔢 | **Cooldown Limit**: \`${command.limit}\``
				].join("\n")
			);
		} else {
			const isOwner = this.client.isOwner(interaction.user.id);
			const commands = [...this.container.stores.get("slashCommands").values()] as SlashCommand[];
			let categories = [...new Set(commands.map((c) => c.category))];

			if (!isOwner) categories = categories.filter((c) => c.toLowerCase() !== "developers");

			const fields: EmbedFieldData[] = categories.map((category) => {
				const valid = commands.filter((c) => c.category === category);
				const filtered = isOwner ? valid : valid.filter((c) => !c.ownerOnly);

				return {
					name: `• ${category}`,
					value: filtered.map((c) => `\`${c.name ?? c.aliases[0] ?? "unkown"}\``).join(" ")
				};
			});

			embed.setFields(fields);
		}

		await interaction.reply({
			embeds: [embed]
		});
	}
}
