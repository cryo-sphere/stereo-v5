import { SlashCommand } from "../../../client/structures/slashCommands";
import { ApplyOptions } from "@sapphire/decorators";
import { CommandInteraction, EmbedFieldData, MessageActionRow, MessageButton } from "discord.js";
import ms from "ms";

@ApplyOptions<SlashCommand.Options>({
	name: "help",
	description: "A quick overview of all the commands Stereo has",
	tDescription: "general:help.description",
	arguments: [
		{
			type: "STRING",
			description: "the command name",
			name: "command",
			required: false,
		},
	],
})
export default class InviteCommand extends SlashCommand {
	public async run(interaction: CommandInteraction, args: SlashCommand.Args): Promise<void> {
		const embed = this.client.utils.embed().setTitle(
			this.languageHandler.translate(interaction.guildId, "general:help.embed.title", {
				user: interaction.user.tag,
			})
		);

		const cmd = args.getString("command", false);
		const command = this.container.stores.get("slashCommands").get(cmd ?? "") as
			| SlashCommand
			| undefined;

		if (command) {
			embed.setDescription(
				this.languageHandler.translate(interaction.guildId, "general:help.embed.description", {
					name: command.name,
					category: command.category,
					description: this.languageHandler.translate(interaction.guildId, command.tDescription),
					usage: command.usage ? `/${command.usage}` : "-",
					perms: command.userPermissions
						? command.userPermissions.map((str) => `\`{${str}}\``).join(", ")
						: "-",
					djrole: this.client.constants.emojis[command.DJRole ? "greentick" : "redcross"],
					cooldown: ms(command.cooldown),
					limit: command.limit,
				})
			);
		} else {
			const isOwner = this.container.client.isOwner(interaction.user.id);
			const commands = [...this.container.stores.get("slashCommands").values()] as SlashCommand[];
			let categories = [...new Set(commands.map((c) => c.category))];

			if (!isOwner) categories = categories.filter((c) => c.toLowerCase() !== "developers");

			const fields: EmbedFieldData[] = categories.map((category) => {
				const valid = commands.filter((c) => c.category === category);
				const filtered = isOwner ? valid : valid.filter((c) => !c.ownerOnly);

				return {
					name: `• ${category}`,
					value: filtered.map((c) => `\`${c.name ?? c.aliases[0] ?? "unkown"}\``).join(" "),
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
					new MessageButton()
						.setLabel("Support Server")
						.setStyle("LINK")
						.setURL("https://discord.gg/46v9tr3Wxp"),
					new MessageButton()
						.setLabel("Dashboard")
						.setStyle("LINK")
						.setURL("https://stereo-bot.tk/dashboard"),
					new MessageButton()
						.setLabel("Status")
						.setStyle("LINK")
						.setURL("https://status.stereo-bot.tk/")
				),
			],
		});
	}
}
