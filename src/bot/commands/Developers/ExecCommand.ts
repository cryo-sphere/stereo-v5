import { Command } from "../../../client/";
import { ApplyOptions } from "@sapphire/decorators";
import { exec, ExecException } from "child_process";
import { codeBlock } from "@sapphire/utilities";
import type { CommandInteraction, Message } from "discord.js";

@ApplyOptions<Command.Options>({
	name: "exec",
	aliases: ["execute", "terminal"],
	description: "Execute any command using exec",
	preconditions: ["OwnerOnly"],
	usage: "<...command>",
	chatInputCommand: {
		register: true,
		messageCommand: true,
		options: [
			{
				name: "command",
				description: "Command to execute",
				type: "STRING",
				required: true
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
		const command = await args.rest("string");
		const { result, success } = await this.exec(command);

		const output = success ? codeBlock("js", result) : `**Error**: ${codeBlock("bash", result)}`;

		if (output.length > 2000)
			return message.reply({
				files: [{ attachment: Buffer.from(output), name: "output.txt" }],
				content: "Output was too long... sent the result as a file."
			});

		return message.reply(`${output}`);
	}

	public async chatInputRun(interaction: CommandInteraction) {
		const command = interaction.options.getString("command", true);
		const silent = interaction.options.getBoolean("silent") ?? false;
		await interaction.deferReply({ ephemeral: silent });

		const { result, success } = await this.exec(command);
		const output = success ? codeBlock("bash", result) : `**Error**: ${codeBlock("bash", result)}`;
		if (silent) return interaction.followUp({ content: "Executed!", ephemeral: true });

		if (output.length > 2000)
			return interaction.followUp({
				files: [{ attachment: Buffer.from(output), name: "output.txt" }],
				content: "Output was too long... sent the result as a file."
			});

		return interaction.followUp(`${output}`);
	}

	private async exec(command: string) {
		let success = true;
		let result: string;

		const res = await new Promise<{ error: ExecException | null; stdout: string }>((resolve) =>
			exec(command, (err, stdout) => resolve({ error: err, stdout }))
		);

		if (res.error) {
			success = false;
			result = res.error.message;
		} else {
			result = res.stdout;
		}

		return { result, success };
	}
}
