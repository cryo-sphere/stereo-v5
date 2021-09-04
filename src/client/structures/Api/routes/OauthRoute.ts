import { Logger } from "@daangamesdg/logger";
import { Request, Response, Router } from "express";
import Client from "../../../Client";
import Utils from "../utils";

export class OauthRoute {
	public router: Router;
	public utils: Utils;

	constructor(public client: Client, public logger: Logger) {
		this.utils = new Utils(client);
		this.router = Router();
		this.router
			.get("/callback", this.callback.bind(this))
			.get("/login", this.login.bind(this))
			.delete("/logout", this.logout.bind(this));
	}

	private async callback(req: Request, res: Response) {
		const code = this.utils.parseQuery(req.query.code);
		if (!code) return res.status(400).send("bad request");

		try {
			// token
			const data = await this.utils.getToken(code);
			if (data.error) throw new Error(data.error);

			const user = await this.utils.getUser(data.access_token, "");
			if (!user) throw new Error("unable to get user");

			const expires = Date.now() + data.expires_in * 1e3;
			const cookie = this.utils.encrypt({
				expires,
				refresh: data.refresh_token,
				token: data.access_token,
				userId: user.id,
			});

			res
				.cookie("STEREO_AUTH", cookie, { maxAge: expires + data.expires_in * 1e3 })
				.redirect(process.env.DASHBOARD ?? "http://localhost:3000");
		} catch (e) {
			res.status(500).json({ message: "internal server error", error: e.message });
		}
	}

	private login(_: Request, res: Response) {
		res.redirect(
			`https://discord.com/api/v9/oauth2/authorize?client_id=${
				this.client.user?.id
			}&redirect_uri=${encodeURIComponent(
				process.env.DISCORD_URI as string
			)}&response_type=code&scope=identify%20guilds`
		);
	}

	private async logout(req: Request, res: Response) {
		if (!req.auth) return res.status(401).send("Unauthorized");

		try {
			const data = await Utils.revokeToken(req.auth.token);
			if (!data) throw new Error("unknown error");
			if (data.status === 503) {
				const retryAfter = data.headers.get("Retry-After");
				const duration = retryAfter === null ? 5e3 : Number(retryAfter) * 1e3;
				await new Promise((resolve) => setTimeout(resolve, duration));

				this.logout(req, res);
				return;
			}

			res.clearCookie("STEREO_AUTH").sendStatus(204);
		} catch (e) {
			res.status(500).json({ message: "internal server error", error: e.message });
		}
	}
}
