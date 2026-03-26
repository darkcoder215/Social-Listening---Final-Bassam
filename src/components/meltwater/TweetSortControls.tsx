import { Button } from '@/components/ui/button';
import { ArrowDownWideNarrow, ArrowUpNarrowWide, Clock, Zap, Heart, Repeat, MessageSquare, TrendingUp } from 'lucide-react';

export type SortKey = 'reach' | 'likes' | 'retweets' | 'replies' | 'recency' | 'engagement';
export type SortDirection = 'desc' | 'asc';

interface TweetSortControlsProps {
  activeSort: SortKey;
  onSortChange: (sort: SortKey) => void;
  direction?: SortDirection;
  onDirectionChange?: (dir: SortDirection) => void;
}

const sortOptions: { key: SortKey; label: string; icon: React.ReactNode }[] = [
  { key: 'reach', label: 'الوصول', icon: <Zap className="h-3 w-3" /> },
  { key: 'engagement', label: 'التفاعل', icon: <TrendingUp className="h-3 w-3" /> },
  { key: 'likes', label: 'الإعجابات', icon: <Heart className="h-3 w-3" /> },
  { key: 'retweets', label: 'إعادة التغريد', icon: <Repeat className="h-3 w-3" /> },
  { key: 'replies', label: 'الردود', icon: <MessageSquare className="h-3 w-3" /> },
  { key: 'recency', label: 'الوقت', icon: <Clock className="h-3 w-3" /> },
];

export const TweetSortControls = ({ activeSort, onSortChange, direction = 'desc', onDirectionChange }: TweetSortControlsProps) => {
  return (
    <div className="flex items-center gap-2 flex-wrap mb-3">
      <span className="text-xs text-muted-foreground flex items-center gap-1">
        <ArrowDownWideNarrow className="h-3 w-3" />
        ترتيب:
      </span>
      {sortOptions.map(opt => (
        <Button
          key={opt.key}
          variant={activeSort === opt.key ? 'default' : 'outline'}
          size="sm"
          onClick={() => onSortChange(opt.key)}
          className={`text-xs gap-1 h-7 ${activeSort === opt.key ? 'bg-foreground text-primary-foreground' : ''}`}
        >
          {opt.icon}
          {opt.label}
        </Button>
      ))}
      {onDirectionChange && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDirectionChange(direction === 'desc' ? 'asc' : 'desc')}
          className="text-xs gap-1 h-7 border border-border font-bold"
        >
          {direction === 'desc' ? (
            <><ArrowDownWideNarrow className="h-3 w-3" /> تنازلي</>
          ) : (
            <><ArrowUpNarrowWide className="h-3 w-3" /> تصاعدي</>
          )}
        </Button>
      )}
    </div>
  );
};

export interface TweetWithEngagement {
  id: number;
  text: string;
  author: string;
  sentiment: string;
  emotion: string;
  keywords: string[];
  reach: number;
  engagement?: { likes: number; retweets: number; replies: number };
  timestamp?: string;
}

const getTotalEngagement = (t: TweetWithEngagement) =>
  (t.engagement?.likes || 0) + (t.engagement?.retweets || 0) + (t.engagement?.replies || 0);

export const sortTweets = (tweets: TweetWithEngagement[], sortKey: SortKey, direction: SortDirection = 'desc'): TweetWithEngagement[] => {
  const mult = direction === 'desc' ? 1 : -1;
  return [...tweets].sort((a, b) => {
    switch (sortKey) {
      case 'reach':
        return mult * (b.reach - a.reach);
      case 'engagement':
        return mult * (getTotalEngagement(b) - getTotalEngagement(a));
      case 'likes':
        return mult * ((b.engagement?.likes || 0) - (a.engagement?.likes || 0));
      case 'retweets':
        return mult * ((b.engagement?.retweets || 0) - (a.engagement?.retweets || 0));
      case 'replies':
        return mult * ((b.engagement?.replies || 0) - (a.engagement?.replies || 0));
      case 'recency':
        return mult * (b.id - a.id);
      default:
        return 0;
    }
  });
};
