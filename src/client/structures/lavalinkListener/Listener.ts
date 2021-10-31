/* eslint-disable @typescript-eslint/no-explicit-any */
import { Events } from "@sapphire/framework";
import { Piece, PieceContext, PieceOptions } from "@sapphire/pieces";
import type { Client as TypeClient } from "discord.js";
import EventEmitter from "events";
import Client from "../../Client";

export abstract class LavalinkListener extends Piece {
	public client: Client;
	/**
	 * The emitter, if any.
	 * @since 2.0.0
	 */
	public readonly emitter: EventEmitter | null;

	/**
	 * The name of the event the listener listens to.
	 * @since 2.0.0
	 */
	public readonly event: string;

	/**
	 * Whether or not the listener will be unloaded after the first run.
	 * @since 2.0.0
	 */
	public readonly once: boolean;
	private _listener: ((...args: any[]) => void) | null;

	public constructor(context: PieceContext, options: ListenerOptions = {}) {
		super(context, options);

		this.client = this.container.client as Client;
		this.emitter = this.container.client.manager;
		this.event = options.event ?? this.name;
		this.once = options.once ?? false;

		this._listener =
			this.emitter && this.event
				? this.once
					? this._runOnce.bind(this)
					: this._run.bind(this)
				: null;

		// If there's no emitter or no listener, disable:
		if (this.emitter === null || this._listener === null) this.enabled = false;
	}

	public abstract run(...args: unknown[]): unknown;

	public onLoad() {
		if (this._listener) {
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			const emitter = this.emitter!;

			// Increment the maximum amount of listeners by one:
			const maxListeners = emitter.getMaxListeners();
			if (maxListeners !== 0) emitter.setMaxListeners(maxListeners + 1);

			emitter[this.once ? "once" : "on"](this.event, this._listener);
		}
		return super.onLoad();
	}

	public onUnload() {
		if (!this.once && this._listener) {
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			const emitter = this.emitter!;

			// Increment the maximum amount of listeners by one:
			const maxListeners = emitter.getMaxListeners();
			if (maxListeners !== 0) emitter.setMaxListeners(maxListeners - 1);

			emitter.off(this.event, this._listener);
			this._listener = null;
		}

		return super.onUnload();
	}

	public toJSON() {
		return {
			...super.toJSON(),
			once: this.once,
			event: this.event,
		};
	}

	private async _run(...args: unknown[]) {
		try {
			await this.run(...args);
		} catch (error) {
			// @ts-ignore
			this.container.client.emit(Events.ListenerError, error, { piece: this });
		}
	}

	private async _runOnce(...args: unknown[]) {
		await this._run(...args);
		await this.unload();
	}
}

export interface ListenerOptions extends PieceOptions {
	readonly emitter?: keyof TypeClient | EventEmitter | string;
	readonly event?: string;
	readonly once?: boolean;
}
