import { Command } from "../../../client/";
import { ApplyOptions } from "@sapphire/decorators";
import { Message, User } from "discord.js";
import { emojis } from "../../../client/constants";

@ApplyOptions<Command.Options>({
	name: "botblacklist",
	aliases: ["botblacklist"],
	description: "Botblacklists a user/guild",
	usage: "<user>",
	preconditions: ["OwnerOnly"]
})
export default class extends Command {
	public async messageRun(message: Message, args: Command.Args) {
		const { value: id } = await args.pickResult("string");
		if (!id) return message.reply(`>>> ${emojis.redcross} | No user/guild id provided.`);
		if (!this.client.blacklistManager.blacklisted.includes(id))
			return message.reply(`>>> ${emojis.redcross} | User/guild is already whitelisted.`);

		const data = (await this.client.utils.fetchUser(id)) || (await this.client.guilds.fetch(id));
		if (!data) return message.reply(`>>> ${emojis.redcross} | No user/guild found.`);

		await this.client.blacklistManager.whitelist(data.id);
		return message.reply(
			`>>> ${emojis.redcross} | Successfully whitelisted **${data instanceof User ? `${data.tag} (user)` : `${data.name} (guild)`}**!`
		);
	}
}
