import type { CommandInteraction, ContextMenuInteraction, Interaction, Message, Role } from "discord.js";
import { MusicPermissionResolvable, MusicPermissions, Precondition } from "../../client";

type Context = Precondition.Context & { permissions: MusicPermissionResolvable };

export default class extends Precondition {
	public messageRun(message: Message): Precondition.Result {
		return this.client.blacklistManager.isBlacklisted(message.author.id, message.guildId ?? undefined)
			? this.error({
					message:
						"You or this server is blacklisted, you can no longer use this bot. If you think that this is a mistake, please DM one of the developers of this bot!"
			  })
			: this.ok();
	}

	public contextMenuRun(interaction: ContextMenuInteraction, command: any, context: Context): Precondition.Result {
		return this.InteractionRun(interaction, context);
	}

	public chatInputRun(interaction: CommandInteraction, command: any, context: Context): Precondition.Result {
		return this.InteractionRun(interaction, context);
	}

	private async InteractionRun(interaction: Interaction, context: Context): Precondition.AsyncResult {
		if (!interaction.inCachedGuild) return this.error({ identifier: "botGeneral:errors.preconditionCachedGuildOnly" });

		const config = this.client.config.get(interaction.guildId);
		if (!config || !config.permsEnabled) return this.ok();

		const roles = Array.isArray(interaction.member.roles)
			? await this.resolveRoles(interaction)
			: [...interaction.member.roles.cache.sort((a, b) => a.position - b.position).values()];

		const permRole = roles.find((role) => config.permissions.find((perm) => perm.id === role.id));
		if (!permRole)
			return this.error({
				identifier: "permissions:custom",
				message: "Missing music permissions",
				context: { permissions: context.permissions }
			});

		const permissions = new MusicPermissions(config.permissions.find((perm) => perm.id === permRole.id)!.permissions);
		if (!permissions.has(context.permissions))
			return this.error({
				identifier: "permissions:custom",
				message: "Missing music permissions",
				context: { permissions: context.permissions }
			});

		return this.ok();
	}

	private async resolveRoles(interaction: Interaction) {
		if (!Array.isArray(interaction.member.roles)) return [...interaction.member.roles.cache.sort((a, b) => a.position - b.position).values()];

		const roles = await Promise.all(interaction.member.roles.map((id) => this.client.utils.getRole(id, interaction.guild!)));
		return roles.filter((r) => r !== null).sort((a, b) => a!.position - b!.position) as Role[];
	}
}
