import type { CommandInteraction, ApplicationCommandOptionType } from "discord.js";
import { SlashCommand } from "../../../client/structures/slashCommands";
import {
	SlashCommandPrecondition,
	SlashCommandPreconditionContext,
	SlashCommandPreconditionResult,
} from "../../../client/structures/slashCommands";

export const SlashCommandArgumentFormats = {
	URL: /^https?:\/\/.+/gu.test,
};

interface SlashCommandArgumentFormatData {
	name: string;
	validate: (value: string) => boolean;
	errorMessage?: string;
}

interface SlashCommandArgumentFormatContext extends SlashCommandPreconditionContext {
	formats: SlashCommandArgumentFormatData[];
}

declare module "../../../client/structures/slashCommands" {
	interface SlashCommandPreconditions {
		ArgumentFormat: SlashCommandArgumentFormatContext;
	}
}

export class CorePrecondition extends SlashCommandPrecondition {
	public run(
		interaction: CommandInteraction,
		command: SlashCommand,
		context: SlashCommandArgumentFormatContext
	): SlashCommandPreconditionResult {
		// If the command it is testing for is not this one, return ok:
		if (context.external) return this.ok();

		const acceptedTypes: ApplicationCommandOptionType[] = ["STRING", "NUMBER", "INTEGER"];

		for (const formatData of context.formats) {
			const hasArgument = interaction.options.get(formatData.name);
			const isCorrectType =
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				hasArgument && acceptedTypes.includes(interaction.options.get(formatData.name)!.type);

			if (!isCorrectType) continue;

			if (!formatData.validate(interaction.options.get(formatData.name)?.value as string))
				return this.error({
					identifier: "slashCommandPreconditionArgumentFormat",
					message:
						formatData.errorMessage ??
						`The value you entered for the option "${formatData.name}" is invalid.`,
					context: formatData,
				});
		}

		return this.ok();
	}
}
