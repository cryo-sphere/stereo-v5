import type { CommandDeniedPayload, UserError } from "@sapphire/framework";
import { ApplyOptions } from "@sapphire/decorators";
import { Listener } from "../../../client";

@ApplyOptions<Listener.Options>({ once: false, event: "commandDenied" })
export default class extends Listener {
	public async run({ context, message: content }: UserError, { message }: CommandDeniedPayload) {
		if (Reflect.get(Object(context), "silent")) return;

		return message.reply({
			content,
			allowedMentions: { repliedUser: true }
		});
	}
}
