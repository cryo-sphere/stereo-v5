import { ListenerOptions } from "@sapphire/framework";
import { LavalinkListener } from "../../../client/structures/lavalinkListener";
import { ApplyOptions } from "@sapphire/decorators";
import { Socket } from "@stereo-bot/lavalink";

@ApplyOptions<ListenerOptions>({ event: "socketConnect" })
export default class socketConnectListener extends LavalinkListener {
	public async run(socket: Socket): Promise<void> {
		const { client } = this.container;
		client.loggers.get("lavalink")?.info(`${socket.options.id} is now connected to Lavalink!`);
	}
}
