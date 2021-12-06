import type { MessageCommandDeniedPayload, ChatInputCommandDeniedPayload, UserError, ContextMenuCommandDeniedPayload } from "@sapphire/framework";
import { ApplyOptions } from "@sapphire/decorators";
import { Listener } from "../../../client";

type DeniedPayload = MessageCommandDeniedPayload | ChatInputCommandDeniedPayload | ContextMenuCommandDeniedPayload;

@ApplyOptions<Listener.Options>({ once: false, event: "commandDenied" })
export default class extends Listener {
	public run({ context, message: content }: UserError, payload: DeniedPayload) {
		if (Reflect.get(Object(context), "silent")) return;

		const ctx = "message" in payload ? payload.message : payload.interaction;
		return ctx.reply({
			content,
			allowedMentions: { repliedUser: true }
		});
	}
}
