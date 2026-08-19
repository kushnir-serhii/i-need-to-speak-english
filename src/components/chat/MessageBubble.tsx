'use client';

import type { Message } from '@/store/useChatStore';
import { MessageMenu } from './MessageMenu';
import { PiSpeakerHighBold } from 'react-icons/pi';

interface MessageBubbleProps {
  message: Message;
  role: Message['role'];
  isSpeaking?: boolean;
  onDelete: () => void;
  ttsEnabled?: boolean;
  onRepeat?: () => void;
  ttsSpeed?: number;
  onSpeedChange?: (speed: number) => void;
  voices?: SpeechSynthesisVoice[];
  selectedVoiceURI?: string | null;
  onVoiceChange?: (uri: string) => void;
}

export function MessageBubble({
  message,
  role,
  isSpeaking = false,
  onDelete,
  ttsEnabled = false,
  onRepeat,
  ttsSpeed = 1,
  onSpeedChange = () => {},
  voices = [],
  selectedVoiceURI = null,
  onVoiceChange = () => {},
}: MessageBubbleProps) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="relative ml-auto flex max-w-[75%] flex-row items-center gap-3 rounded-2xl rounded-br-sm bg-[#2F81F7] px-4 py-2.5 text-sm wrap-break-word whitespace-pre-wrap text-white">
        <MessageMenu
          content={message.content}
          onDelete={onDelete}
          side="left"
          role="user"
          ttsEnabled={ttsEnabled}
          onRepeat={onRepeat ?? (() => {})}
          ttsSpeed={ttsSpeed}
          onSpeedChange={onSpeedChange}
          voices={voices}
          selectedVoiceURI={selectedVoiceURI}
          onVoiceChange={onVoiceChange}
        />
        <p>{message.content}</p>
      </div>
    );
  }

  const borderClass = isSpeaking ? 'border-[#2F81F7]' : 'border-[#30363D]';

  return (
    <div
      className={`relative mr-auto flex max-w-[75%] flex-row items-start gap-3 rounded-2xl rounded-bl-sm border bg-[#161B22] px-4 py-2.5 text-sm text-white ${borderClass} wrap-break-word whitespace-pre-wrap`}
    >
      <p>{message.content}</p>
      {isSpeaking ? (
        <PiSpeakerHighBold
        className="w-6 h-6 animate-pulse text-[#2F81F7]"
        aria-hidden="true"
        />
      ) : (
        <MessageMenu
          content={message.content}
          onDelete={onDelete}
          role="assistant"
          side="right"
          ttsEnabled={ttsEnabled}
          onRepeat={onRepeat ?? (() => {})}
          ttsSpeed={ttsSpeed}
          onSpeedChange={onSpeedChange}
          voices={voices}
          selectedVoiceURI={selectedVoiceURI}
          onVoiceChange={onVoiceChange}
        />
      )}
    </div>
  );
}
