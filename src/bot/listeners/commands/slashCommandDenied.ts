import { Listener, SlashCommandDeniedPayload } from "../../../client";
import { ApplyOptions } from "@sapphire/decorators";

@ApplyOptions<Listener.Options>({ once: false, event: "slashCommandDenied" })
export default class extends Listener {
	public async run({ context, message }: { context: Record<string, any>; message: string }, { interaction }: SlashCommandDeniedPayload) {
		if (Reflect.get(Object(context), "silent")) return;

		const reply = interaction.replied ? "followUp" : "reply";
		return interaction[reply]({
			content: message ?? "Command rejected, please try again later.",
			allowedMentions: { repliedUser: true }
		});
	}
}
