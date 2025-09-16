import React, { useState } from 'react';
import { Send } from 'lucide-react';

interface TweetPublisherProps {
  onPublish: (content: string, username: string) => void;
}

const TweetPublisher: React.FC<TweetPublisherProps> = ({ onPublish }) => {
  const [content, setContent] = useState('');
  const [username, setUsername] = useState('user1');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim()) {
      onPublish(content.trim(), username);
      setContent('');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Publish Tweet</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700">
            Username
          </label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="Enter username"
          />
        </div>
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700">
            Tweet Content
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            maxLength={280}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="What's happening?"
          />
          <div className="mt-1 text-sm text-gray-500">
            {content.length}/280 characters
          </div>
        </div>
        <button
          type="submit"
          disabled={!content.trim()}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          <Send className="w-4 h-4 mr-2" />
          Tweet
        </button>
      </form>
    </div>
  );
};

export default TweetPublisher;
