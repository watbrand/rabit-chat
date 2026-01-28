import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { useQuery } from "@tanstack/react-query";

import { UserNoteDisplay } from "./UserNoteDisplay";
import { ProfileLinksSection } from "./ProfileLinksSection";
import { InterestsTags } from "./InterestsTags";
import { QRCodeModal } from "./QRCodeModal";
import { VoiceBioPlayer } from "./VoiceBioPlayer";
import { ProfileMusicWidget } from "./ProfileMusicWidget";
import { RelationshipStatusDisplay } from "./RelationshipStatusDisplay";
import { BirthdayDisplay } from "./BirthdayDisplay";
import { ContactButtons } from "./ContactButtons";
import { Spacing } from "@/constants/theme";

interface ProfileEnhancementsSectionProps {
  userId: string;
  isOwner?: boolean;
  onNavigateToPartner?: (partnerId: string) => void;
  onEditLinks?: () => void;
  onEditInterests?: () => void;
}

interface UserNote {
  id: string;
  content: string;
  expiresAt: string;
  createdAt: string;
}

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

interface ProfileEnhancements {
  birthday?: string;
  profileSongUrl?: string;
  profileSongTitle?: string;
  profileSongArtist?: string;
  voiceBioUrl?: string;
  voiceBioDurationMs?: number;
  contactEmail?: string;
  contactPhone?: string;
  contactAddress?: string;
  relationshipStatus?: string;
  relationshipPartnerId?: string;
  relationshipPartner?: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
  };
  category?: string;
  avatarUrl?: string;
}

export function ProfileEnhancementsSection({
  userId,
  isOwner = false,
  onNavigateToPartner,
  onEditLinks,
  onEditInterests,
}: ProfileEnhancementsSectionProps) {
  const [qrModalVisible, setQrModalVisible] = useState(false);

  const { data: enhancements } = useQuery<ProfileEnhancements>({
    queryKey: [`/api/users/${userId}/enhancements`],
    enabled: !!userId,
  });

  const { data: note } = useQuery<UserNote | null>({
    queryKey: [`/api/users/${userId}/note`],
    enabled: !!userId,
  });

  const { data: links } = useQuery<UserLink[]>({
    queryKey: [`/api/users/${userId}/links`],
    enabled: !!userId,
  });

  const { data: interests } = useQuery<UserInterest[]>({
    queryKey: [`/api/users/${userId}/interests`],
    enabled: !!userId,
  });

  const isBusinessProfile = enhancements?.category === "BUSINESS";
  const showContactButtons = isBusinessProfile && (enhancements?.contactEmail || enhancements?.contactPhone || enhancements?.contactAddress);

  return (
    <View style={styles.container}>
      {note ? (
        <UserNoteDisplay
          note={note}
          avatarUrl={enhancements?.avatarUrl}
        />
      ) : null}

      {enhancements?.voiceBioUrl ? (
        <VoiceBioPlayer
          voiceBioUrl={enhancements.voiceBioUrl}
          durationMs={enhancements.voiceBioDurationMs}
        />
      ) : null}

      {enhancements?.profileSongUrl ? (
        <ProfileMusicWidget
          songUrl={enhancements.profileSongUrl}
          title={enhancements.profileSongTitle}
          artist={enhancements.profileSongArtist}
        />
      ) : null}

      {showContactButtons ? (
        <ContactButtons
          email={enhancements?.contactEmail}
          phone={enhancements?.contactPhone}
          address={enhancements?.contactAddress}
        />
      ) : null}

      {links ? (
        <ProfileLinksSection
          links={links}
          isOwner={isOwner}
          onEditLinks={onEditLinks}
        />
      ) : null}

      {interests ? (
        <InterestsTags
          interests={interests}
          isOwner={isOwner}
          onEditInterests={onEditInterests}
        />
      ) : null}

      {enhancements?.relationshipStatus && enhancements.relationshipStatus !== "PREFER_NOT_TO_SAY" ? (
        <RelationshipStatusDisplay
          status={enhancements.relationshipStatus}
          partner={enhancements.relationshipPartner}
          onPartnerPress={onNavigateToPartner}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: Spacing.md,
  },
});