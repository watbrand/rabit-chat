import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  Pressable, 
  Text, 
  Dimensions,
  Image,
  SafeAreaView,
  Alert,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { Video, ResizeMode, Audio } from 'expo-av';
import Haptics from "@/lib/safeHaptics";
import { Feather } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { LinearGradient } from 'expo-linear-gradient';
import StoryColorPicker, { ColorOption } from './StoryColorPicker';
import StoryFontPicker, { FontFamily } from './StoryFontPicker';
import StoryTextAnimationPicker, { TextAnimation } from './StoryTextAnimationPicker';
import StoryFilterPicker, { FilterType, getFilterStyle } from './StoryFilterPicker';
import StoryDrawingTool from './StoryDrawingTool';
import MusicPickerModal, { MusicTrackData } from '@/components/MusicPickerModal';
import StickerTray, { StickerType } from './StickerTray';

type StoryType = 'TEXT' | 'PHOTO' | 'VIDEO' | 'VOICE';

interface DrawPath {
  id: string;
  d: string;
  color: string;
  strokeWidth: number;
  opacity: number;
}

interface Sticker {
  id: string;
  type: StickerType;
  position: { x: number; y: number };
  rotation: number;
  scale: number;
  data: any;
}

interface StoryEditorData {
  type: StoryType;
  content?: string;
  mediaUri?: string;
  colors: ColorOption;
  font: FontFamily;
  fontSize: number;
  animation: TextAnimation;
  filter: FilterType;
  drawPaths: DrawPath[];
  stickers: Sticker[];
  music?: MusicTrackData;
  musicStartTime?: number;
  musicEndTime?: number;
  voiceUri?: string;
  voiceDuration?: number;
}

