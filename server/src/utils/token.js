import jwt from 'jsonwebtoken';

export const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
      name: user.name,
      badgeNumber: user.badgeNumber,
    },
    process.env.JWT_SECRET || 'safesos_academic_secret_2026',
    { expiresIn: process.env.JWT_EXPIRE || '24h' }
  );
};

export const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET || 'safesos_academic_refresh_secret_2026',
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
  );
};

export const sendTokenResponse = (user, statusCode, res, message = 'Authenticated successfully') => {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  const cookieOptions = {
    httpOnly: true,
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  };

  res.cookie('refreshToken', refreshToken, cookieOptions);

  return res.status(statusCode).json({
    success: true,
    message,
    token: accessToken,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      badgeNumber: user.badgeNumber,
      assignedVehicle: user.assignedVehicle,
      status: user.status,
    },
  });
};
