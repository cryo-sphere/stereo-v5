import { AliasStore } from "@sapphire/pieces";
import { SlashCommand } from "./SlashCommand";

export class SlashCommandStore extends AliasStore<SlashCommand> {
	constructor() {
		super(SlashCommand as never, { name: "slashCommands" });
	}
}
