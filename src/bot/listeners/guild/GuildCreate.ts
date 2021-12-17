import { ApplyOptions } from "@sapphire/decorators";
import { Guild, MessageEmbed, WebhookClient } from "discord.js";
import { Listener } from "../../../client";

@ApplyOptions<Listener.Options>({ event: "guildCreate" })
export default class GuildCreateListener extends Listener {
	public async run(guild: Guild): Promise<void> {
		this.container.logger.debug(`${this.client.user?.tag} joined ${guild.name} (${guild.id})`);

		const config =
			(await this.client.prisma.guild.findFirst({ where: { id: guild.id }, include: { permissions: true } })) ||
			(await this.client.prisma.guild.create({ data: { id: guild.id }, include: { permissions: true } }));
		this.client.config.set(guild.id, config);

		const webhook = new WebhookClient({ url: process.env.JOIN_LOGS ?? "" });
		await webhook
			.send({
				embeds: [
					new MessageEmbed()
						.setColor("#42F590")
						.setTitle(guild.name)
						.setDescription(`Bot: ${this.client.user?.tag}\nStatus: **Joined**\n**${guild.memberCount}** members`)
						.setThumbnail(guild?.iconURL?.({ dynamic: true, size: 4096 }) ?? "https://cdn.stereo-bot.tk/files/not-found.png")
						.setFooter(`We are now in ${this.client.guilds.cache.size} guilds`)
				]
			})
			.catch(() => void 0);
	}
}
