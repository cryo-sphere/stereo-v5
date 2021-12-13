import { Listener } from "../../../client";
import { ApplyOptions } from "@sapphire/decorators";
import type { Socket } from "@stereo-bot/lavalink";
import type { CloseEvent } from "ws";

@ApplyOptions<Listener.Options>((ctx) => ({ event: "socketDIsconnect", emitter: ctx.store.container.client.manager }))
export default class extends Listener {
	public run({ socket, event }: { socket: Socket; event: CloseEvent }) {
		this.container.logger.warn(`[Socket ${socket.options.id}]: socket disconnected => Data: ${event.code} - ${event.reason}`);
	}
}
