import { PreconditionOptions, PieceContext, Precondition as SapphirePrecondition, PreconditionResult } from "@sapphire/framework";
import type { Client } from "../../../";
import { Logger } from "..";

export abstract class Precondition extends SapphirePrecondition {
	public client: Client;
	public logger = new Logger({ name: "Bot" });

	public constructor(context: Precondition.Context, options: PreconditionOptions) {
		super(context, options);

		this.client = this.container.client as Client;
	}
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Precondition {
	export type Context = PieceContext;
	export type Result = PreconditionResult;
}
