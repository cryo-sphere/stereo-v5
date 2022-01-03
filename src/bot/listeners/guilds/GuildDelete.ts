import { Listener, ListenerOptions } from "@sapphire/framework";
import { ApplyOptions } from "@sapphire/decorators";
import { Guild, MessageEmbed, WebhookClient } from "discord.js";

@ApplyOptions<ListenerOptions>({ event: "guildDelete" })
export default class GuildDeleteListener extends Listener {
	public async run(guild: Guild): Promise<void> {
		const { client } = this.container;
		const logger = client.loggers.get("bot");

		logger?.debug(`${client.user?.tag} left ${guild.name} (${guild.id})`);

		await client.prisma.guild.delete({ where: { id: guild.id } });
		client.config.delete(guild.id);

		const webhook = new WebhookClient({ url: process.env.JOIN_LOGS ?? "" });
		await webhook
			.send({
				embeds: [
					new MessageEmbed()
						.setColor("#F55E53")
						.setTitle(guild.name)
						.setDescription(
							`Bot: ${client.user?.tag}\nStatus: **Left**\n**${guild.memberCount}** members`
						)
						.setThumbnail(
							guild?.iconURL?.({ dynamic: true, size: 4096 }) ??
								"https://cdn.daangamesdg.tk/discord/wumpus.png"
						)
						.setFooter({ text: `We are now in ${client.guilds.cache.size} guilds` }),
				],
			})
			.catch(() => void 0);
	}
}
