import mongoose, { Document, Schema } from 'mongoose';

export interface ITweet extends Document {
  userId: string;
  content: string;
  mediaUrls: string[];
  hashtags: string[];
  mentions: string[];
  likeCount: number;
  retweetCount: number;
  replyCount: number;
  createdAt: Date;
}

const TweetSchema = new Schema<ITweet>({
  userId: { type: String, required: true, index: true },
  content: { type: String, required: true, maxlength: 280 },
  mediaUrls: [String],
  hashtags: [String],
  mentions: [String],
  likeCount: { type: Number, default: 0 },
  retweetCount: { type: Number, default: 0 },
  replyCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now, index: true }
});

export const Tweet = mongoose.model<ITweet>('Tweet', TweetSchema);
