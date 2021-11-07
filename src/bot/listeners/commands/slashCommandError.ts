import { ArgumentError, Events, UserError } from "@sapphire/framework";
import { Listener, SlashCommandErrorPayload } from "../../../client";
import { ApplyOptions } from "@sapphire/decorators";
import { CommandInteraction, DiscordAPIError, HTTPError } from "discord.js";
import { RESTJSONErrorCodes } from "discord-api-types/v9";
import { codeBlock } from "@sapphire/utilities";
import { emojis } from "../../../client/constants";

const ignoredCodes = [RESTJSONErrorCodes.UnknownChannel, RESTJSONErrorCodes.UnknownMessage];

@ApplyOptions<Listener.Options>({ once: false, event: "slashCommandError" })
export default class extends Listener {
	public async run(error: any, { interaction, piece }: SlashCommandErrorPayload) {
		// If string || UserError, send to user
		if (typeof error === "string") return this.reply(interaction, `>>> ${emojis.error} | ${error}`);
		if (error instanceof ArgumentError || error instanceof UserError) return this.reply(interaction, `>>> ${emojis.error} | ${error.message}`);

		if (error.name === "AbortError" || error.message === "Internal Server Error") {
			this.logger.warn(`${this.getWarnError(interaction)} (${interaction.user.id}) | ${error.constructor.name} | ${error.message}`);
			return this.reply(
				interaction,
				`>>> ${emojis.error} | Oh no, this does not look very good. Something caused the request to abort their mission, please try again.`
			);
		}

		// checks if error is DiscordAPIError || HTTPError
		if (error instanceof DiscordAPIError || error instanceof HTTPError) {
			if (this.isSilencedError(interaction, error)) return;
			return this.client.emit("error", error);
		}

		if (typeof error.constructor.name === "string" && error.constructor.name.toLowerCase() === "discordjserror") {
			await this.reply(interaction, `>>> ${emojis.error} | ${error.message ?? "unknown error, please try again later."}`);
			return this.logger.error(`${this.getWarnError(interaction)} (${interaction.user.id}) | ${error.constructor.name} | ${error.message}`);
		}

		const command = piece;
		this.logger.fatal(`[COMMAND] ${command.location.full}\n${error.stack || error.message}`);

		try {
			return this.reply(interaction, this.generateUnexpectedErrorMessage(interaction, error));
		} catch (err) {
			this.client.emit(Events.Error, err);
		}

		return undefined;
	}

	private reply(interaction: CommandInteraction, str: string) {
		if (interaction.deferred || interaction.replied) return interaction.followUp(str).catch(() => void 0);
		return interaction.reply(str).catch(() => void 0);
	}

	private isSilencedError(interaction: CommandInteraction, error: DiscordAPIError | HTTPError) {
		return ignoredCodes.includes(error.code) || this.isDirectMessageReplyAfterBlock(interaction, error);
	}

	private isDirectMessageReplyAfterBlock(interaction: CommandInteraction, error: DiscordAPIError | HTTPError) {
		if (error.code !== RESTJSONErrorCodes.CannotSendMessagesToThisUser) return false;
		if (interaction.guild !== null) return false;
		return error.path === `/channels/${interaction.channelId}/messages`;
	}

	private generateUnexpectedErrorMessage(interaction: CommandInteraction, error: Error) {
		if (this.client.owners.includes(interaction.user.id)) return codeBlock("js", error.stack ?? error.message);

		return `>>> ${emojis.error} | Oh no, this does not look very good.\n**Error**: \`${error.message}\`\nIf this keeps happening, please DM the developer of this bot.`;
	}

	private getWarnError(interaction: CommandInteraction) {
		return `ERROR: /${interaction.guild ? `${interaction.guild.id}/${interaction.channelId}` : `DM/${interaction.user.id}`}/${interaction.id}`;
	}
}
