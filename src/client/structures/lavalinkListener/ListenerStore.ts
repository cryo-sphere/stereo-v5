import { Store } from "@sapphire/framework";
import { LavalinkListener } from "./Listener";

export class LavalinkListenerStore extends Store<LavalinkListener> {
	constructor() {
		super(LavalinkListener as never, { name: "LavalinkListeners" });
	}
}
