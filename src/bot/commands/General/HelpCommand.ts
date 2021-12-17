import { Command } from "../../../client/";
import { ApplyOptions } from "@sapphire/decorators";
import { CommandInteraction, EmbedFieldData, MessageActionRow, MessageButton } from "discord.js";
import ms from "ms";
import { emojis } from "../../../client/constants";

@ApplyOptions<Command.Options>({
	name: "help",
	aliases: ["commands"],
	description: "A quick overview of all the commands Stereo has",
	tDescription: "general:help.description",
	requiredClientPermissions: ["EMBED_LINKS"],
	usage: "[command]",
	chatInputCommand: {
		messageCommand: true,
		register: true,
		options: [
			{
				type: "STRING",
				description: "The command name",
				tDescription: "general:help.args.command",
				name: "command",
				required: false
			}
		]
	}
})
export default class extends Command {
	public async chatInputRun(interaction: CommandInteraction, context: Command.SlashCommandContext) {
		const embed = this.client.utils
			.embed()
			.setTitle(
				this.translate.translate(interaction.guildId, "general:help.embed.title", {
					user: interaction.user.tag
				})
			)
			.setFooter(this.translate.translate(interaction.guildId, "general:help.embed.footer"), "https://cdn.stereo-bot.tk/branding/logo.png");

		const cmd = interaction.options.getString("command", false);
		const command = this.container.stores.get("commands").get(cmd ?? "") as Command | undefined;

		if (command) {
			embed
				.setDescription(
					this.translate.translate(interaction.guildId, "general:help.embed.description", {
						name: command.name,
						category: command.category,
						description: command.tDescription ? this.translate.translate(interaction.guildId, command.tDescription) : "-",
						usage: command.usage ? `/${command.usage}` : "-",
						perms: Array.isArray(command.options.requiredClientPermissions)
							? command.options.requiredClientPermissions.map((str) => `\`{${str}}\``).join(", ")
							: "-",
						djrole: emojis[true ? "greentick" : "redcross"],
						cooldown: ms(command.cooldown),
						limit: command.cooldownLimit
					})
				)
				.addFields(
					command.OwnerOnly || !command.options.chatInputCommand?.options
						? []
						: command.options.chatInputCommand.options
								.filter((c) => !["SUB_COMMAND", "SUB_COMMAND_GROUP"].includes(c.type.toString()))
								.map((arg) => ({
									name: `• ${this.translate.translate(interaction.guildId, "BotGeneral:argument")} "${
										arg.name
									}" (${this.translate.translate(interaction.guildId, "BotGeneral:required")})`,
									value: this.translate.translate(interaction.guildId, arg.tDescription ?? "")
								}))
				);
		} else {
			const isOwner = this.container.client.isOwner(interaction.user.id);
			const commands = [...this.container.stores.get("commands").values()] as Command[];
			let categories = [...new Set(commands.map((c) => c.category))];

			if (!isOwner) categories = categories.filter((c) => c?.toLowerCase() !== "developers");

			const fields: EmbedFieldData[] = categories.map((category) => {
				const valid = commands.filter((c) => c.category === category);
				const filtered = isOwner ? valid : valid.filter((c) => !c.OwnerOnly);

				return {
					name: `• ${category}`,
					value: filtered.map((c) => `\`${c.name ?? c.aliases[0] ?? "unkown"}\``).join(" ")
				};
			});

			embed.setFields(fields);
		}

		await interaction.reply({
			embeds: [embed],
			components: [
				new MessageActionRow().addComponents(
					new MessageButton()
						.setLabel("Invite")
						.setStyle("LINK")
						.setURL(
							`https://discord.com/oauth2/authorize?client_id=${this.client.user?.id}&scope=bot%20applications.commands&permissions=3411200`
						),
					new MessageButton().setLabel("Support Server").setStyle("LINK").setURL("https://discord.gg/46v9tr3Wxp"),
					new MessageButton().setLabel("Dashboard").setStyle("LINK").setURL("https://stereo-bot.tk/dashboard"),
					new MessageButton().setLabel("Status").setStyle("LINK").setURL("https://status.stereo-bot.tk/")
				)
			]
		});
	}
}
