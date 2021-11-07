import { SlashCommand } from "../../../client/";
import { ApplyOptions } from "@sapphire/decorators";
import { CommandInteraction, User } from "discord.js";
import { emojis } from "../../../client/constants";

@ApplyOptions<SlashCommand.Options>({
	name: "botwhitelist",
	description: "Botwhitelists a user/guild",
	usage: "<id>",
	preconditions: ["OwnerOnly"],
	arguments: [
		{
			name: "id",
			description: "The userId or guildId you want to add to the whitelist",
			type: "STRING",
			required: true
		}
	]
})
export default class extends SlashCommand {
	public async run(interaction: CommandInteraction, args: SlashCommand.Args) {
		const id = args.getString("id", true);
		if (!this.client.blacklistManager.blacklisted.includes(id))
			return interaction.reply(`>>> ${emojis.redcross} | User/guild is already whitelisted.`);

		await interaction.deferReply();
		const data = (await this.client.utils.fetchUser(id)) || (await this.client.guilds.fetch(id));
		if (!data) return interaction.followUp(`>>> ${emojis.redcross} | No user/guild found.`);

		await this.client.blacklistManager.whitelist(data.id);
		return interaction.followUp(
			`>>> ${emojis.redcross} | Successfully whitelisted **${data instanceof User ? `${data.tag} (user)` : `${data.name} (guild)`}**!`
		);
	}
}
