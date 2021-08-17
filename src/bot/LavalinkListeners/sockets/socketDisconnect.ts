import { ListenerOptions } from "@sapphire/framework";
import { LavalinkListener } from "../../../client/structures/lavalinkListener";
import { ApplyOptions } from "@sapphire/decorators";
import { Socket } from "@stereo-bot/lavalink";
import { CloseEvent } from "ws";

@ApplyOptions<ListenerOptions>({ event: "socketDisconnect" })
export default class socketDisconnectListener extends LavalinkListener {
	public async run({ socket, event }: { socket: Socket; event: CloseEvent }): Promise<void> {
		const { client } = this.container;
		client.loggers
			.get("lavalink")
			?.info(`Socket ${socket.options.id} disconnected. Data: ${event.code} - ${event.reason}`);
	}
}
