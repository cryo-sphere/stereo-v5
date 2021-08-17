import { ListenerOptions } from "@sapphire/framework";
import { LavalinkListener } from "../../../client/structures/lavalinkListener";
import { ApplyOptions } from "@sapphire/decorators";
import { Socket } from "@stereo-bot/lavalink";

@ApplyOptions<ListenerOptions>({ event: "socketError" })
export default class socketErrorListener extends LavalinkListener {
	public async run({ socket, error }: { socket: Socket; error: unknown }): Promise<void> {
		const { client } = this.container;
		client.loggers.get("lavalink")?.info(`Socket ${socket.options.id} encountered an error`, error);
	}
}
