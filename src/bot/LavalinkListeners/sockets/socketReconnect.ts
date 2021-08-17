import { ListenerOptions } from "@sapphire/framework";
import { LavalinkListener } from "../../../client/structures/lavalinkListener";
import { ApplyOptions } from "@sapphire/decorators";
import { Socket } from "@stereo-bot/lavalink";

@ApplyOptions<ListenerOptions>({ event: "socketReconnect" })
export default class socketReconnectListener extends LavalinkListener {
	public async run(socket: Socket): Promise<void> {
		const { client } = this.container;
		client.loggers.get("lavalink")?.info(`Socket ${socket.options.id} reconnected to lavalink.`);
	}
}
