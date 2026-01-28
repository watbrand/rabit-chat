import React from 'react';
import { View, StyleSheet } from 'react-native';
import PollSticker from './PollSticker';
import QuestionSticker from './QuestionSticker';
import SliderSticker from './SliderSticker';
import QuizSticker from './QuizSticker';
import CountdownSticker from './CountdownSticker';
import TipSticker from './TipSticker';
import LocationSticker from './LocationSticker';
import MentionSticker from './MentionSticker';
import HashtagSticker from './HashtagSticker';
import LinkSticker from './LinkSticker';
import GifSticker from './GifSticker';
import ShoppingSticker from './ShoppingSticker';
import TimeSticker from './TimeSticker';
import type { StickerType } from '../StickerTray';

export interface StickerData {
  id: string;
  type: StickerType;
  position: { x: number; y: number };
  rotation?: number;
  scale?: number;
  data: any;
}

interface Props {
  sticker: StickerData;
  isOwner?: boolean;
  onInteract?: (stickerId: string, action: string, payload?: any) => void;
}

export default function StickerRenderer({ sticker, isOwner, onInteract }: Props) {
  const handleInteraction = (action: string, payload?: any) => {
    onInteract?.(sticker.id, action, payload);
  };

  const renderSticker = () => {
    const { type, data } = sticker;

    switch (type) {
      case 'POLL':
        return (
          <PollSticker
            question={data.question || 'Poll Question'}
            options={data.options || [
              { id: '1', text: 'Option 1', votes: 0 },
              { id: '2', text: 'Option 2', votes: 0 },
            ]}
            totalVotes={data.totalVotes || 0}
            userVote={data.userVote}
            isOwner={isOwner}
            onVote={(optionId) => handleInteraction('vote', { optionId })}
          />
        );

      case 'QUESTION':
        return (
          <QuestionSticker
            question={data.question || 'Ask me anything...'}
            responseCount={data.responseCount || 0}
            isOwner={isOwner}
            onSubmit={(answer) => handleInteraction('respond', { answer })}
            onViewResponses={() => handleInteraction('view_responses')}
          />
        );

      case 'SLIDER':
        return (
          <SliderSticker
            question={data.question || 'Rate this'}
            emoji={data.emoji || '❤️'}
            averageValue={data.averageValue}
            responseCount={data.responseCount || 0}
            userValue={data.userValue}
            isOwner={isOwner}
            onSubmit={(value) => handleInteraction('slide', { value })}
          />
        );

      case 'QUIZ':
        return (
          <QuizSticker
            question={data.question || 'Quiz Time!'}
            options={data.options || [
              { id: '1', text: 'Option A', isCorrect: true },
              { id: '2', text: 'Option B', isCorrect: false },
            ]}
            userAnswer={data.userAnswer}
            correctPercentage={data.correctPercentage}
            onAnswer={(optionId) => handleInteraction('answer', { optionId })}
          />
        );

      case 'COUNTDOWN':
        return (
          <CountdownSticker
            title={data.title || 'Event'}
            endTime={new Date(data.endTime || Date.now() + 86400000)}
            subscriberCount={data.subscriberCount}
            isSubscribed={data.isSubscribed}
            onSubscribe={() => handleInteraction('subscribe')}
          />
        );

      case 'TIP':
        return (
          <TipSticker
            recipientName={data.recipientName || 'Creator'}
            totalTips={data.totalTips || 0}
            tipCount={data.tipCount || 0}
            isOwner={isOwner}
            onTip={(amount) => handleInteraction('tip', { amount })}
          />
        );

      case 'LOCATION':
        return (
          <LocationSticker
            locationName={data.locationName || data.placeName}
            coordinates={data.coordinates}
            onPress={() => handleInteraction('view_location')}
          />
        );

      case 'MENTION':
        return (
          <MentionSticker
            mentionedUser={data.mentionedUser}
            onPress={() => handleInteraction('view_profile', { userId: data.mentionedUser?.id })}
          />
        );

      case 'HASHTAG':
        return (
          <HashtagSticker
            hashtag={data.hashtag || 'trending'}
            onPress={() => handleInteraction('view_hashtag', { hashtag: data.hashtag })}
          />
        );

      case 'LINK':
        return (
          <LinkSticker
            url={data.url || 'https://example.com'}
            label={data.label}
            onPress={() => handleInteraction('open_link', { url: data.url })}
          />
        );

      case 'GIF':
        return (
          <GifSticker
            gifUrl={data.gifUrl}
            onPress={() => handleInteraction('view_gif')}
          />
        );

      case 'SHOPPING':
        return (
          <ShoppingSticker
            product={data.product}
            onPress={() => handleInteraction('view_product', { productId: data.product?.id })}
          />
        );

      case 'TIME':
        return (
          <TimeSticker
            format={data.format || 'datetime'}
            style={data.style || 'minimal'}
          />
        );

      default:
        return null;
    }
  };

  return (
    <View
      style={[
        styles.wrapper,
        {
          left: sticker.position.x,
          top: sticker.position.y,
          transform: [
            { rotate: `${sticker.rotation || 0}deg` },
            { scale: sticker.scale || 1 },
          ],
        },
      ]}
    >
      {renderSticker()}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
  },
});
