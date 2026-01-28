import { useQuery } from "@tanstack/react-query";

interface UserLink {
  id: string;
  title: string;
  url: string;
  iconType: string;
  clicks: number;
  isActive: boolean;
}

interface UserInterest {
  id: string;
  interest: string;
}

interface UserNote {
  id: string;
  content: string;
  expiresAt: string;
  createdAt: string;
}

interface StoryHighlight {
  id: string;
  name: string;
  coverUrl?: string | null;
}

interface RelationshipPartner {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
}

interface FullProfile {
  id: string;
  username: string;
  displayName: string;
  bio?: string;
  avatarUrl?: string;
  coverUrl?: string;
  category?: string;
  location?: string;
  linkUrl?: string;
  netWorth: number;
  influenceScore: number;
  isVerified: boolean;
  pronouns?: string;
  createdAt: string;
  birthday?: string;
  profileSongUrl?: string;
  profileSongTitle?: string;
  profileSongArtist?: string;
  avatarVideoUrl?: string;
  voiceBioUrl?: string;
  voiceBioDurationMs?: number;
  contactEmail?: string;
  contactPhone?: string;
  contactAddress?: string;
  relationshipStatus?: string;
  relationshipPartnerId?: string;
  themeColor?: string;
  themeStyle?: string;
  highlights: StoryHighlight[];
  note?: UserNote;
  links: UserLink[];
  interests: UserInterest[];
  relationshipPartner?: RelationshipPartner;
}

export function useProfileEnhancements(userId: string | undefined) {
  return useQuery<FullProfile>({
    queryKey: [`/api/users/${userId}/profile-full`],
    enabled: !!userId,
  });
}

export function useUserNote(userId: string | undefined) {
  return useQuery<UserNote | null>({
    queryKey: [`/api/users/${userId}/note`],
    enabled: !!userId,
  });
}

export function useUserLinks(userId: string | undefined) {
  return useQuery<UserLink[]>({
    queryKey: [`/api/users/${userId}/links`],
    enabled: !!userId,
  });
}

export function useUserInterests(userId: string | undefined) {
  return useQuery<UserInterest[]>({
    queryKey: [`/api/users/${userId}/interests`],
    enabled: !!userId,
  });
}

export function useStoryHighlights(userId: string | undefined) {
  return useQuery<StoryHighlight[]>({
    queryKey: [`/api/users/${userId}/highlights`],
    enabled: !!userId,
  });
}

export function useQRCode(userId: string | undefined) {
  return useQuery<{
    qrData: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
  }>({
    queryKey: [`/api/users/${userId}/qr`],
    enabled: !!userId,
  });
}