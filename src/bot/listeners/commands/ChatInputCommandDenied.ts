import type { ChatInputCommandDeniedPayload, UserError } from "@sapphire/framework";
import { ApplyOptions } from "@sapphire/decorators";
import { Listener } from "../../../client";

@ApplyOptions<Listener.Options>({ event: "chatInputCommandDenied" })
export default class extends Listener {
	public run({ context, identifier }: UserError, { interaction }: ChatInputCommandDeniedPayload) {
		if (Reflect.get(Object(context), "silent")) return;

		const reply = interaction.replied ? interaction.followUp.bind(interaction) : interaction.reply.bind(interaction);
		const vars = (typeof context === "object" ? context : {}) as Record<string, unknown>;

		return reply({
			content: this.translate.translate(interaction.guildId, identifier, vars),
			allowedMentions: { repliedUser: true }
		});
	}
}
