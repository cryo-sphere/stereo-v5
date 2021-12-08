import { Command } from "../../../client";
import { ApplyOptions } from "@sapphire/decorators";
import { CommandInteraction, Message, User } from "discord.js";
import { emojis } from "../../../client/constants";

@ApplyOptions<Command.Options>({
	name: "botblacklist",
	description: "Botblacklists a user/guild",
	usage: "<id>",
	preconditions: ["OwnerOnly"],
	chatInputCommand: {
		register: true,
		messageCommand: true,
		options: [
			{
				name: "id",
				description: "The id of the guild or user you want to blacklist",
				type: "STRING",
				required: true
			}
		]
	}
})
export default class extends Command {
	public async messageRun(message: Message, args: Command.Args): Promise<void> {
		const { value: id } = await args.pickResult("string");
		if (!id) {
			await message.reply(`>>> ${emojis.redcross} | No user/guild id provided.`);
			return;
		}

		const msg = await this.RunCommand(id);
		await message.reply(msg);
	}

	public async chatInputRun(interaction: CommandInteraction): Promise<void> {
		const id = interaction.options.getString("id", true);

		await interaction.deferReply();
		const message = await this.RunCommand(id);
		await interaction.followUp(message);
	}

	private async RunCommand(id: string): Promise<string> {
		if (this.client.blacklistManager.blacklisted.includes(id)) return `>>> ${emojis.redcross} | User/guild is already blacklisted.`;

		const data = (await this.client.utils.fetchUser(id)) || (await this.client.guilds.fetch(id));
		if (!data) return `>>> ${emojis.redcross} | No user/guild found.`;

		await this.client.blacklistManager.blacklist(data.id);
		return `>>> ${emojis.redcross} | Successfully blacklisted **${data instanceof User ? `${data.tag} (user)` : `${data.name} (guild)`}**!`;
	}
}
