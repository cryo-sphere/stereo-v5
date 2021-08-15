import { SlashCommandDeniedPayload } from "../../../client/structures/slashCommands";
import type { ListenerOptions } from "@sapphire/framework";
import { Listener } from "@sapphire/framework";
import { ApplyOptions } from "@sapphire/decorators";

@ApplyOptions<ListenerOptions>({ once: false, event: "slashCommandDenied" })
export class slashCommandDeniedListener extends Listener {
	public async run(
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		{ context, identifier }: { context: Record<string, any>; identifier: string },
		{ interaction }: SlashCommandDeniedPayload
	) {
		if (Reflect.get(Object(context), "silent")) return;

		return interaction.reply({
			content: this.container.client.languageHandler.translate(
				interaction.guildId,
				identifier,
				context
			),
			allowedMentions: { repliedUser: true },
		});
	}
}
