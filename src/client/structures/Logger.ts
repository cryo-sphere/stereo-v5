import { Logger as defaultLogger, LogData, LoggerOptions, Structure } from "@daangamesdg/logger";
import { WebhookClient } from "discord.js";
import moment from "moment";

Structure.extend(
	"Formatter",
	(Formatter) =>
		class extends Formatter {
			public webhook(input: unknown[], config: LogData & { name: string }): string {
				let str = "";

				if (config.timestamp) {
					const date =
						typeof config.timestamp === "number" ? new Date(config.timestamp) : config.timestamp;
					const dateString = moment(date).format("HH:mm:ss DD-MM-YYYY");

					str += `\`${dateString}\``;
				}

				str += ` **${`[${config.level}]`.padEnd(7, " ")} » [${config.name}]:** ${input.toString()}`;

				return str;
			}
		}
);

declare module "@daangamesdg/logger" {
	class Formatter {
		webhook(input: unknown[], config: LogData & { name: string }): string;
	}
}

export default class Logger extends defaultLogger {
	public webhook: WebhookClient | null = null;

	constructor(options: LoggerOptions & { webhook?: string }) {
		super(options);
		if (options.webhook) this.webhook = new WebhookClient({ url: options.webhook });
	}

	public write(input: unknown[], data: LogData) {
		if (data.level === "DEBUG" && !process.env.DEBUG) return this;
		super.write(input, data);

		if (this.webhook && process.env.NODE_ENV !== "development") {
			const str = this.formatter.webhook(input, { ...data, name: this.name });
			this.webhook.send(str.substr(0, 2000)).catch(() => void 0);
		}

		return this;
	}
}
