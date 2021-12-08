import { Command } from "../../../client/";
import { ApplyOptions } from "@sapphire/decorators";
import type { CommandInteraction, EmbedFieldData, Message, MessageEmbed, User } from "discord.js";
import ms from "ms";

@ApplyOptions<Command.Options>({
	name: "help",
	aliases: ["commands"],
	description: "A list of all the commands",
	requiredClientPermissions: ["EMBED_LINKS"],
	usage: "[command]",
	chatInputCommand: {
		messageCommand: true,
		register: true,
		options: [
			{
				name: "command",
				type: "STRING",
				description: "The name of the command",
				required: false
			}
		]
	}
})
export default class extends Command {
	public async messageRun(message: Message, args: Command.Args, context: Command.MessageContext): Promise<void> {
		const cmd = await args.pickResult("string");
		const command = this.container.stores.get("commands").get(cmd.value ?? "") as Command | undefined;
		const embed = this.RunCommand(context, message.author, command);

		await message.reply({ embeds: [embed] });
	}

	public async chatInputRun(interaction: CommandInteraction, context: Command.SlashCommandContext) {
		const cmd = interaction.options.getString("command", false);
		const command = this.container.stores.get("commands").get(cmd ?? "") as Command | undefined;
		const embed = this.RunCommand(context, interaction.user, command);

		await interaction.reply({
			embeds: [embed]
		});
	}

	private RunCommand(context: Command.MessageContext | Command.SlashCommandContext, user: User, command?: Command): MessageEmbed {
		const embed = this.client.utils
			.embed()
			.setTitle(`Help Command - ${user.tag}`)
			.setFooter("Bot created by DaanGamesDG#7621", "https://static.daangamesdg.xyz/discord/pfp.gif");

		if (command) {
			const userPermissions = this.client.utils.formatPerms(command.permissions);
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
					`🔢 | **Cooldown Limit**: \`${command.cooldownLimit}\``
				].join("\n")
			);
		} else {
			const isOwner = this.client.isOwner(user.id);
			const commands = [...this.container.stores.get("commands").values()] as Command[];
			let categories = [...new Set(commands.map((c) => c.category ?? "default"))];

			if (!isOwner) categories = categories.filter((c) => c.toLowerCase() !== "developers");

			const fields: EmbedFieldData[] = categories.map((category) => {
				const valid = commands.filter((c) => c.category === category);
				const filtered = isOwner ? valid : valid.filter((c) => !c.hidden || !c.OwnerOnly);

				return {
					name: `• ${category}`,
					value: filtered.map((c) => `\`${c.name ?? c.aliases[0] ?? "unkown"}\``).join(" ")
				};
			});

			embed.setFields(fields);
		}

		return embed;
	}
}
