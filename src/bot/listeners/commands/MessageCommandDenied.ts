import type { MessageCommandDeniedPayload, UserError } from "@sapphire/framework";
import { ApplyOptions } from "@sapphire/decorators";
import { Listener } from "../../../client";

@ApplyOptions<Listener.Options>({ event: "messageCommandDenied" })
export default class extends Listener {
	public run({ context, message: content }: UserError, payload: MessageCommandDeniedPayload) {
		if (Reflect.get(Object(context), "silent")) return;

		return payload.message.reply({
			content,
			allowedMentions: { repliedUser: true }
		});
	}
}
