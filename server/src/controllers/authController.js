import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { sendTokenResponse, generateAccessToken } from '../utils/token.js';
import { logAudit } from '../utils/auditLogger.js';

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please verify your email and password.',
      });
    }

    if (user.status === 'DISABLED') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact your dispatch administrator.',
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please verify your email and password.',
      });
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    await logAudit({
      userId: user._id,
      userName: user.name,
      userRole: user.role,
      action: 'USER_LOGIN_SUCCESS',
      category: 'AUTH',
      target: user.email,
      details: `Operator logged in from ${req.ip || '127.0.0.1'}`,
      ipAddress: req.ip || '127.0.0.1',
    });

    return sendTokenResponse(user, 200, res, `Welcome back, ${user.name}`);
  } catch (err) {
    next(err);
  }
};

// @desc    Register a new user (Super Admin or initial bootstrap)
// @route   POST /api/auth/register
// @access  Super Admin or Public if no users exist
export const register = async (req, res, next) => {
  try {
    const { name, email, password, role, badgeNumber, assignedVehicle } = req.body;

    const count = await User.countDocuments();
    // Allow public registration only if database has 0 users, otherwise require SUPER_ADMIN
    if (count > 0 && (!req.user || req.user.role !== 'SUPER_ADMIN')) {
      return res.status(403).json({
        success: false,
        message: 'Registration is restricted. Super Admin credentials required to provision accounts.',
      });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: role || (count === 0 ? 'SUPER_ADMIN' : 'CONTROL_ROOM_OPERATOR'),
      badgeNumber: badgeNumber || `UNIT-${Math.floor(10 + Math.random() * 90)}`,
      assignedVehicle: assignedVehicle || null,
    });

    await logAudit({
      userId: req.user ? req.user._id : user._id,
      userName: req.user ? req.user.name : user.name,
      userRole: req.user ? req.user.role : user.role,
      action: 'USER_CREATED',
      category: 'AUTH',
      target: user.email,
      details: `User account created with role ${user.role}`,
      ipAddress: req.ip || '127.0.0.1',
    });

    return sendTokenResponse(user, 201, res, 'User account created successfully');
  } catch (err) {
    next(err);
  }
};

// @desc    Get current logged in user profile
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('assignedVehicle');
    return res.status(200).json({
      success: true,
      user,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public (via cookie)
export const refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token not found',
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_REFRESH_SECRET || 'safesos_academic_refresh_secret_2026'
    );

    const user = await User.findById(decoded.id);
    if (!user || user.status === 'DISABLED') {
      return res.status(401).json({
        success: false,
        message: 'Session invalid or account deactivated',
      });
    }

    const newAccessToken = generateAccessToken(user);

    return res.status(200).json({
      success: true,
      token: newAccessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        badgeNumber: user.badgeNumber,
      },
    });
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired refresh token. Please log in again.',
    });
  }
};

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Private
export const logout = async (req, res, next) => {
  try {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    if (req.user) {
      await logAudit({
        userId: req.user._id,
        userName: req.user.name,
        userRole: req.user.role,
        action: 'USER_LOGOUT',
        category: 'AUTH',
        target: req.user.email,
        details: 'Operator logged out',
        ipAddress: req.ip || '127.0.0.1',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both current and new passwords',
      });
    }

    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.matchPassword(currentPassword);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password does not match',
      });
    }

    user.password = newPassword;
    await user.save();

    await logAudit({
      userId: user._id,
      userName: user.name,
      userRole: user.role,
      action: 'PASSWORD_CHANGED',
      category: 'AUTH',
      target: user.email,
      details: 'User password changed successfully',
      ipAddress: req.ip || '127.0.0.1',
    });

    return res.status(200).json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Forgot Password - Generates reset token & outputs to console for dev
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Do not disclose whether email exists or not
      return res.status(200).json({
        success: true,
        message: 'If that email exists in the system, a password reset token has been issued.',
      });
    }

    // Generate token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash token and set to resetPasswordToken field
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // 30 minutes

    await user.save({ validateBeforeSave: false });

    // Academic / Prototype Console Notice (as specified in prompt requirement 24)
    console.log(`\n======================================================`);
    console.log(`[PASSWORD RESET DEV NOTICE]`);
    console.log(`User: ${user.email}`);
    console.log(`Reset Token: ${resetToken}`);
    console.log(`Reset URL: http://localhost:5173/reset-password?token=${resetToken}`);
    console.log(`======================================================\n`);

    return res.status(200).json({
      success: true,
      message: 'Password reset token generated. (Check server terminal logs in prototype environment)',
      resetTokenPreview: resetToken, // returned in response for convenience in testing environment
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Reset Password with token
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token and new password are required',
      });
    }

    const resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired password reset token',
      });
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    await logAudit({
      userId: user._id,
      userName: user.name,
      userRole: user.role,
      action: 'PASSWORD_RESET_COMPLETED',
      category: 'AUTH',
      target: user.email,
      details: 'Password was successfully reset via token',
      ipAddress: req.ip || '127.0.0.1',
    });

    return res.status(200).json({
      success: true,
      message: 'Password has been reset successfully. You may now log in.',
    });
  } catch (err) {
    next(err);
  }
};
