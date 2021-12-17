export interface MusicPermissionFlags {
	PLAY_SONGS: bigint;
	EDIT_QUEUE: bigint;
	PLAYER_CONTROLS: bigint;
	FILTERS: bigint;
	FORCE_SKIP_SONGS: bigint;
}

export type MusicPermissionResolvable = bigint | keyof MusicPermissionFlags | Array<bigint | keyof MusicPermissionFlags>;
