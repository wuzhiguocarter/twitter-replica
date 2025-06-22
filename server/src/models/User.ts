import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../types/index.js';

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
  },
  handle: {
    type: String,
    required: [true, 'Please provide a handle'],
    unique: true,
    trim: true,
  },
  avatar: {
    type: String,
    default: 'https://abs.twimg.com/sticky/default_profile_images/default_profile.png',
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email',
    ],
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 6,
    select: false,
  },
  bio: {
    type: String,
    maxlength: 160,
  },
  location: {
    type: String,
    maxlength: 30,
  },
  website: {
    type: String,
    maxlength: 100,
  },
  joinDate: {
    type: Date,
    default: Date.now,
  },
  coverImage: {
    type: String,
    default: '',
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual fields for followers and following
UserSchema.virtual('followers', {
  ref: 'Follow',
  localField: '_id',
  foreignField: 'following',
  justOne: false,
  count: true
});

UserSchema.virtual('following', {
  ref: 'Follow',
  localField: '_id',
  foreignField: 'follower',
  justOne: false,
  count: true
});

// Pre-save middleware to hash password
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare entered password with user's hashed password
UserSchema.methods.comparePassword = async function(enteredPassword: string): Promise<boolean> {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method to generate JWT token
UserSchema.methods.generateToken = function(): string {
  return jwt.sign(
    { id: this._id },
    process.env.JWT_SECRET || 'defaultsecret',
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );
};

const UserModel = mongoose.model<User & mongoose.Document>('User', UserSchema);

export default UserModel;
