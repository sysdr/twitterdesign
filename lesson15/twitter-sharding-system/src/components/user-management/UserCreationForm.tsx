import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const UserCreationForm = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [createdUser, setCreatedUser] = useState<any>(null);
  const queryClient = useQueryClient();

  const createUserMutation = useMutation({
    mutationFn: async ({ username, email }: { username: string; email: string }) => {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email }),
      });
      return response.json();
    },
    onSuccess: (data) => {
      setCreatedUser(data);
      setUsername('');
      setEmail('');
      queryClient.invalidateQueries({ queryKey: ['shards'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username && email) {
      createUserMutation.mutate({ username, email });
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Create New User</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 px-3 py-2 border"
            placeholder="johndoe"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 px-3 py-2 border"
            placeholder="john@example.com"
            required
          />
        </div>
        
        <button
          type="submit"
          disabled={createUserMutation.isPending}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium py-2 px-4 rounded-md transition-colors"
        >
          {createUserMutation.isPending ? 'Creating...' : 'Create User'}
        </button>
      </form>

      {createdUser && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
          <h3 className="text-sm font-medium text-green-800">User Created Successfully!</h3>
          <div className="mt-2 text-sm text-green-700">
            <p><strong>Username:</strong> {createdUser.user.username}</p>
            <p><strong>Email:</strong> {createdUser.user.email}</p>
            <p><strong>Assigned to:</strong> Shard {createdUser.shard_id}</p>
            <p><strong>User ID:</strong> {createdUser.user.id}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserCreationForm;
