import Client from "../Client";

export default class BlacklistManager {
	public blacklisted: string[] = [];

	constructor(public client: Client) {}

	public isBlacklisted(userId: string, guildId = ""): boolean {
		return this.blacklisted.includes(userId) || this.blacklisted.includes(guildId);
	}

	public setBlacklisted(blacklisted: string[]): this {
		this.blacklisted = blacklisted;

		return this;
	}
}
