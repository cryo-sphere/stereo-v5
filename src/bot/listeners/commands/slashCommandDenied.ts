import { SlashCommandDeniedPayload } from "../../../client/structures/slashCommands";
import type { ListenerOptions } from "@sapphire/framework";
import { Listener, UserError } from "@sapphire/framework";
import { ApplyOptions } from "@sapphire/decorators";

@ApplyOptions<ListenerOptions>({ once: false, event: "slashCommandDenied" })
export class slashCommandDeniedListener extends Listener {
	public async run({ context, identifier }: UserError, { interaction }: SlashCommandDeniedPayload) {
		if (Reflect.get(Object(context), "silent")) return;

		return interaction.reply({
			content: this.container.client.languageHandler.translate(interaction.guildId, identifier),
			allowedMentions: { repliedUser: true },
		});
	}
}
