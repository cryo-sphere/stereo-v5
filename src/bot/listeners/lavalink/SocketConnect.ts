import { Listener } from "../../../client";
import { ApplyOptions } from "@sapphire/decorators";
import type { Socket } from "@stereo-bot/lavalink";

@ApplyOptions<Listener.Options>((ctx) => ({ event: "socketConnect", emitter: ctx.store.container.client.manager }))
export default class extends Listener {
	public run(socket: Socket) {
		this.container.logger.info(`[Socket ${socket.options.id}]: Connected to Lavalink!`);
	}
}
