import { Listener, ListenerOptions } from "@sapphire/framework";
import { ApplyOptions } from "@sapphire/decorators";
import { Guild, MessageEmbed, WebhookClient } from "discord.js";

@ApplyOptions<ListenerOptions>({ event: "guildCreate" })
export default class GuildCreateListener extends Listener {
	public async run(guild: Guild): Promise<void> {
		const { client } = this.container;
		const logger = client.loggers.get("bot");

		logger?.debug(`${client.user?.tag} joined ${guild.name} (${guild.id})`);

		const config =
			(await client.prisma.guild.findFirst({ where: { id: guild.id } })) ||
			(await client.prisma.guild.create({ data: { id: guild.id } }));
		client.config.set(guild.id, config);

		const webhook = new WebhookClient({ url: process.env.JOIN_LOGS ?? "" });
		await webhook
			.send({
				embeds: [
					new MessageEmbed()
						.setColor("#42F590")
						.setTitle(guild.name)
						.setDescription(
							`Bot: ${client.user?.tag}\nStatus: **Joined**\n**${guild.memberCount}** members`
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
