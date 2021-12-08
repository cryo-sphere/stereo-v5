import type { ContextMenuCommandDeniedPayload, UserError } from "@sapphire/framework";
import { ApplyOptions } from "@sapphire/decorators";
import { Listener } from "../../../client";

@ApplyOptions<Listener.Options>({ event: "contextMenuCommandDenied" })
export default class extends Listener {
	public run({ context, message: content }: UserError, { interaction }: ContextMenuCommandDeniedPayload) {
		if (Reflect.get(Object(context), "silent")) return;
		const reply = interaction.replied ? interaction.followUp.bind(interaction) : interaction.reply.bind(interaction);

		return reply({
			content,
			allowedMentions: { repliedUser: true }
		});
	}
}
