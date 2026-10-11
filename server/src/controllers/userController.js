import User from '../models/User.js';
import { logAudit } from '../utils/auditLogger.js';

// @desc    Get all users
// @route   GET /api/users
// @access  Private (SUPER_ADMIN)
export const getUsers = async (req, res, next) => {
  try {
    const { role, status, search } = req.query;
    const query = {};

    if (role && role !== 'ALL') {
      query.role = role;
    }
    if (status && status !== 'ALL') {
      query.status = status;
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { badgeNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .populate('assignedVehicle', 'vehicleId registrationNumber model')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private (SUPER_ADMIN)
export const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('assignedVehicle');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new user
// @route   POST /api/users
// @access  Private (SUPER_ADMIN)
export const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role, badgeNumber, assignedVehicle } = req.body;

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already exists' });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: role || 'CONTROL_ROOM_OPERATOR',
      badgeNumber: badgeNumber || `UNIT-${Math.floor(10 + Math.random() * 90)}`,
      assignedVehicle: assignedVehicle || null,
      status: 'ACTIVE',
    });

    await logAudit({
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'USER_CREATED_BY_ADMIN',
      category: 'AUTH',
      target: user.email,
      details: `Admin created user ${user.name} with role ${user.role}`,
    });

    return res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        badgeNumber: user.badgeNumber,
        status: user.status,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (SUPER_ADMIN)
export const updateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { name, email, role, badgeNumber, assignedVehicle, status } = req.body;

    if (name) user.name = name;
    if (email) user.email = email.toLowerCase();
    if (role) user.role = role;
    if (badgeNumber) user.badgeNumber = badgeNumber;
    if (assignedVehicle !== undefined) user.assignedVehicle = assignedVehicle;
    if (status) user.status = status;

    await user.save();

    await logAudit({
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'USER_UPDATED_BY_ADMIN',
      category: 'AUTH',
      target: user.email,
      details: `Admin updated user profile for ${user.email}`,
    });

    return res.status(200).json({
      success: true,
      message: 'User updated successfully',
      user,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Toggle user status (Active / Disabled)
// @route   PUT /api/users/:id/status
// @access  Private (SUPER_ADMIN)
export const toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot disable your own admin account' });
    }

    user.status = user.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    await user.save();

    await logAudit({
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'USER_STATUS_TOGGLED',
      category: 'AUTH',
      target: user.email,
      details: `User status changed to ${user.status}`,
    });

    return res.status(200).json({
      success: true,
      message: `User status changed to ${user.status}`,
      status: user.status,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Admin reset user password
// @route   PUT /api/users/:id/reset-password
// @access  Private (SUPER_ADMIN)
export const adminResetPassword = async (req, res, next) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long',
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.password = newPassword;
    await user.save();

    await logAudit({
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'USER_PASSWORD_RESET_BY_ADMIN',
      category: 'AUTH',
      target: user.email,
      details: `Admin reset password for ${user.email}`,
    });

    return res.status(200).json({
      success: true,
      message: `Password reset successfully for user ${user.name}`,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (SUPER_ADMIN)
export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot delete own account' });
    }

    await user.deleteOne();

    await logAudit({
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'USER_DELETED',
      category: 'AUTH',
      target: user.email,
      details: `Admin deleted user ${user.email}`,
    });

    return res.status(200).json({
      success: true,
      message: 'User removed from system',
    });
  } catch (err) {
    next(err);
  }
};
