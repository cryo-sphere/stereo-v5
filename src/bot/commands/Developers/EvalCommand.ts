import { Command } from "../../../client/";
import { ApplyOptions } from "@sapphire/decorators";
import { codeBlock } from "@sapphire/utilities";
import type { CommandInteraction, Message } from "discord.js";
import { Type } from "@sapphire/type";
import { inspect } from "util";

@ApplyOptions<Command.Options>({
	name: "eval",
	aliases: ["ev", "e"],
	description: "Evals any JavaScript code 💻",
	flags: ["async", "hidden", "showHidden", "silent", "s"],
	options: ["depth"],
	preconditions: ["OwnerOnly"],
	usage: "<code>",
	chatInputCommand: {
		register: true,
		messageCommand: true,
		options: [
			{
				name: "code",
				description: "Code to execute",
				type: "STRING",
				required: true
			},
			{
				name: "async",
				description: "If async should be enabled",
				type: "BOOLEAN",
				required: false
			},
			{
				name: "depth",
				description: "The inspect depth",
				type: "INTEGER",
				required: false
			},
			{
				name: "hidden",
				description: "Show hidden items",
				type: "BOOLEAN",
				required: false
			},
			{
				name: "silent",
				description: "If the response should be silent",
				type: "BOOLEAN",
				required: false
			}
		]
	}
})
export default class extends Command {
	public async messageRun(message: Message, args: Command.Args) {
		const code = await args.rest("string");

		const { result, success, type } = await this.eval(message, code, {
			async: args.getFlags("async"),
			depth: Number(args.getOption("depth")) ?? 0,
			showHidden: args.getFlags("hidden", "showHidden")
		});

		const output = success ? codeBlock("js", result) : `**Error**: ${codeBlock("bash", result)}`;
		if (args.getFlags("silent", "s")) return;

		const typeFooter = `**Type**: ${codeBlock("typescript", type)}`;

		if (output.length > 2000)
			return message.reply({
				files: [{ attachment: Buffer.from(output), name: "output.txt" }],
				content: `Output was too long... sent the result as a file.\n\n${typeFooter}`
			});

		return message.reply(`${output}\n${typeFooter}`);
	}

	public async chatInputRun(interaction: CommandInteraction) {
		const code = interaction.options.getString("code", true);
		await interaction.deferReply({ ephemeral: interaction.options.getBoolean("silent") ?? false });

		const { result, success, type } = await this.eval(interaction, code, {
			async: interaction.options.getBoolean("async") ?? false,
			depth: Number(interaction.options.getInteger("depth")) ?? 0,
			showHidden: interaction.options.getBoolean("hidden") ?? false
		});

		const output = success ? codeBlock("js", result) : `**Error**: ${codeBlock("bash", result)}`;
		if (interaction.options.getBoolean("silent")) return interaction.followUp({ content: "Executed!", ephemeral: true });

		const typeFooter = `**Type**: ${codeBlock("typescript", type)}`;

		if (output.length > 2000)
			return interaction.followUp({
				files: [{ attachment: Buffer.from(output), name: "output.txt" }],
				content: `Output was too long... sent the result as a file.\n\n${typeFooter}`
			});

		return interaction.followUp(`${output}\n${typeFooter}`);
	}

	private async eval(msg: Message | CommandInteraction, code: string, flags: { async: boolean; depth: number; showHidden: boolean }) {
		if (flags.async) code = `(async () => {\n${code}\n})();`;

		// @ts-ignore otherwise "message is not defined"
		const message = msg;
		// @ts-ignore otherwise "interaction is not defined"
		const interaction = msg;

		let success = true;
		let result = null;

		try {
			// eslint-disable-next-line no-eval
			result = await eval(code);
		} catch (error) {
			result = error;
			success = false;
		}

		const type = new Type(result).toString();

		if (typeof result !== "string")
			result = inspect(result, {
				depth: flags.depth,
				showHidden: flags.showHidden
			});

		return { result, success, type };
	}
}
