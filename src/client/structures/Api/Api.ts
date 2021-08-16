import { Logger } from "@daangamesdg/logger";
import cookieParser from "cookie-parser";
import { json } from "body-parser";
import express, { Express } from "express";
import Client from "../../Client";
import { AuthMiddleware } from "./middleware/auth";
import { ApiRoute, OauthRoute } from "./routes";
import cors from "cors";

export class Api {
	public server: Express;
	public port = Number(process.env.PORT) ?? 3001;

	public logger: Logger;

	constructor(public client: Client) {
		this.server = express();
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		this.logger = client.loggers.get("api")!;
		this.server.use(
			cors({ credentials: true, origin: ["http://localhost:3000"] }),
			json(),
			cookieParser(),
			new AuthMiddleware(client).middleware
		);

		this.loadRoutes();
	}

	private loadRoutes() {
		if (process.env.DISCORD_SECRET)
			this.server.use("/oauth", new OauthRoute(this.client, this.logger).router);
		this.server.use("/api", new ApiRoute(this.client, this.logger).router);
	}

	public start() {
		this.server.listen(this.port, () => this.logger.info(`Api is listening to port ${this.port}`));
	}
}
