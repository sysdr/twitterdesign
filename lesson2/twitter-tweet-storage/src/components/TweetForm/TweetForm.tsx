import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { createTweet } from '../../api/client';
import { Image, Send, X } from 'lucide-react';

interface TweetFormProps {
  onTweetCreated?: () => void;
}

export const TweetForm: React.FC<TweetFormProps> = ({ onTweetCreated }) => {
  const [content, setContent] = useState('');
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [authorUsername, setAuthorUsername] = useState('demo_user');

  const createTweetMutation = useMutation({
    mutationFn: createTweet,
    onSuccess: () => {
      setContent('');
      setMediaFiles([]);
      onTweetCreated?.();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) return;

    createTweetMutation.mutate({
      content: content.trim(),
      authorId: 'demo-user-id',
      authorUsername,
      mediaFiles: mediaFiles.length > 0 ? mediaFiles : undefined,
    });
  };

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setMediaFiles(prev => [...prev, ...files].slice(0, 4));
  };

  const removeMedia = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
  };

  const remainingChars = 280 - content.length;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex space-x-3">
        <img
          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${authorUsername}`}
          alt="Avatar"
          className="w-12 h-12 rounded-full"
        />
        <div className="flex-1 space-y-3">
          <input
            type="text"
            value={authorUsername}
            onChange={(e) => setAuthorUsername(e.target.value)}
            placeholder="Username"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-twitter-blue"
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's happening?"
            className="w-full resize-none border-none outline-none text-xl placeholder-gray-500 min-h-[100px]"
            maxLength={280}
          />
          
          {/* Media Previews */}
          {mediaFiles.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {mediaFiles.map((file, index) => (
                <div key={index} className="relative">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Media ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeMedia(index)}
                    className="absolute top-2 right-2 bg-black bg-opacity-60 text-white rounded-full p-1 hover:bg-opacity-80"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between border-t pt-3">
        <div className="flex items-center space-x-3">
          <label className="cursor-pointer text-twitter-blue hover:bg-blue-50 p-2 rounded-full">
            <Image size={20} />
            <input
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={handleMediaSelect}
              className="hidden"
              disabled={mediaFiles.length >= 4}
            />
          </label>
          <span className="text-sm text-gray-500">
            {mediaFiles.length}/4 media files
          </span>
        </div>

        <div className="flex items-center space-x-3">
          <span className={`text-sm ${remainingChars < 20 ? 'text-red-500' : 'text-gray-500'}`}>
            {remainingChars}
          </span>
          <button
            type="submit"
            disabled={!content.trim() || remainingChars < 0 || createTweetMutation.isPending}
            className="bg-twitter-blue text-white px-6 py-2 rounded-full font-semibold hover:bg-twitter-darkBlue disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {createTweetMutation.isPending ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send size={16} />
            )}
            <span>Tweet</span>
          </button>
        </div>
      </div>

      {createTweetMutation.error && (
        <div className="text-red-500 text-sm">
          Error: {(createTweetMutation.error as Error).message}
        </div>
      )}
    </form>
  );
};
