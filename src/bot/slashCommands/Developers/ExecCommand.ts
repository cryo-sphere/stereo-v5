import { SlashCommand } from "../../../client/structures/slashCommands";
import { ApplyOptions } from "@sapphire/decorators";
import { CommandInteraction } from "discord.js";
import { codeBlock } from "@sapphire/utilities";
import { exec, ExecException } from "child_process";

@ApplyOptions<SlashCommand.Options>({
	name: "exec",
	description: "Execute any shell command(s) (devs only)",
	preconditions: ["OwnerOnly"],
	arguments: [
		{
			name: "command",
			description: "command + args to execute",
			type: "STRING",
			required: true,
		},
		{
			name: "silent",
			description: "If the response should be silent",
			type: "BOOLEAN",
			required: false,
		},
	],
})
export default class PingCommand extends SlashCommand {
	public async run(interaction: CommandInteraction, args: SlashCommand.Args) {
		const command = args.getString("command", true);
		const silent = args.getBoolean("silent") ?? false;
		await interaction.deferReply({ ephemeral: silent });

		const { result, success } = await this.exec(command);
		const output = success ? codeBlock("bash", result) : `**Error**: ${codeBlock("bash", result)}`;
		if (silent) return interaction.followUp({ content: "Executed!", ephemeral: true });

		if (output.length > 2000)
			return interaction.followUp({
				files: [{ attachment: Buffer.from(output), name: "output.txt" }],
				content: "Output was too long... sent the result as a file.",
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
