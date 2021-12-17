import { ApplyOptions } from "@sapphire/decorators";
import { CommandInteraction, StageChannel, VoiceChannel } from "discord.js";
import { Command } from "../../../client";

@ApplyOptions<Command.Options>({
	name: "fix",
	preconditions: ["GuildOnly"],
	description: "Fixes the Discord voice connection",
	tDescription: "music:reset.description",
	cooldownDelay: 3e4,
	cooldownLimit: 2,
	musicPermissions: ["PLAYER_CONTROLS"],
	chatInputCommand: {
		register: true,
		messageCommand: true
	}
})
export default class extends Command {
	public async chatInputRun(interaction: CommandInteraction) {
		if (!interaction.inGuild()) return;
		await interaction.deferReply();

		const player = this.client.manager.get(interaction.guildId);
		if (!player) {
			await interaction.reply(this.translate.translate(interaction.guildId, "MusicGeneral:noPlayer"));
			return;
		}

		const state = interaction.guild?.voiceStates.cache.get(interaction.user.id);
		if (player.channels.voice && state?.channelId !== player.channels.voice) {
			await interaction.deferReply();
			const channel = (await this.client.utils.getChannel(player.channels.voice)) as VoiceChannel;
			await interaction.followUp(
				this.translate.translate(interaction.guildId, "MusicGeneral:vc.wrong", {
					voice: channel.name
				})
			);

			return;
		}

		const channel = (await this.client.utils.getChannel(player.channels.voice ?? "")) as VoiceChannel;

		const region = channel.rtcRegion;
		const available = await this.client.fetchVoiceRegions();

		player.pause(true);
		await channel.edit({
			rtcRegion: available.filter((r) => !r.vip && !r.deprecated)?.random()?.id
		});
		await new Promise((res) => setTimeout(res, 2e3));
		// @ts-ignore Discord.js doesn't want to update the voice region when it is on auto
		const newData = await this.client.api.channels(channel.id).patch({
			data: {
				name: channel.name,
				type: channel instanceof StageChannel ? 13 : 2,
				rtc_region: region
			}
		});

		// @ts-ignore refer to the line above
		this.client.actions?.ChannelUpdate.handle(newData);
		player.pause(false);

		await interaction.followUp(this.translate.translate(interaction.guildId, "music:fix.success"));
	}
}
