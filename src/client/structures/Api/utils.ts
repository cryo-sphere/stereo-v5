/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import { stringify } from "querystring";
import Client from "../../Client";

export default class Utils {
	constructor(public client: Client) {}

	public decrypt(token: string) {
		const [data, iv] = token.split(".");
		const decipher = createDecipheriv(
			"aes-256-cbc",
			process.env.DISCORD_SECRET as string,
			Buffer.from(iv, "base64")
		);

		try {
			const parsed = JSON.parse(decipher.update(data, "base64", "utf8") + decipher.final("utf8"));

			return parsed.expires >= Date.now() ? parsed : null;
		} catch {
			return null;
		}
	}

	public encrypt(data: AuthCookie): string {
		const iv = randomBytes(16);
		const cipher = createCipheriv("aes-256-cbc", process.env.DISCORD_SECRET as string, iv);
		return `${
			cipher.update(JSON.stringify(data), "utf8", "base64") + cipher.final("base64")
		}.${iv.toString("base64")}`;
	}

	public sortGuilds(guilds: any[]) {
		const valid = guilds.filter((g) => (Number(g.permissions) & 0x20) === 0x20);
		const invited = valid.filter((g) => this.client.guilds.cache.has(g.id));
		const rest = valid.filter((g) => !this.client.guilds.cache.has(g.id));
		return { invited, guilds: rest };
	}

	public async getToken(code: string): Promise<any> {
		try {
			const { data } = await axios("https://discord.com/api/v9/oauth2/token", {
				method: "POST",
				data: stringify({
					code,
					grant_type: "authorization_code",
					client_id: process.env.DISCORD_ID,
					client_secret: process.env.DISCORD_SECRET,
					redirect_uri: process.env.DISCORD_URI,
				}),
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
				},
			});

			return data;
		} catch (e) {
			return { error: e.message };
		}
	}

	static async revokeToken(token: string) {
		try {
			const data = await axios("https://discord.com/api/v9/oauth2/token/revoke", {
				method: "POST",
				data: stringify({
					token,
					client_id: process.env.DISCORD_ID,
					client_secret: process.env.DISCORD_SECRET,
				}),
				headers: {
					"content-type": "application/x-www-form-urlencoded",
				},
			});

			return data;
		} catch (e) {
			return null;
		}
	}

	public async getUser(token: string, userId: string): Promise<any> {
		try {
			let data = this.client.ApiCache.get(`${userId}-user`);
			if (!data) {
				data = (
					await axios.get("https://discord.com/api/v9/users/@me", {
						...this.getHeaders(token),
					})
				).data;

				if (data) {
					this.client.ApiCache.set(`${userId}-user`, data);
					setTimeout(() => this.client.ApiCache.delete(`${userId}-user`), 5e3);
				}
			}

			return data;
		} catch (e) {
			return { error: e.message };
		}
	}

	public async getGuilds(token: string, userId: string) {
		try {
			let data = this.client.ApiCache.get(`${userId}-guilds`);
			if (!data) {
				data = (
					await axios.get("https://discord.com/api/v9/users/@me/guilds", {
						...this.getHeaders(token),
					})
				).data;

				if (data) {
					this.client.ApiCache.set(`${userId}-guilds`, data);
					setTimeout(() => this.client.ApiCache.delete(`${userId}-guilds`), 5e3);
				}
			}

			return data;
		} catch (e) {
			console.log(e);
			return null;
		}
	}

	public parseQuery(query: any): string | null {
		return query ? (Array.isArray(query) ? query[0] : `${query}`) : null;
	}

	public capitalize(str: string): string {
		return str.charAt(0).toUpperCase() + str.slice(1);
	}

	public getHeaders(token: string) {
		return {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		};
	}

	public setCache(key: string, item: any): void {
		this.client.ApiCache.set(key, item);
		setTimeout(() => this.client.ApiCache.delete(key), 5e3);
	}
}

export interface AuthCookie {
	refresh: string;
	token: string;
	userId: string;
	expires: number;
}

export interface DiscordAuthResponse {
	access_token: string;
	token_type: string;
	expires_in: number;
	refresh_token: string;
	scope: string;
}
