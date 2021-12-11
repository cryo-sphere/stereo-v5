import { ListenerOptions, PieceContext, UserError, Listener as SapphireListener } from "@sapphire/framework";
import type { Client } from "../../../";

export abstract class Listener extends SapphireListener {
	public client: Client;

	public constructor(context: Listener.Context, options: Listener.Options) {
		super(context, options as any);

		this.client = this.container.client as Client;
	}

	protected error(identifier: string | UserError, context?: unknown): never {
		throw typeof identifier === "string" ? new UserError({ identifier, context }) : identifier;
	}
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Listener {
	export type Context = PieceContext;
	export type Options = ListenerOptions;
}
