import { Listener, ListenerOptions } from "@sapphire/framework";
import { ApplyOptions } from "@sapphire/decorators";

@ApplyOptions<ListenerOptions>({ event: "error" })
export default class ErrorListener extends Listener {
	public async run(error: Error): Promise<void> {
		const { client } = this.container;
		client.loggers.get("bot")?.error(error.stack ?? error.message ?? error);
	}
}