interface Props {
  initialType: StoryType;
  initialMediaUri?: string;
  initialContent?: string;
  onSave: (data: StoryEditorData) => void;
  onCancel: () => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const DEFAULT_COLOR: ColorOption = {
  id: 'purple',
  type: 'solid',
  value: Colors.dark.primary,
  name: 'Royal Purple',
};

export default function UniversalStoryEditor({ 
  initialType, 
  initialMediaUri, 
  initialContent,
  onSave, 
  onCancel,
}: Props) {
  const [storyType] = useState<StoryType>(initialType);
  const [content, setContent] = useState(initialContent || '');
  const [mediaUri] = useState(initialMediaUri);
  
  const [colors, setColors] = useState<ColorOption>(DEFAULT_COLOR);
  const [font, setFont] = useState<FontFamily>('POPPINS');
  const [fontSize, setFontSize] = useState(24);
  const [animation, setAnimation] = useState<TextAnimation>('NONE');
  const [filter, setFilter] = useState<FilterType>('NONE');
  const [drawPaths, setDrawPaths] = useState<DrawPath[]>([]);
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [music, setMusic] = useState<MusicTrackData | undefined>();
  const [musicStartTime, setMusicStartTime] = useState<number>(0);
  const [musicEndTime, setMusicEndTime] = useState<number>(15);
  const [showMusicPicker, setShowMusicPicker] = useState(false);
  
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [isVoicePlaying, setIsVoicePlaying] = useState(false);
  const [voiceProgress, setVoiceProgress] = useState(0);
  const [voiceDuration, setVoiceDuration] = useState(0);
  
  const videoRef = useRef<Video>(null);
  const voiceSoundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    return () => {
      if (voiceSoundRef.current) {
        voiceSoundRef.current.unloadAsync();
      }
    };
  }, []);

  const toggleVoicePlayback = async () => {
    if (!mediaUri || storyType !== 'VOICE') return;

    try {
      if (isVoicePlaying && voiceSoundRef.current) {
        await voiceSoundRef.current.pauseAsync();
        setIsVoicePlaying(false);
        return;
      }

      if (voiceSoundRef.current) {
        await voiceSoundRef.current.playAsync();
        setIsVoicePlaying(true);
        return;
      }

      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
      const { sound } = await Audio.Sound.createAsync(
        { uri: mediaUri },
        { shouldPlay: true }
      );
      voiceSoundRef.current = sound;
      setIsVoicePlaying(true);

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          if (status.durationMillis) {
            setVoiceDuration(status.durationMillis);
          }
          if (status.positionMillis && status.durationMillis) {
            setVoiceProgress((status.positionMillis / status.durationMillis) * 100);
          }
          if (status.didJustFinish) {
            setIsVoicePlaying(false);
            setVoiceProgress(0);
          }
        }
      });
    } catch (error) {
      console.error('Voice playback error:', error);
    }
  };

  const formatTime = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const togglePanel = (panel: string) => {
    if (activePanel === panel) {
      setActivePanel(null);
    } else {
      setActivePanel(panel);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleColorSelect = (color: ColorOption) => {
    setColors(color);
    setActivePanel(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleFontSelect = (newFont: FontFamily) => {
    setFont(newFont);
  };

  const handleFontSizeChange = (newSize: number) => {
    setFontSize(newSize);
  };

  const handleAnimationSelect = (anim: TextAnimation) => {
    setAnimation(anim);
    setActivePanel(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleFilterSelect = (newFilter: FilterType) => {
    setFilter(newFilter);
    setActivePanel(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleDrawingSave = (paths: DrawPath[]) => {
    setDrawPaths(paths);
    setIsDrawingMode(false);
  };

  const handleStickerAdd = (stickerType: StickerType) => {
    const newSticker: Sticker = {
      id: `sticker-${Date.now()}`,
      type: stickerType,
      position: { x: SCREEN_WIDTH / 2 - 50, y: SCREEN_HEIGHT / 2 - 50 },
      rotation: 0,
      scale: 1,
      data: {},
    };
    setStickers([...stickers, newSticker]);
    setActivePanel(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleMusicSelect = (track: MusicTrackData, clipStart: number, clipEnd: number) => {
    console.log('[UniversalStoryEditor] Music selected:', track.title, 'clip:', clipStart, '-', clipEnd);
    setMusic(track);
    setMusicStartTime(clipStart);
    setMusicEndTime(clipEnd);
    setShowMusicPicker(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleMusicRemove = () => {
    setMusic(undefined);
    setMusicStartTime(0);
    setMusicEndTime(15);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const formatDurationShort = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSave = () => {
    const data: StoryEditorData = {
      type: storyType,
      content: storyType === 'TEXT' ? content : undefined,
      mediaUri,
      colors,
      font,
      fontSize,
      animation,
      filter,
      drawPaths,
      stickers,
      music,
      musicStartTime: music ? musicStartTime : undefined,
      musicEndTime: music ? musicEndTime : undefined,
    };
    
    console.log('[UniversalStoryEditor] Saving with music:', music?.title, 'clip:', musicStartTime, '-', musicEndTime);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSave(data);
  };

  const handleCancel = () => {
    if (drawPaths.length > 0 || stickers.length > 0 || content) {
      Alert.alert(
        'Discard Changes?',
        'You have unsaved changes. Are you sure you want to discard them?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: onCancel },
        ]
      );
    } else {
      onCancel();
    }
  };

  const getFontFamilyStyle = (fontId: FontFamily): string => {
    switch (fontId) {
      case 'POPPINS': return 'Poppins_400Regular';
      case 'PLAYFAIR': return 'PlayfairDisplay_400Regular';
      case 'SPACE_MONO': return 'SpaceMono_400Regular';
      case 'DANCING_SCRIPT': return 'DancingScript_400Regular';
      case 'BEBAS_NEUE': return 'BebasNeue_400Regular';
      default: return 'Poppins_400Regular';
    }
  };

  const renderBackground = () => {
    if (storyType === 'PHOTO' && mediaUri) {
      return (
        <View style={[styles.background, getFilterStyle(filter)]}>
          <Image source={{ uri: mediaUri }} style={styles.mediaImage} resizeMode="cover" />
        </View>
      );
    }
    
    if (storyType === 'VIDEO' && mediaUri) {
      return (
        <View style={[styles.background, getFilterStyle(filter)]}>
          <Video
            ref={videoRef}
            source={{ uri: mediaUri }}
            style={styles.mediaVideo}
            resizeMode={ResizeMode.COVER}
            isLooping
            shouldPlay
            isMuted={!!music}
          />
        </View>
      );
    }
    
    if (colors.type === 'gradient' && colors.gradient) {
      return (
        <LinearGradient
          colors={colors.gradient as [string, string]}
          style={styles.background}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      );
    }
    
    return <View style={[styles.background, { backgroundColor: colors.value }]} />;
  };

  const renderToolbar = () => (
    <View style={styles.toolbar}>
      {(storyType === 'TEXT' || storyType === 'VOICE') ? (
        <ToolButton 
          icon="droplet" 
          onPress={() => togglePanel('colors')} 
          isActive={activePanel === 'colors'}
        />
      ) : null}
      
      {storyType === 'TEXT' ? (
        <>
          <ToolButton 
            icon="type" 
            onPress={() => togglePanel('font')} 
            isActive={activePanel === 'font'}
          />
          <ToolButton 
            icon="zap" 
            onPress={() => togglePanel('animation')} 
            isActive={activePanel === 'animation'}
          />
        </>
      ) : null}
      
      {(storyType === 'PHOTO' || storyType === 'VIDEO') ? (
        <ToolButton 
          icon="sliders" 
          onPress={() => togglePanel('filter')} 
          isActive={activePanel === 'filter'}
        />
      ) : null}
      
      <ToolButton 
        icon="edit-3" 
        onPress={() => setIsDrawingMode(true)} 
        isActive={isDrawingMode}
      />
      
      <ToolButton 
        icon="smile" 
        onPress={() => togglePanel('stickers')} 
        isActive={activePanel === 'stickers'}
      />
      
      <ToolButton 
        icon="music" 
        onPress={() => setShowMusicPicker(true)} 
        isActive={showMusicPicker || !!music}
        badge={music ? '1' : undefined}
      />
    </View>
  );

  if (isDrawingMode) {
    return (
      <View style={styles.container}>
        {renderBackground()}
        <StoryDrawingTool
          onSave={handleDrawingSave}
          onClose={() => setIsDrawingMode(false)}
          initialPaths={drawPaths}
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding" keyboardVerticalOffset={0}>
      <SafeAreaView style={styles.container}>
        {renderBackground()}
      
      <View style={styles.header}>
        <Pressable onPress={handleCancel} style={styles.headerButton}>
          <Feather name="x" size={24} color="#fff" />
        </Pressable>
        
        {renderToolbar()}
        
        <Pressable onPress={handleSave} style={styles.nextButton}>
          <Text style={styles.nextText}>Next</Text>
          <Feather name="chevron-right" size={18} color="#fff" />
        </Pressable>
      </View>
      
      <View style={styles.contentArea}>
        {storyType === 'TEXT' ? (
          <Text style={[
            styles.textContent,
            {
              fontFamily: getFontFamilyStyle(font),
              fontSize,
              color: '#fff',
            }
          ]}>
            {content || 'Tap to add text...'}
          </Text>
        ) : null}

        {storyType === 'VOICE' && mediaUri ? (
          <View style={styles.voicePreviewContainer}>
            <View style={styles.voiceWaveformPlaceholder}>
              {Array(12).fill(0).map((_, i) => (
                <View 
                  key={i} 
                  style={[
                    styles.waveBar,
                    { 
                      height: 10 + Math.random() * 30,
                      backgroundColor: isVoicePlaying ? Colors.dark.primary : 'rgba(255,255,255,0.5)',
                    }
                  ]} 
                />
              ))}
            </View>
            
            <Pressable onPress={toggleVoicePlayback} style={styles.voicePlayButton}>
              <Feather 
                name={isVoicePlaying ? 'pause' : 'play'} 
                size={32} 
                color="#fff" 
              />
            </Pressable>
            
            <View style={styles.voiceProgressContainer}>
              <View style={styles.voiceProgressBar}>
                <View 
                  style={[
                    styles.voiceProgressFill, 
                    { width: `${voiceProgress}%` }
                  ]} 
                />
              </View>
              <Text style={styles.voiceDurationText}>
                {formatTime(voiceDuration * (voiceProgress / 100))} / {formatTime(voiceDuration)}
              </Text>
            </View>
            
            <Text style={styles.voicePreviewLabel}>Tap to preview your recording</Text>
          </View>
        ) : null}
        
        {music ? (
          <View style={styles.musicIndicatorBar}>
            <View style={styles.musicIndicatorContent}>
              {music.coverUrl ? (
                <Image source={{ uri: music.coverUrl }} style={styles.musicIndicatorCover} />
              ) : (
                <View style={[styles.musicIndicatorCover, styles.musicIndicatorCoverPlaceholder]}>
                  <Feather name="music" size={12} color="#fff" />
                </View>
              )}
              <View style={styles.musicIndicatorInfo}>
                <Text style={styles.musicIndicatorTitle} numberOfLines={1}>
                  {music.title}
                </Text>
                <Text style={styles.musicIndicatorArtist} numberOfLines={1}>
                  {music.artist} • {formatDurationShort(music.duration)}
                </Text>
              </View>
            </View>
            <Pressable onPress={handleMusicRemove} style={styles.musicIndicatorRemove}>
              <Feather name="x" size={16} color="#fff" />
            </Pressable>
          </View>
        ) : null}
        
        {stickers.map((sticker) => (
          <View
            key={sticker.id}
            style={[
              styles.stickerWrapper,
              {
                left: sticker.position.x,
                top: sticker.position.y,
                transform: [
                  { rotate: `${sticker.rotation}deg` },
                  { scale: sticker.scale },
                ],
              },
            ]}
          >
            <View style={styles.stickerPlaceholder}>
              <Text style={styles.stickerType}>{sticker.type}</Text>
            </View>
          </View>
        ))}
      </View>

      {activePanel === 'colors' ? (
        <View style={styles.panel}>
          <StoryColorPicker
            selectedColor={colors.id}
            onColorSelect={handleColorSelect}
          />
        </View>
      ) : null}

      {activePanel === 'font' ? (
        <View style={styles.panel}>
          <StoryFontPicker
            selectedFont={font}
            fontSize={fontSize}
            onFontSelect={handleFontSelect}
            onFontSizeChange={handleFontSizeChange}
          />
        </View>
      ) : null}

      {activePanel === 'animation' ? (
        <View style={styles.panel}>
          <StoryTextAnimationPicker
            selectedAnimation={animation}
            onAnimationSelect={handleAnimationSelect}
          />
        </View>
      ) : null}

      {activePanel === 'filter' ? (
        <View style={styles.panel}>
          <StoryFilterPicker
            selectedFilter={filter}
            onFilterSelect={handleFilterSelect}
          />
        </View>
      ) : null}

      {activePanel === 'stickers' ? (
        <View style={styles.panel}>
          <StickerTray 
            onSelectSticker={handleStickerAdd} 
            onClose={() => setActivePanel(null)}
          />
        </View>
      ) : null}

      <MusicPickerModal
        visible={showMusicPicker}
        onSelect={handleMusicSelect}
        onClose={() => setShowMusicPicker(false)}
      />
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

function ToolButton({ 
  icon, 
  onPress, 
  isActive,
  badge,
}: { 
  icon: string; 
  onPress: () => void; 
  isActive?: boolean;
  badge?: string;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.toolButton, isActive && styles.toolButtonActive]}>
      <Feather name={icon as any} size={20} color="#fff" />
      {badge ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  mediaVideo: {
    width: '100%',
    height: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    zIndex: 10,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toolbar: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  toolButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  toolButtonActive: {
    backgroundColor: Colors.dark.primary,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.dark.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 20,
    gap: 4,
  },
  nextText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  contentArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  textContent: {
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  musicIndicatorBar: {
    position: 'absolute',
    bottom: 80,
    left: Spacing.md,
    right: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  musicIndicatorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.sm,
  },
  musicIndicatorCover: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.xs,
  },
  musicIndicatorCoverPlaceholder: {
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  musicIndicatorInfo: {
    flex: 1,
  },
  musicIndicatorTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  musicIndicatorArtist: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 1,
  },
  musicIndicatorRemove: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.xs,
  },
  stickerWrapper: {
    position: 'absolute',
  },
  stickerPlaceholder: {
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
    padding: Spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.dark.primary,
  },
  stickerType: {
    fontSize: 12,
    color: '#fff',
    textTransform: 'capitalize',
  },
  panel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: SCREEN_HEIGHT * 0.4,
    overflow: 'hidden',
  },
  voicePreviewContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
  },
  voiceWaveformPlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
    gap: 4,
  },
  waveBar: {
    width: 4,
    borderRadius: 2,
  },
  voicePlayButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.dark.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceProgressContainer: {
    alignItems: 'center',
    gap: Spacing.xs,
    width: '80%',
  },
  voiceProgressBar: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  voiceProgressFill: {
    height: '100%',
    backgroundColor: Colors.dark.primary,
    borderRadius: 2,
  },
  voiceDurationText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    fontVariant: ['tabular-nums'],
  },
  voicePreviewLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: Spacing.sm,
  },
});
