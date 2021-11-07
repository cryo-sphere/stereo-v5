import { Listener, SlashCommandRegistrar } from "../../client";
import { ApplyOptions } from "@sapphire/decorators";

@ApplyOptions<Listener.Options>({ event: "ready", once: true })
export default class extends Listener {
	public async run() {
		this.logger.info(`${this.client.user!.tag} has logged in!`);

		const registar = new SlashCommandRegistrar(this.client);
		await registar.refresh();
	}
}
