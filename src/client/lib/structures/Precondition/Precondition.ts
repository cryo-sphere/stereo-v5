import {
	PreconditionOptions,
	Precondition as SapphirePrecondition,
	PreconditionResult,
	AsyncPreconditionResult,
	PreconditionContext,
	PieceContext
} from "@sapphire/framework";
import type { TranslationManager } from "../..";
import type { Client } from "../../../";

export abstract class Precondition extends SapphirePrecondition {
	public client: Client;
	public translate: TranslationManager;

	public constructor(context: PieceContext, options: PreconditionOptions) {
		super(context, options);

		this.client = this.container.client as Client;
		this.translate = this.client.translationManager;
	}
}

export namespace Precondition {
	export type Context = PreconditionContext;
	export type Result = PreconditionResult;
	export type AsyncResult = AsyncPreconditionResult;
}
