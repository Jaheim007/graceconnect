import { useState } from 'react';
import { Smile } from 'lucide-react';
import { cn } from '@/lib/utils';

const EMOJI_CATEGORIES = [
  {
    label: '😊 Smileys',
    emojis: ['😀','😃','😄','😁','😅','😂','🤣','😊','😇','🥰','😍','🤩','😘','😋','😜','🤪','😎','🤗','🤔','🤫','🤭','😏','😌','😴','🥳','😤','😠','😢','😭','🥺','😱','😰','🤯','😬','🙄','😷','🤒','🤕','🤢','🤮','🥵','🥶','😈','👿','💀','☠️','👻','👽','🤖'],
  },
  {
    label: '👋 Mains',
    emojis: ['👋','🤚','🖐️','✋','🖖','👌','🤌','🤏','✌️','🤞','🤟','🤘','🤙','👈','👉','👆','👇','☝️','👍','👎','✊','👊','🤛','🤜','👏','🙌','👐','🤲','🤝','🙏'],
  },
  {
    label: '❤️ Cœurs',
    emojis: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖','💘','💝','💟','♥️','🫶','✨','⭐','🌟','💫','🔥','💯','🎉','🎊','🏆','🥇','🎯','💎','👑','🌈'],
  },
  {
    label: '📌 Objets',
    emojis: ['📌','📍','📎','🔗','📝','✏️','📖','📚','💡','🔔','📢','📣','💬','💭','🗨️','📧','📨','📩','📮','📦','🏷️','🔖','📋','📁','📂','🗂️','📊','📈','📉','🗓️','📅','⏰','🕐','⏳','🔑','🔒','🔓'],
  },
];

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
}

export function EmojiPicker({ onSelect }: EmojiPickerProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        title="Emoji"
        className={cn(
          'h-7 w-7 rounded flex items-center justify-center transition-colors',
          open ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground hover:text-foreground'
        )}
      >
        <Smile className="h-3.5 w-3.5" />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-card border border-border rounded-lg shadow-lg w-[280px]">
          {/* Category tabs */}
          <div className="flex border-b border-border px-1 pt-1 gap-0.5">
            {EMOJI_CATEGORIES.map((cat, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActiveTab(i)}
                className={cn(
                  'text-xs px-2 py-1 rounded-t transition-colors',
                  activeTab === i ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {cat.emojis[0]}
              </button>
            ))}
          </div>
          {/* Emoji grid */}
          <div className="p-2 grid grid-cols-8 gap-0.5 max-h-[200px] overflow-y-auto">
            {EMOJI_CATEGORIES[activeTab].emojis.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => { onSelect(emoji); setOpen(false); }}
                className="h-7 w-7 flex items-center justify-center rounded hover:bg-muted text-base transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
