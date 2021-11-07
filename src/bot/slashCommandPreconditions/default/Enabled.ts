import type { PieceContext } from "@sapphire/pieces";
import type { CommandInteraction } from "discord.js";
import { Identifiers, SlashCommand, SlashCommandPrecondition } from "../../../client";

export class CorePrecondition extends SlashCommandPrecondition {
	public constructor(context: PieceContext) {
		super(context, { position: 10 });
	}

	public run(_: CommandInteraction, command: SlashCommand): SlashCommandPrecondition.Result {
		return command.enabled
			? this.ok()
			: this.error({
					identifier: Identifiers.CommandDisabled,
					message: "This command is disabled."
			  });
	}
}
