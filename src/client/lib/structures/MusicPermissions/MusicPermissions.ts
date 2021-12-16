import type { MusicPermissionFlags, MusicPermissionResolvable } from "./types";

export class MusicPermissions {
	public permissions: bigint;

	public constructor(permissions: MusicPermissionResolvable) {
		this.permissions = MusicPermissions.resolve(permissions);
	}

	public has(permissions: MusicPermissionResolvable) {
		const resolved = MusicPermissions.resolve(permissions);
		return (this.permissions & resolved) === resolved;
	}

	public static FLAGS: MusicPermissionFlags = {
		PLAY_SONGS: 1n << 1n,
		EDIT_QUEUE: 1n << 2n,
		AUDIO_CONTROLS: 1n << 3n,
		FILTERS: 1n << 4n
	};

	public static resolve(permissions: MusicPermissionResolvable): bigint {
		if (typeof permissions === "bigint") return permissions;
		if (Array.isArray(permissions))
			return permissions.map((permission) => MusicPermissions.resolve(permission)).reduce((prev, next) => prev + next);

		return MusicPermissions.FLAGS[permissions] ?? 0n;
	}
}
