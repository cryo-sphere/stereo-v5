import { ArgumentError, Events, ChatInputCommandErrorPayload, UserError } from "@sapphire/framework";
import { CommandInteraction, DiscordAPIError, HTTPError } from "discord.js";
import { Listener } from "../../../client";
import { RESTJSONErrorCodes } from "discord-api-types/v9";
import { ApplyOptions } from "@sapphire/decorators";
import { codeBlock } from "@sapphire/utilities";

const ignoredCodes = [RESTJSONErrorCodes.UnknownChannel, RESTJSONErrorCodes.UnknownMessage];

@ApplyOptions<Listener.Options>({ event: "chatInputCommandError" })
export default class extends Listener {
	public async run(error: any, { interaction, command }: ChatInputCommandErrorPayload) {
		// If string || UserError, send to user
		if (typeof error === "string")
			return this.reply(interaction, this.translate.translate(interaction.guildId, "BotGeneral:error_raw", { error }));
		if (error instanceof ArgumentError)
			return this.reply(interaction, this.translate.translate(interaction.guildId, `BotGeneral:errors.${error.identifier}`));
		if (error instanceof UserError)
			return this.reply(interaction, this.translate.translate(interaction.guildId, `BotGeneral:errors.${error.identifier}`));

		if (error.name === "AbortError" || error.message === "Internal Server Error") {
			this.container.logger.warn(`${this.getWarnError(interaction)} (${interaction.user.id}) | ${error.constructor.name} | ${error.message}`);

			return this.reply(interaction, this.translate.translate(interaction.guildId, "BotGeneral:error"));
		}

		// checks if error is DiscordAPIError || HTTPError
		if (error instanceof DiscordAPIError || error instanceof HTTPError) {
			if (this.isSilencedError(interaction, error)) return;
			return this.container.client.emit("error", error);
		}

		if (typeof error.constructor.name === "string" && error.constructor.name.toLowerCase() === "discordjserror") {
			await this.reply(interaction, this.translate.translate(interaction.guildId, "BotGeneral:error_raw", { error: error.message }));
			return this.container.logger.error(
				`${this.getWarnError(interaction)} (${interaction.user.id}) | ${error.constructor.name} | ${error.message}`
			);
		}

		this.container.logger.fatal(`[COMMAND] ${command.location.full}\n${error.stack || error.message}`);

		try {
			return this.reply(interaction, this.generateUnexpectedErrorMessage(interaction, error));
		} catch (err) {
			this.container.client.emit(Events.Error, err);
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
		if (this.container.client.owners.includes(interaction.user.id)) return codeBlock("js", error.stack ?? error.message);

		return this.translate.translate(interaction.guildId, "BotGeneral:error_raw", { error });
	}

	private getWarnError(interaction: CommandInteraction) {
		return `ERROR: /${interaction.guild ? `${interaction.guild.id}/${interaction.channelId}` : `DM/${interaction.user.id}`}/${interaction.id}`;
	}
}
