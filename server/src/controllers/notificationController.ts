import { Request, Response } from 'express';
import NotificationModel from '../models/Notification.js';
import mongoose from 'mongoose';

// @desc    Get all notifications for a user
// @route   GET /api/notifications
// @access  Private
export const getNotifications = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    
    // Parse pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    
    // Get notifications for user with pagination
    const notifications = await NotificationModel.find({ recipient: userId })
      .populate('actor', 'name handle avatar')
      .populate({
        path: 'tweet',
        populate: {
          path: 'author',
          select: 'name handle avatar'
        }
      })
      .sort({ timestamp: -1, isRead: 1 }) // Sort by newest and unread first
      .skip(skip)
      .limit(limit);
    
    // Get total count for pagination info
    const totalCount = await NotificationModel.countDocuments({ recipient: userId });
    
    res.status(200).json({
      notifications,
      pagination: {
        totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Error getting notifications:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
export const markAsRead = async (req: Request, res: Response) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user.id;
    
    if (notificationId === 'all') {
      // Mark all notifications as read
      await NotificationModel.markAsRead(undefined, userId);
      
      res.status(200).json({ 
        success: true, 
        message: 'All notifications marked as read' 
      });
    } else {
      // Mark specific notification as read
      // First check if notification belongs to this user
      const notification = await NotificationModel.findOne({ 
        _id: notificationId,
        recipient: userId
      });
      
      if (!notification) {
        return res.status(404).json({ message: 'Notification not found' });
      }
      
      if (notification.isRead) {
        return res.status(200).json({ 
          success: true, 
          message: 'Notification already read' 
        });
      }
      
      const updatedNotification = await NotificationModel.markAsRead(notificationId);
      
      res.status(200).json({ 
        success: true, 
        notification: updatedNotification 
      });
    }
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get count of unread notifications
// @route   GET /api/notifications/unread-count
// @access  Private
export const getUnreadCount = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    
    const count = await NotificationModel.getUnreadCount(userId);
    
    res.status(200).json({ count });
  } catch (error) {
    console.error('Error getting unread notification count:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
