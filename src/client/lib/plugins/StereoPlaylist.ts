import axios from "axios";
import { Manager, SearchFunction, SearchResult, Plugin, Structure } from "@stereo-bot/lavalink";
import type { Playlist } from "@prisma/client";

export class StereoPlaylist extends Plugin {
	public managerSearch!: SearchFunction;

	private readonly api: string = process.env.API!;
	private readonly regex = /(?:https:\/\/stereo-bot\.tk\/|stereo:)(playlists)?[\/:]([A-Za-z0-9|\-|_]+)/;

	private readonly SpotifyRegex = /(?:https:\/\/open\.spotify\.com\/|spotify:)(?:.+)?(track|playlist|album)[\/:]([A-Za-z0-9]+)/gi;
	private readonly DeezerRegex = /(?:https:\/\/www\.deezer\.com\/|deezer:)(?:[A-Za-z]+)(?:.+)?(track|playlist|album)[\/:]([A-Za-z0-9]+)/gi;

	public constructor() {
		super();
	}

	public init(manager: Manager) {
		this.manager = manager;

		this.managerSearch = manager.search.bind(manager);
		manager.search = this.search.bind(this);
	}

	public async search(query: string, requester: string, searchType?: "yt" | "sc"): Promise<SearchResult> {
		const [, type, id] = query.match(this.regex) ?? [];
		if (!type || type !== "playlists" || !id) return this.managerSearch(query, requester, searchType);

		const res = await this.getPlaylist(id, requester);
		if (!res || !res.tracks.length)
			return {
				loadType: "NO_MATCHES",
				tracks: [],
				exception: {
					severity: "COMMON",
					message: "no track(s) found"
				}
			};

		return {
			loadType: "PLAYLIST_LOADED",
			tracks: res.tracks,
			playlistInfo: {
				duration: 0,
				name: res.name
			}
		};
	}

	private async get<T>(endpoint: string) {
		const res = await axios.get<T>(`${this.api}${endpoint}`).catch(() => ({ data: null }));
		return res.data;
	}

	private async getPlaylist(id: string, requester: string) {
		const playlist = await this.get<{ playlist: Playlist; isOwner: boolean }>(`/api/playlist?playlistId=${id}`);
		if (!playlist) return null;

		const tracks = playlist.playlist.songs.map((track) => this.createTrack(track, requester));

		return { tracks, name: playlist.playlist.name };
	}

	private createTrack(data: string, requester: string) {
		const track = new (Structure.get("Track"))({
			requester,
			title: data,
			[this.SpotifyRegex.test(data) || this.DeezerRegex.test(data) ? "externalUri" : "uri"]: data
		});

		track.isStereoTrack = true;

		return track;
	}
}
