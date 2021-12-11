import { Listener } from "../../client";
import { ApplyOptions } from "@sapphire/decorators";

@ApplyOptions<Listener.Options>({ event: "ready", once: true })
export default class extends Listener {
	public run() {
		this.container.logger.info(`${this.client.user!.tag} has logged in!`);
	}
}
