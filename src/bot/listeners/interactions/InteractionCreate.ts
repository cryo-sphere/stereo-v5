import { Interaction, CommandInteraction, Constants } from "discord.js";
import { Listener } from "@sapphire/framework";
import { PieceContext } from "@sapphire/pieces";
import { Events } from "../../../client/structures/slashCommands";

export default class InteractionCreate extends Listener<
	typeof Constants.Events.INTERACTION_CREATE
> {
	constructor(context: PieceContext) {
		super(context, {
			event: Constants.Events.INTERACTION_CREATE,
		});
	}

	public run(interaction: Interaction): void {
		if (interaction.isCommand()) this.commandInteractionHandler(interaction);
	}

	/**
	 * @param {CommandInteraction} interaction
	 */
	private async commandInteractionHandler(interaction: CommandInteraction): Promise<void> {
		const args = interaction.options;
		const { commandName } = interaction;
		const command = this.container.stores.get("slashCommands").get(commandName);

		if (!command) {
			interaction.client.emit<string>(Events.UnknownSlashCommand, { interaction, commandName });
			return;
		}

		if (interaction.inGuild() && !this.container.client.guilds.cache.has(interaction.guildId))
			return;
		const context = { commandName };
		const payload = {
			interaction,
			command,
			parameters: interaction.options,
			context: { commandName },
		};

		// Run global preconditions:
		const globalResult = await this.container.stores
			.get("slashCommandPreconditions")
			.run(interaction, command, context);

		if (!globalResult.success) {
			interaction.client.emit<string>(Events.SlashCommandDenied, globalResult.error, payload);

			return;
		}

		// Run command-specific preconditions:
		const localResult = await command.preconditions.run(interaction, command, context);

		if (!localResult.success) {
			interaction.client.emit<string>(Events.SlashCommandDenied, localResult.error, payload);

			return;
		}

		try {
			interaction.client.emit<string>(Events.SlashCommandRun, interaction, command, {
				...payload,
				args,
			});

			const result = await command.run(interaction, args, context);

			this.container.client.emit<string>(Events.SlashCommandSuccess, { ...payload, args, result });
		} catch (error) {
			interaction.client.emit<string>(Events.SlashCommandError, error, {
				...payload,
				args,
				piece: command,
			});
		} finally {
			interaction.client.emit<string>(Events.SlashCommandFinish, interaction, command, {
				...payload,
				args,
			});
		}
	}
}
