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
		PLAYER_CONTROLS: 1n << 3n,
		FILTERS: 1n << 4n
	};

	public static resolve(permissions: MusicPermissionResolvable): bigint {
		if (typeof permissions === "bigint") return permissions;
		if (Array.isArray(permissions))
			return permissions.map((permission) => MusicPermissions.resolve(permission)).reduce((prev, next) => prev + next);

		return MusicPermissions.FLAGS[permissions] ?? 0n;
	}

	public static resolveToString(permissions: MusicPermissionResolvable): string[] {
		let perms: bigint;
		const permissionArray: string[] = [];

		if (Array.isArray(permissions))
			perms = permissions.map((permission) => MusicPermissions.resolve(permission)).reduce((prev, next) => prev + next);
		if (typeof permissions === "bigint") perms = permissions;
		else perms = MusicPermissions.resolve(permissions);

		const hasBit = (permissions: bigint, bit: bigint) => {
			return (permissions & bit) === bit;
		};

		for (const [id, bit] of Object.entries(MusicPermissions.FLAGS) as [keyof MusicPermissionFlags, bigint][])
			if (hasBit(perms, bit)) permissionArray.push(id);

		return permissionArray;
	}
}
