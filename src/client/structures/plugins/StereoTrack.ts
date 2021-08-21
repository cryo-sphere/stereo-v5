import { Manager, Structure } from "@stereo-bot/lavalink";

Structure.extend(
	"Track",
	(Track) =>
		class StereoTrack extends Track {
			public isStereoTrack = false;

			async resolve(manager: Manager): Promise<boolean> {
				if (this.isStereoTrack && (this.externalUri || this.uri)) {
					const res = await manager.search(this.externalUri || this.uri || "", this.requester);
					if (!["TRACK_LOADED", "SEARCH_RESULT"].includes(res.loadType)) return false;

					const track = res.tracks[0];
					if (!track) return false;

					this.requester = track.requester;
					this.track = track.track ?? undefined;
					this.uri = track.uri ?? undefined;
					this.title = track.title ?? undefined;
					this.isStream = track.isStream ?? undefined;
					this.isSeekable = track.isSeekable ?? undefined;
					this.identifier = track.identifier ?? undefined;
					this.externalUri = track.externalUri ?? undefined;
					this.duration = track.duration ?? undefined;
					this.author = track.author ?? undefined;
				}

				return this.isNormal() ? true : super.resolve(manager);
			}
		}
);

declare module "@stereo-bot/lavalink" {
	interface Track {
		isStereoTrack: boolean;
	}
}
