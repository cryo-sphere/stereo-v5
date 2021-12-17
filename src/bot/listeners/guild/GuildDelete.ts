import { ApplyOptions } from "@sapphire/decorators";
import { Guild, MessageEmbed, WebhookClient } from "discord.js";
import { Listener } from "../../../client";

@ApplyOptions<Listener.Options>({ event: "guildDelete" })
export default class GuildCreateListener extends Listener {
	public async run(guild: Guild): Promise<void> {
		this.container.logger.debug(`${this.client.user?.tag} left ${guild.name} (${guild.id})`);

		await this.client.prisma.guild.delete({ where: { id: guild.id } });
		this.client.config.delete(guild.id);

		const webhook = new WebhookClient({ url: process.env.JOIN_LOGS ?? "" });
		await webhook
			.send({
				embeds: [
					new MessageEmbed()
						.setColor("#F55E53")
						.setTitle(guild.name)
						.setDescription(`Bot: ${this.client.user?.tag}\nStatus: **Left**\n**${guild.memberCount}** members`)
						.setThumbnail(guild?.iconURL?.({ dynamic: true, size: 4096 }) ?? "https://cdn.stereo-bot.tk/files/not-found.png")
						.setFooter(`We are now in ${this.client.guilds.cache.size} guilds`)
				]
			})
			.catch(() => void 0);
	}
}
