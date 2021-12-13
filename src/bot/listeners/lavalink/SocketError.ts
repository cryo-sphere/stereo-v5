import { Listener } from "../../../client";
import { ApplyOptions } from "@sapphire/decorators";
import type { Socket } from "@stereo-bot/lavalink";

@ApplyOptions<Listener.Options>((ctx) => ({ event: "socketError", emitter: ctx.store.container.client.manager }))
export default class extends Listener {
	public run({ socket, error }: { socket: Socket; error: unknown }) {
		this.container.logger.error(`Socket ${socket.options.id} encountered an error`, error);
	}
}
