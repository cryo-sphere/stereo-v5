import { SlashCommandPrecondition } from "../../client/structures/slashCommands";
import { CommandInteraction } from "discord.js";

export class PartnerOnlyPrecondition extends SlashCommandPrecondition {
	public run(interaction: CommandInteraction): SlashCommandPrecondition.Result {
		if (!interaction.inGuild()) return this.ok();

		const config = this.container.client.config.get(interaction.guildId);
		return config?.partner
			? this.ok()
			: this.error({
					identifier: "BotGeneral:partner",
			  });
	}
}
