import { AliasStore } from "@sapphire/pieces";
import { SlashCommand } from "./SlashCommand";

export class SlashCommandStore extends AliasStore<SlashCommand> {
	public constructor() {
		super(SlashCommand as never, { name: "slashCommands" });
	}
}
