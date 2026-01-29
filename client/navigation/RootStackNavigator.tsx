import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MainTabNavigator from "@/navigation/MainTabNavigator";
import AdminStackNavigator from "@/navigation/AdminStackNavigator";
import AuthScreen from "@/screens/AuthScreen";
import OnboardingScreen from "@/screens/OnboardingScreen";
import CreatePostScreen from "@/screens/CreatePostScreen";
import ChatScreen from "@/screens/ChatScreen";
import ConversationSettingsScreen from "@/screens/ConversationSettingsScreen";
import MessageSearchScreen from "@/screens/MessageSearchScreen";
import UserProfileScreen from "@/screens/UserProfileScreen";
import ProfilePageScreen from "@/screens/ProfilePageScreen";
import PostDetailScreen from "@/screens/PostDetailScreen";
import StoryComposerScreen from "@/screens/StoryComposerScreen";
import StoryViewerScreen from "@/screens/StoryViewerScreen";
import ReelsScreen from "@/screens/ReelsScreen";
import ExploreReelsScreen from "@/screens/ExploreReelsScreen";
import ExplorePicturesScreen from "@/screens/ExplorePicturesScreen";
import VoiceReelsScreen from "@/screens/VoiceReelsScreen";
import ProfileReelsScreen from "@/screens/ProfileReelsScreen";
import LiveStreamScreen from "@/screens/LiveStreamScreen";
import GoLiveScreen from "@/screens/GoLiveScreen";
import GroupsScreen from "@/screens/GroupsScreen";
import EventsScreen from "@/screens/EventsScreen";
import GroupChatScreen from "@/screens/GroupChatScreen";
import VideoCallScreen from "@/screens/VideoCallScreen";
import VoiceCallScreen from "@/screens/VoiceCallScreen";
import BroadcastChannelsScreen from "@/screens/BroadcastChannelsScreen";
import WalletScreen from "@/screens/WalletScreen";
import EditProfileScreen from "@/screens/EditProfileScreen";
import FollowersScreen from "@/screens/FollowersScreen";
import SavedPostsScreen from "@/screens/SavedPostsScreen";
import SettingsScreen from "@/screens/SettingsScreen";
import SearchScreen from "@/screens/SearchScreen";
import NetWorthPortfolioScreen from "@/screens/NetWorthPortfolioScreen";
import { SubscriptionsScreen } from "@/screens/SubscriptionsScreen";
import { CheckInScreen } from "@/screens/CheckInScreen";
import { SecuritySettingsScreen } from "@/screens/SecuritySettingsScreen";
import { AIFeaturesScreen } from "@/screens/AIFeaturesScreen";
import { DigitalWellnessScreen } from "@/screens/DigitalWellnessScreen";
import { ChatFoldersScreen } from "@/screens/ChatFoldersScreen";
import { SocialFeaturesScreen } from "@/screens/SocialFeaturesScreen";
import { PrivacyControlsScreen } from "@/screens/PrivacyControlsScreen";
import { DeveloperToolsScreen } from "@/screens/DeveloperToolsScreen";
import { DataExportScreen } from "@/screens/DataExportScreen";
import { ContentFeaturesScreen } from "@/screens/ContentFeaturesScreen";
// Onboarding flow screens
import InterestSelectionScreen from "@/screens/InterestSelectionScreen";
import IndustrySelectionScreen from "@/screens/IndustrySelectionScreen";
import NetWorthTierScreen from "@/screens/NetWorthTierScreen";
import SuggestedUsersScreen from "@/screens/SuggestedUsersScreen";
import WelcomeCompleteScreen from "@/screens/WelcomeCompleteScreen";
import ContentPreviewScreen from "@/screens/ContentPreviewScreen";
import AccountTypeScreen from "@/screens/AccountTypeScreen";
import PersonalSignupScreen from "@/screens/PersonalSignupScreen";
import CreatorSignupScreen from "@/screens/CreatorSignupScreen";
import BusinessSignupScreen from "@/screens/BusinessSignupScreen";
import CompleteProfileScreen from "@/screens/CompleteProfileScreen";
import LegalAgreementScreen from "@/screens/LegalAgreementScreen";
import VerifyOTPScreen from "@/screens/VerifyOTPScreen";
import EliteCircleScreen from "@/screens/EliteCircleScreen";
// Settings screens
import VerificationScreen from "@/screens/settings/VerificationScreen";
import DraftsScreen from "@/screens/settings/DraftsScreen";
import ScheduledPostsScreen from "@/screens/settings/ScheduledPostsScreen";
import PrivacySettingsScreen from "@/screens/settings/PrivacySettingsScreen";
import NotificationSettingsScreen from "@/screens/settings/NotificationSettingsScreen";
import MediaSettingsScreen from "@/screens/settings/MediaSettingsScreen";
import BlockedAccountsScreen from "@/screens/settings/BlockedAccountsScreen";
import DataAccountScreen from "@/screens/settings/DataAccountScreen";
// Studio screens
import StudioOverviewScreen from "@/screens/studio/StudioOverviewScreen";
import StudioAudienceScreen from "@/screens/studio/StudioAudienceScreen";
import StudioContentScreen from "@/screens/studio/StudioContentScreen";
import StudioPostDetailScreen from "@/screens/studio/StudioPostDetailScreen";
import BoostPostScreen from "@/screens/BoostPostScreen";
import AdWalletTopupScreen from "@/screens/AdWalletTopupScreen";
import AdWalletCheckoutScreen from "@/screens/AdWalletCheckoutScreen";
import MyBoostsScreen from "@/screens/MyBoostsScreen";
// Rabit Coins screens
import WealthClubScreen from "@/screens/WealthClubScreen";
import StakingScreen from "@/screens/StakingScreen";
import AchievementsScreen from "@/screens/AchievementsScreen";
import CreatorDashboardScreen from "@/screens/CreatorDashboardScreen";
import BattlesScreen from "@/screens/BattlesScreen";
import BankAccountsScreen from "@/screens/BankAccountsScreen";
import KYCScreen from "@/screens/KYCScreen";
import WithdrawalScreen from "@/screens/WithdrawalScreen";
import CoinCheckoutScreen from "@/screens/CoinCheckoutScreen";
import { HelpCenterScreen, SupportInboxScreen, TicketChatScreen, HelpArticleScreen, HelpCategoryScreen, FAQScreen, NewTicketScreen, FeatureRequestsScreen, SafetyCenterScreen } from "@/screens/help";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { useAuth } from "@/hooks/useAuth";
import { useOnboarding } from "@/hooks/useOnboarding";
import { View, StyleSheet } from "react-native";
import { LoadingIndicator } from "@/components/animations";
import { useTheme } from "@/hooks/useTheme";

