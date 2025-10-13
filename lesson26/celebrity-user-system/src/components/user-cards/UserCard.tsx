import React from 'react';
import { User, UserTier } from '../../types';
import { Crown, Star, User as UserIcon } from 'lucide-react';

interface UserCardProps {
  user: User;
  onTweet: (userId: string, content: string) => void;
}

const UserCard: React.FC<UserCardProps> = ({ user, onTweet }) => {
  const [tweetContent, setTweetContent] = React.useState('');

  const getTierIcon = (tier: UserTier) => {
    switch (tier) {
      case UserTier.CELEBRITY:
        return <Crown className="w-5 h-5 text-yellow-500" />;
      case UserTier.POPULAR:
        return <Star className="w-5 h-5 text-blue-500" />;
      default:
        return <UserIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTierColor = (tier: UserTier) => {
    switch (tier) {
      case UserTier.CELEBRITY:
        return 'border-yellow-300 bg-yellow-50';
      case UserTier.POPULAR:
        return 'border-blue-300 bg-blue-50';
      default:
        return 'border-gray-300 bg-white';
    }
  };

  const handleTweet = () => {
    if (tweetContent.trim()) {
      onTweet(user.id, tweetContent);
      setTweetContent('');
    }
  };

  return (
    <div className={`p-4 rounded-lg border-2 ${getTierColor(user.tier)} shadow-sm transition-all hover:shadow-md`}>
      <div className="flex items-center gap-2 mb-3">
        {getTierIcon(user.tier)}
        <div>
          <h3 className="font-semibold text-gray-800">@{user.username}</h3>
          <p className="text-sm text-gray-600">{user.tier.toUpperCase()}</p>
        </div>
        {user.verified && <span className="text-blue-500">✓</span>}
      </div>
      
      <div className="space-y-2 text-sm text-gray-600 mb-4">
        <div className="flex justify-between">
          <span>Followers:</span>
          <span className="font-medium">{user.followerCount.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span>Engagement:</span>
          <span className="font-medium">{user.engagementRate}%</span>
        </div>
        <div className="flex justify-between">
          <span>Influence:</span>
          <span className="font-medium">{(user.influenceScore * 100).toFixed(1)}%</span>
        </div>
      </div>
      
      <div className="space-y-2">
        <textarea
          value={tweetContent}
          onChange={(e) => setTweetContent(e.target.value)}
          placeholder="What's happening?"
          className="w-full p-2 border border-gray-300 rounded text-sm resize-none"
          rows={2}
          maxLength={280}
        />
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">{tweetContent.length}/280</span>
          <button
            onClick={handleTweet}
            disabled={!tweetContent.trim()}
            className="px-4 py-1 bg-blue-500 text-white rounded text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
          >
            Tweet
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserCard;
