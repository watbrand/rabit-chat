/**
 * Deezer API Service
 * 
 * Provides access to Deezer's music catalog for story music overlays.
 * The Deezer API is free and doesn't require authentication for public endpoints.
 * 
 * API Documentation: https://developers.deezer.com/api
 */

const DEEZER_API_BASE = "https://api.deezer.com";

export interface DeezerTrack {
  id: number;
  title: string;
  title_short: string;
  duration: number;
  preview: string;
  artist: {
    id: number;
    name: string;
    picture: string;
    picture_small: string;
    picture_medium: string;
    picture_big: string;
  };
  album: {
    id: number;
    title: string;
    cover: string;
    cover_small: string;
    cover_medium: string;
    cover_big: string;
    cover_xl: string;
  };
  explicit_lyrics?: boolean;
  rank?: number;
}

export interface DeezerSearchResponse {
  data: DeezerTrack[];
  total: number;
  next?: string;
}

export interface DeezerChartResponse {
  tracks: {
    data: DeezerTrack[];
    total: number;
  };
}

export interface DeezerGenre {
  id: number;
  name: string;
  picture: string;
  picture_small: string;
  picture_medium: string;
  picture_big: string;
}

export interface DeezerGenresResponse {
  data: DeezerGenre[];
}

export interface DeezerPlaylist {
  id: number;
  title: string;
  picture: string;
  picture_medium: string;
  picture_big: string;
  tracklist: string;
}

export interface StoryMusicTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  previewUrl: string;
  coverUrl: string;
  coverUrlSmall: string;
  genre?: string;
  isExplicit: boolean;
  popularity: number;
  source: "deezer";
  sourceId: number;
}

async function fetchDeezer<T>(endpoint: string): Promise<T> {
  const url = `${DEEZER_API_BASE}${endpoint}`;
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Deezer API error: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  
  if (data.error) {
    throw new Error(`Deezer API error: ${data.error.message || data.error.type}`);
  }
  
  return data;
}

function transformTrack(track: DeezerTrack, genre?: string): StoryMusicTrack {
  return {
    id: `deezer_${track.id}`,
    title: track.title_short || track.title,
    artist: track.artist.name,
    album: track.album.title,
    duration: track.duration,
    previewUrl: track.preview,
    coverUrl: track.album.cover_big || track.album.cover_medium || track.album.cover,
    coverUrlSmall: track.album.cover_small || track.album.cover,
    genre: genre,
    isExplicit: track.explicit_lyrics || false,
    popularity: track.rank || 0,
    source: "deezer",
    sourceId: track.id,
  };
}

/**
 * Search for tracks by query
 */
export async function searchTracks(query: string, limit: number = 25): Promise<StoryMusicTrack[]> {
  const encodedQuery = encodeURIComponent(query);
  const response = await fetchDeezer<DeezerSearchResponse>(`/search?q=${encodedQuery}&limit=${limit}`);
  
  return response.data
    .filter(track => track.preview) // Only include tracks with previews
    .map(track => transformTrack(track));
}

/**
 * Get chart/trending tracks
 */
export async function getChartTracks(limit: number = 50): Promise<StoryMusicTrack[]> {
  // The /chart/0/tracks endpoint returns { data: DeezerTrack[] }
  const response = await fetchDeezer<{ data: DeezerTrack[] }>(`/chart/0/tracks?limit=${limit}`);
  
  return response.data
    .filter((track: DeezerTrack) => track.preview)
    .map((track: DeezerTrack) => transformTrack(track, "Pop"));
}

/**
 * Get available music genres
 */
export async function getGenres(): Promise<DeezerGenre[]> {
  const response = await fetchDeezer<DeezerGenresResponse>("/genre");
  
  // Filter out "All" genre (id: 0)
  return response.data.filter(genre => genre.id !== 0);
}

/**
 * Get tracks by genre
 */
export async function getTracksByGenre(genreId: number, limit: number = 25): Promise<StoryMusicTrack[]> {
  // Get genre artists first, then get their top tracks
  const response = await fetchDeezer<{ data: { id: number; name: string }[] }>(`/genre/${genreId}/artists?limit=10`);
  
  const tracks: StoryMusicTrack[] = [];
  
  // Fetch genre info once
  let genreName = "";
  try {
    const genreInfo = await fetchDeezer<DeezerGenre>(`/genre/${genreId}`);
    genreName = genreInfo.name;
  } catch (error) {
    console.error(`Error fetching genre info for ${genreId}:`, error);
  }
  
  for (const artist of response.data.slice(0, 5)) {
    try {
      const artistTracks = await fetchDeezer<{ data: DeezerTrack[] }>(`/artist/${artist.id}/top?limit=5`);
      
      for (const track of artistTracks.data) {
        if (track.preview && tracks.length < limit) {
          tracks.push(transformTrack(track, genreName));
        }
      }
    } catch (error) {
      // Continue with other artists if one fails
      console.error(`Error fetching tracks for artist ${artist.id}:`, error);
    }
    
    if (tracks.length >= limit) break;
  }
  
  return tracks;
}

/**
 * Get track by Deezer ID
 */
export async function getTrackById(trackId: number): Promise<StoryMusicTrack | null> {
  try {
    const track = await fetchDeezer<DeezerTrack>(`/track/${trackId}`);
    if (!track.preview) return null;
    return transformTrack(track);
  } catch (error) {
    return null;
  }
}

/**
 * Get editorial/curated playlists for discovery
 */
export async function getEditorialPlaylists(limit: number = 10): Promise<DeezerPlaylist[]> {
  try {
    const response = await fetchDeezer<{ data: DeezerPlaylist[] }>(`/chart/0/playlists?limit=${limit}`);
    return response.data;
  } catch (error) {
    return [];
  }
}

/**
 * Get tracks from a playlist
 */
export async function getPlaylistTracks(playlistId: number, limit: number = 25): Promise<StoryMusicTrack[]> {
  try {
    const response = await fetchDeezer<{ data: DeezerTrack[] }>(`/playlist/${playlistId}/tracks?limit=${limit}`);
    
    return response.data
      .filter(track => track.preview)
      .map(track => transformTrack(track));
  } catch (error) {
    return [];
  }
}

/**
 * Get radio/mood-based tracks
 */
export async function getRadioTracks(radioId: number, limit: number = 25): Promise<StoryMusicTrack[]> {
  try {
    const response = await fetchDeezer<{ data: DeezerTrack[] }>(`/radio/${radioId}/tracks?limit=${limit}`);
    
    return response.data
      .filter(track => track.preview)
      .map(track => transformTrack(track));
  } catch (error) {
    return [];
  }
}

/**
 * Get popular radios (mood-based stations)
 */
export async function getRadios(): Promise<{ id: number; title: string; picture: string }[]> {
  try {
    const response = await fetchDeezer<{ data: { id: number; title: string; picture_medium: string }[] }>("/radio");
    
    return response.data.map(radio => ({
      id: radio.id,
      title: radio.title,
      picture: radio.picture_medium,
    }));
  } catch (error) {
    return [];
  }
}

// Genre ID mapping for common moods/categories
export const GENRE_IDS = {
  pop: 132,
  hiphop: 116,
  rnb: 165,
  rock: 152,
  electronic: 106,
  jazz: 129,
  classical: 98,
  latin: 197,
  reggae: 144,
  country: 84,
  metal: 464,
  soul: 169,
  folk: 466,
  blues: 153,
  african: 2,
  asian: 16,
} as const;

export type GenreKey = keyof typeof GENRE_IDS;