interface UserWithStories {
  userId: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  stories: any[];
}

export type RootStackParamList = {
  Onboarding: undefined;
  ContentPreview: undefined;
  AccountType: undefined;
  Auth: { accountType?: string } | undefined;
  PersonalSignup: undefined;
  CreatorSignup: undefined;
  BusinessSignup: undefined;
  CompleteProfile: undefined;
  VerifyOTP: { email?: string; phoneNumber?: string; verificationType: "email" | "phone" };
  LegalAgreement: { fromSignup?: boolean };
  InterestSelection: undefined;
  IndustrySelection: undefined;
  NetWorthTier: undefined;
  EliteCircle: undefined;
  SuggestedUsers: undefined;
  WelcomeComplete: undefined;
  Main: undefined;
  Admin: undefined;
  CreatePost: { type?: string; autoMedia?: boolean } | undefined;
  Chat: { conversationId: string; otherUserId: string; otherUserName: string; scrollToMessageId?: string };
  ConversationSettings: { conversationId: string; otherUserId: string; otherUserName: string; otherUserAvatar?: string };
  MessageSearch: { conversationId: string; otherUserId?: string; otherUserName?: string };
  UserProfile: { userId: string };
  ProfilePage: { username: string };
  PostDetail: { postId: string };
  StoryComposer: undefined;
  StoryViewer: { users: UserWithStories[]; initialUserIndex: number; initialStoryIndex?: number };
  Reels: undefined;
  ExploreReels: { posts: any[]; initialIndex: number };
  ExplorePictures: { posts: any[]; initialIndex: number };
  VoiceReels: { initialIndex?: number };
  EditProfile: { tab?: string } | undefined;
  Followers: { userId: string; type: "followers" | "following" };
  SavedPosts: undefined;
  Settings: undefined;
  Search: { query?: string } | undefined;
  NetWorthPortfolio: { userId: string; username: string };
  ProfileReels: { userId: string; posts: any[]; initialIndex: number };
  LiveStream: { streamId?: string; isHost?: boolean };
  GoLive: undefined;
  Groups: undefined;
  GroupDetail: { groupId: string };
  Events: undefined;
  EventDetail: { eventId: string };
  GroupChat: { conversationId: string };
  VideoCall: { callId?: string; isIncoming?: boolean; otherUser?: any; callType?: "VIDEO" | "AUDIO" };
  VoiceCall: { callId?: string; isIncoming?: boolean; otherUser?: any; otherUserId: string };
  BroadcastChannels: undefined;
  BroadcastChannelDetail: { channelId: string };
  Wallet: undefined;
  Subscriptions: undefined;
  CheckIn: undefined;
  SecuritySettings: undefined;
  AIFeatures: undefined;
  DigitalWellness: undefined;
  ChatFolders: undefined;
  SocialFeatures: undefined;
  PrivacyControls: undefined;
  DeveloperTools: undefined;
  DataExport: undefined;
  ContentFeatures: undefined;
  // Settings screens
  Verification: undefined;
  Drafts: undefined;
  ScheduledPosts: undefined;
  PrivacySettings: undefined;
  NotificationSettings: undefined;
  MediaSettings: undefined;
  BlockedAccounts: undefined;
  DataAccount: undefined;
  // Studio screens
  Studio: undefined;
  StudioAudience: undefined;
  StudioContent: undefined;
  StudioPostDetail: { postId: string };
  // Advertising screens
  BoostPost: { postId: string; postContent?: string; postMediaUrl?: string; postType?: string };
  AdWalletTopup: undefined;
  AdWalletCheckout: {
    transactionId: string;
    paymentUrl: string;
    paymentData: any;
    topup: { amount: number; amountRands: number };
  };
  MyBoosts: undefined;
  // Rabit Coins screens
  WealthClub: undefined;
  Staking: undefined;
  Achievements: undefined;
  CreatorDashboard: undefined;
  Battles: undefined;
  BankAccounts: undefined;
  KYC: undefined;
  Withdrawal: undefined;
  CoinCheckout: {
    purchaseId: string;
    paymentUrl: string;
    paymentData: any;
    bundle: {
      name: string;
      coinAmount: number;
      bonusCoins: number;
      priceRands: number;
    };
  };
  // Help Center screens
  HelpCenter: undefined;
  SupportInbox: undefined;
  NewTicket: { category?: string; priority?: string } | undefined;
  TicketChat: { ticketId: string };
  HelpArticleDetail: { articleId: string };
  HelpCategory: { categoryId: string; categoryName: string };
  FAQs: undefined;
  FeatureRequests: undefined;
  SafetyCenter: undefined;
  CommunityQA: undefined;
  ReportBug: undefined;
  Appeals: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStackNavigator() {
  const screenOptions = useScreenOptions();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { hasSeenOnboarding, isLoading: onboardingLoading } = useOnboarding();
  const { theme } = useTheme();

  // Show loading during initial auth check or onboarding check
  if (authLoading || onboardingLoading) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.backgroundRoot }]}>
        <LoadingIndicator size="large" />
      </View>
    );
  }

  const showOnboarding = hasSeenOnboarding === false;
  const showAuth = !showOnboarding && !isAuthenticated;
  const showMain = !showOnboarding && isAuthenticated;

  // Use a key based on auth state to force React Navigation to completely
  // remount when switching between auth and main states
  const navigationKey = showOnboarding ? "onboarding" : showAuth ? "auth" : "main";

  return (
    <Stack.Navigator key={navigationKey} screenOptions={screenOptions}>
      {showOnboarding ? (
        <Stack.Screen
          name="Onboarding"
          component={OnboardingScreen}
          options={{ headerShown: false, animation: "fade" }}
        />
      ) : showAuth ? (
        <>
          <Stack.Screen
            name="ContentPreview"
            component={ContentPreviewScreen}
            options={{ headerShown: false, animation: "fade" }}
          />
          <Stack.Screen
            name="AccountType"
            component={AccountTypeScreen}
            options={{ headerShown: false, animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="Auth"
            component={AuthScreen}
            options={{ headerShown: false, animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="PersonalSignup"
            component={PersonalSignupScreen}
            options={{ headerShown: false, animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="CreatorSignup"
            component={CreatorSignupScreen}
            options={{ headerShown: false, animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="BusinessSignup"
            component={BusinessSignupScreen}
            options={{ headerShown: false, animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="CompleteProfile"
            component={CompleteProfileScreen}
            options={{ headerShown: false, animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="VerifyOTP"
            component={VerifyOTPScreen}
            options={{ headerShown: false, animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="LegalAgreement"
            component={LegalAgreementScreen}
            options={{ headerShown: false, animation: "slide_from_right" }}
          />
          {/* Onboarding Flow Screens - also in auth branch for new signups */}
          <Stack.Screen
            name="InterestSelection"
            component={InterestSelectionScreen}
            options={{ headerShown: false, animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="IndustrySelection"
            component={IndustrySelectionScreen}
            options={{ headerShown: false, animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="NetWorthTier"
            component={NetWorthTierScreen}
            options={{ headerShown: false, animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="SuggestedUsers"
            component={SuggestedUsersScreen}
            options={{ headerShown: false, animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="WelcomeComplete"
            component={WelcomeCompleteScreen}
            options={{ headerShown: false, animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="Main"
            component={MainTabNavigator}
            options={{ headerShown: false }}
          />
        </>
      ) : (
        <>
          <Stack.Screen
            name="Main"
            component={MainTabNavigator}
            options={{ headerShown: false }}
          />
          {/* Onboarding Flow Screens */}
          <Stack.Screen
            name="LegalAgreement"
            component={LegalAgreementScreen}
            options={{ headerShown: false, animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="InterestSelection"
            component={InterestSelectionScreen}
            options={{ headerShown: false, animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="IndustrySelection"
            component={IndustrySelectionScreen}
            options={{ headerShown: false, animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="NetWorthTier"
            component={NetWorthTierScreen}
            options={{ headerShown: false, animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="EliteCircle"
            component={EliteCircleScreen}
            options={{ headerShown: false, animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="SuggestedUsers"
            component={SuggestedUsersScreen}
            options={{ headerShown: false, animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="WelcomeComplete"
            component={WelcomeCompleteScreen}
            options={{ headerShown: false, animation: "fade" }}
          />
          <Stack.Screen
            name="CreatePost"
            component={CreatePostScreen}
            options={{
              presentation: "modal",
              title: "New Post",
              animation: "slide_from_bottom",
              animationDuration: 220,
            }}
          />
          <Stack.Screen
            name="Chat"
            component={ChatScreen}
            options={({ route }) => ({
              title: route.params.otherUserName,
              animation: "slide_from_right",
              animationDuration: 200,
            })}
          />
          <Stack.Screen
            name="ConversationSettings"
            component={ConversationSettingsScreen}
            options={{
              title: "Settings",
              animation: "slide_from_right",
              animationDuration: 200,
            }}
          />
          <Stack.Screen
            name="MessageSearch"
            component={MessageSearchScreen}
            options={{
              title: "Search Messages",
              animation: "slide_from_right",
              animationDuration: 200,
            }}
          />
          <Stack.Screen
            name="UserProfile"
            component={UserProfileScreen}
            options={{
              title: "Profile",
              animation: "slide_from_right",
              animationDuration: 200,
            }}
          />
          <Stack.Screen
            name="ProfilePage"
            component={ProfilePageScreen}
            options={{
              headerShown: false,
              animation: "ios_from_right",
              animationDuration: 220,
            }}
          />
          <Stack.Screen
            name="PostDetail"
            component={PostDetailScreen}
            options={{
              title: "Post",
              animation: "fade_from_bottom",
              animationDuration: 200,
            }}
          />
          <Stack.Screen
            name="Admin"
            component={AdminStackNavigator}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="StoryComposer"
            component={StoryComposerScreen}
            options={{
              presentation: "fullScreenModal",
              headerShown: false,
              animation: "slide_from_bottom",
              animationDuration: 220,
            }}
          />
          <Stack.Screen
            name="StoryViewer"
            component={StoryViewerScreen}
            options={{
              headerShown: false,
              animation: "fade",
            }}
          />
          <Stack.Screen
            name="Reels"
            component={ReelsScreen}
            options={{
              headerShown: false,
              animation: "slide_from_bottom",
            }}
          />
          <Stack.Screen
            name="ExploreReels"
            component={ExploreReelsScreen}
            options={{
              headerShown: false,
              animation: "slide_from_bottom",
            }}
          />
          <Stack.Screen
            name="ExplorePictures"
            component={ExplorePicturesScreen}
            options={{
              headerShown: false,
              animation: "slide_from_bottom",
            }}
          />
          <Stack.Screen
            name="VoiceReels"
            component={VoiceReelsScreen}
            options={{
              headerShown: false,
              animation: "slide_from_bottom",
            }}
          />
          <Stack.Screen
            name="ProfileReels"
            component={ProfileReelsScreen}
            options={{
              headerShown: false,
              animation: "slide_from_bottom",
            }}
          />
          <Stack.Screen
            name="LiveStream"
            component={LiveStreamScreen}
            options={{
              headerShown: false,
              animation: "slide_from_bottom",
            }}
          />
          <Stack.Screen
            name="GoLive"
            component={GoLiveScreen}
            options={{
              headerShown: false,
              animation: "slide_from_bottom",
            }}
          />
          <Stack.Screen
            name="Groups"
            component={GroupsScreen}
            options={{
              title: "Elite Circles",
              animation: "slide_from_right",
            }}
          />
          <Stack.Screen
            name="Events"
            component={EventsScreen}
            options={{
              title: "Events",
              animation: "slide_from_right",
            }}
          />
          <Stack.Screen
            name="GroupChat"
            component={GroupChatScreen}
            options={{
              title: "Group Chat",
              animation: "slide_from_right",
            }}
          />
          <Stack.Screen
            name="VideoCall"
            component={VideoCallScreen}
            options={{
              headerShown: false,
              presentation: "fullScreenModal",
              animation: "fade",
            }}
          />
          <Stack.Screen
            name="VoiceCall"
            component={VoiceCallScreen}
            options={{
              headerShown: false,
              presentation: "fullScreenModal",
              animation: "fade",
            }}
          />
          <Stack.Screen
            name="BroadcastChannels"
            component={BroadcastChannelsScreen}
            options={{
              title: "Channels",
              animation: "slide_from_right",
            }}
          />
          <Stack.Screen
            name="EditProfile"
            component={EditProfileScreen}
            options={{
              title: "Edit Profile",
              animation: "slide_from_right",
            }}
          />
          <Stack.Screen
            name="Followers"
            component={FollowersScreen}
            options={({ route }) => ({
              title: route.params.type === "followers" ? "Followers" : "Following",
              animation: "slide_from_right",
            })}
          />
          <Stack.Screen
            name="SavedPosts"
            component={SavedPostsScreen}
            options={{
              title: "Saved Posts",
              animation: "slide_from_right",
            }}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{
              title: "Settings",
              animation: "slide_from_right",
            }}
          />
          <Stack.Screen
            name="Search"
            component={SearchScreen}
            options={{
              title: "Search",
              animation: "slide_from_right",
            }}
          />
          <Stack.Screen
            name="NetWorthPortfolio"
            component={NetWorthPortfolioScreen}
            options={{
              title: "Net Worth",
              animation: "slide_from_right",
            }}
          />
          <Stack.Screen
            name="Wallet"
            component={WalletScreen}
            options={{
              title: "Wallet",
              animation: "slide_from_right",
            }}
          />
          <Stack.Screen
            name="Subscriptions"
            component={SubscriptionsScreen}
            options={{
              title: "Super Follows",
              animation: "slide_from_right",
            }}
          />
          <Stack.Screen
            name="CheckIn"
            component={CheckInScreen}
            options={{
              title: "Check In",
              animation: "slide_from_right",
            }}
          />
          <Stack.Screen
            name="SecuritySettings"
            component={SecuritySettingsScreen}
            options={{
              title: "Security & Privacy",
              animation: "slide_from_right",
            }}
          />
          <Stack.Screen
            name="AIFeatures"
            component={AIFeaturesScreen}
            options={{
              title: "AI Features",
              animation: "slide_from_right",
            }}
          />
          <Stack.Screen
            name="DigitalWellness"
            component={DigitalWellnessScreen}
            options={{
              title: "Digital Wellness",
              animation: "slide_from_right",
            }}
          />
          <Stack.Screen
            name="ChatFolders"
            component={ChatFoldersScreen}
            options={{
              title: "Chat Folders",
              animation: "slide_from_right",
            }}
          />
          <Stack.Screen
            name="SocialFeatures"
            component={SocialFeaturesScreen}
            options={{
              title: "Social",
              animation: "slide_from_right",
            }}
          />
          <Stack.Screen
            name="PrivacyControls"
            component={PrivacyControlsScreen}
            options={{
              title: "Privacy Controls",
              animation: "slide_from_right",
            }}
          />
          <Stack.Screen
            name="DeveloperTools"
            component={DeveloperToolsScreen}
            options={{
              title: "Developer Tools",
              animation: "slide_from_right",
            }}
          />
          <Stack.Screen
            name="DataExport"
            component={DataExportScreen}
            options={{
              title: "Data & Export",
              animation: "slide_from_right",
            }}
          />
          <Stack.Screen
            name="ContentFeatures"
            component={ContentFeaturesScreen}
            options={{
              title: "Content Features",
              animation: "slide_from_right",
            }}
          />
          {/* Settings Screens */}
          <Stack.Screen
            name="Verification"
            component={VerificationScreen}
            options={{
              title: "Verification",
              animation: "slide_from_right",
            }}
          />
          <Stack.Screen
            name="Drafts"
            component={DraftsScreen}
            options={{
              title: "Drafts",
              animation: "slide_from_right",
            }}
          />
          <Stack.Screen
            name="ScheduledPosts"
            component={ScheduledPostsScreen}
            options={{
              title: "Scheduled Posts",
              animation: "slide_from_right",
            }}
          />
          <Stack.Screen
            name="PrivacySettings"
            component={PrivacySettingsScreen}
            options={{
              title: "Privacy",
              animation: "slide_from_right",
            }}
          />
          <Stack.Screen
            name="NotificationSettings"
            component={NotificationSettingsScreen}
            options={{
              title: "Notifications",
              animation: "slide_from_right",
            }}
          />
          <Stack.Screen
            name="MediaSettings"
            component={MediaSettingsScreen}
            options={{
              title: "Media",
              animation: "slide_from_right",
            }}
          />
          <Stack.Screen
            name="BlockedAccounts"
            component={BlockedAccountsScreen}
            options={{
              title: "Blocked Accounts",
              animation: "slide_from_right",
            }}
          />
          <Stack.Screen
            name="DataAccount"
            component={DataAccountScreen}
            options={{
              title: "Your Data",
              animation: "slide_from_right",
            }}
          />
          {/* Studio Screens */}
          <Stack.Screen
            name="Studio"
            component={StudioOverviewScreen}
            options={{
              title: "Creator Studio",
              animation: "slide_from_right",
            }}
          />
          <Stack.Screen
            name="StudioAudience"
            component={StudioAudienceScreen}
            options={{
              title: "Audience",
              animation: "slide_from_right",
            }}
          />
          <Stack.Screen
            name="StudioContent"
            component={StudioContentScreen}
            options={{
              title: "Content",
              animation: "slide_from_right",
            }}
          />
          <Stack.Screen
            name="StudioPostDetail"
            component={StudioPostDetailScreen}
            options={{
              title: "Post Analytics",
              animation: "slide_from_right",
            }}
          />
          {/* Advertising Screens */}
          <Stack.Screen
            name="BoostPost"
            component={BoostPostScreen}
            options={{
              headerShown: false,
              presentation: "modal",
              animation: "slide_from_bottom",
            }}
          />
          <Stack.Screen
            name="AdWalletTopup"
            component={AdWalletTopupScreen}
            options={{
              headerShown: false,
              presentation: "modal",
              animation: "slide_from_bottom",
            }}
          />
          <Stack.Screen
            name="AdWalletCheckout"
            component={AdWalletCheckoutScreen}
            options={{
              headerShown: false,
              presentation: "modal",
              animation: "slide_from_bottom",
            }}
          />
          <Stack.Screen
            name="MyBoosts"
            component={MyBoostsScreen}
            options={{
              headerTitle: "My Boosts",
            }}
          />
          {/* Rabit Coins Screens */}
          <Stack.Screen
            name="WealthClub"
            component={WealthClubScreen}
            options={{
              title: "Wealth Club",
              animation: "slide_from_right",
            }}
          />
          <Stack.Screen
            name="Staking"
            component={StakingScreen}
            options={{
              title: "Staking",
              animation: "slide_from_right",
            }}
          />
          <Stack.Screen
            name="Achievements"
            component={AchievementsScreen}
            options={{
              title: "Achievements",
              animation: "slide_from_right",
            }}
          />
          <Stack.Screen
            name="CreatorDashboard"
            component={CreatorDashboardScreen}
            options={{
              title: "Creator Dashboard",
              animation: "slide_from_right",
            }}
          />
          <Stack.Screen
            name="Battles"
            component={BattlesScreen}
            options={{
              title: "Battles",
              animation: "slide_from_right",
            }}
          />
          <Stack.Screen
            name="BankAccounts"
            component={BankAccountsScreen}
            options={{
              title: "Bank Accounts",
              animation: "slide_from_right",
            }}
          />
          <Stack.Screen
            name="KYC"
            component={KYCScreen}
            options={{
              title: "Verification",
              animation: "slide_from_right",
            }}
          />
          <Stack.Screen
            name="Withdrawal"
            component={WithdrawalScreen}
            options={{
              title: "Withdraw",
              animation: "slide_from_right",
            }}
          />
          <Stack.Screen
            name="CoinCheckout"
            component={CoinCheckoutScreen}
            options={{
              headerShown: false,
              animation: "slide_from_bottom",
            }}
          />
          {/* Help Center Screens */}
          <Stack.Screen
            name="SupportInbox"
            component={SupportInboxScreen}
            options={{
              title: "Support Inbox",
              animation: "slide_from_right",
            }}
          />
          <Stack.Screen
            name="TicketChat"
            component={TicketChatScreen}
            options={{
              title: "Support Ticket",
              animation: "slide_from_right",
              animationDuration: 200,
            }}
          />
          <Stack.Screen
            name="NewTicket"
            component={NewTicketScreen}
            options={{
              title: "New Ticket",
              animation: "slide_from_right",
            }}
          />
          <Stack.Screen
            name="HelpArticleDetail"
            component={HelpArticleScreen}
            options={{
              title: "Help Article",
              animation: "slide_from_right",
            }}
          />
          <Stack.Screen
            name="FAQs"
            component={FAQScreen}
            options={{
              title: "FAQs",
              animation: "slide_from_right",
            }}
          />
          <Stack.Screen
            name="FeatureRequests"
            component={FeatureRequestsScreen}
            options={{
              title: "Feature Requests",
              animation: "slide_from_right",
            }}
          />
          <Stack.Screen
            name="HelpCenter"
            component={HelpCenterScreen}
            options={{
              title: "Help Center",
              animation: "slide_from_right",
            }}
          />
          <Stack.Screen
            name="HelpCategory"
            component={HelpCategoryScreen}
            options={{
              title: "Category",
              animation: "slide_from_right",
            }}
          />
          <Stack.Screen
            name="SafetyCenter"
            component={SafetyCenterScreen}
            options={{
              title: "Safety Center",
              animation: "slide_from_right",
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
