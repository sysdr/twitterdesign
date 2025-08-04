import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TweetForm } from '../components/TweetForm/TweetForm';

// Mock API client
vi.mock('../api/client', () => ({
  createTweet: vi.fn(() => Promise.resolve({ success: true, data: { id: '1' } })),
}));

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('TweetForm', () => {
  it('renders tweet form correctly', () => {
    renderWithQueryClient(<TweetForm />);
    
    expect(screen.getByPlaceholderText("What's happening?")).toBeInTheDocument();
    expect(screen.getByText('Tweet')).toBeInTheDocument();
  });

  it('updates character count', () => {
    renderWithQueryClient(<TweetForm />);
    
    const textarea = screen.getByPlaceholderText("What's happening?");
    fireEvent.change(textarea, { target: { value: 'Hello world' } });
    
    expect(screen.getByText('269')).toBeInTheDocument(); // 280 - 11 = 269
  });

  it('disables submit when content is empty', () => {
    renderWithQueryClient(<TweetForm />);
    
    const submitButton = screen.getByRole('button', { name: /tweet/i });
    expect(submitButton).toBeDisabled();
  });

  it('enables submit when content is provided', () => {
    renderWithQueryClient(<TweetForm />);
    
    const textarea = screen.getByPlaceholderText("What's happening?");
    fireEvent.change(textarea, { target: { value: 'Test tweet' } });
    
    const submitButton = screen.getByRole('button', { name: /tweet/i });
    expect(submitButton).not.toBeDisabled();
  });
});
