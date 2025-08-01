import { Request, Response } from 'express';
import { UserModel } from '../models/User';

export const createUser = async (req: Request, res: Response) => {
  try {
    const user = await UserModel.create(req.body);
    res.status(201).json({ success: true, data: user });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const getUser = async (req: Request, res: Response) => {
  try {
    const user = await UserModel.findById(parseInt(req.params.id));
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({ success: true, data: user });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const followUser = async (req: Request, res: Response) => {
  try {
    const followerId = parseInt(req.body.followerId);
    const followingId = parseInt(req.params.id);
    
    if (followerId === followingId) {
      return res.status(400).json({ success: false, error: 'Cannot follow yourself' });
    }
    
    await UserModel.follow(followerId, followingId);
    res.json({ success: true, message: 'Successfully followed user' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const unfollowUser = async (req: Request, res: Response) => {
  try {
    const followerId = parseInt(req.body.followerId);
    const followingId = parseInt(req.params.id);
    
    await UserModel.unfollow(followerId, followingId);
    res.json({ success: true, message: 'Successfully unfollowed user' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getFollowers = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    
    const followers = await UserModel.getFollowers(userId, limit, offset);
    res.json({ success: true, data: followers });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getFollowing = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    
    const following = await UserModel.getFollowing(userId, limit, offset);
    res.json({ success: true, data: following });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
