// backend/controllers/authController.js
import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
// REMOVED: import sendEmail from '../utils/sendEmail.js';

export const signup = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validate role - only allow project_manager or team_member on signup
    const validRoles = ['project_manager', 'team_member'];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({ 
        msg: 'Invalid role. Must be project_manager or team_member' 
      });
    }

    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({
      name,
      email,
      password: hashedPassword,
      role: role || 'team_member',
    });

    await user.save();

    // Auto-login after signup
    const payload = { 
      user: { 
        id: user.id,
        role: user.role,
        name: user.name,
        email: user.email
      } 
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });

    return res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture || '',
      },
    });
  } catch (err) {
    console.error(err.message);
    return res.status(500).send('Server Error');
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }
    
    const payload = { 
      user: { 
        id: user.id,
        role: user.role,
        name: user.name,
        email: user.email
      } 
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });

    // Update last active
    user.lastActive = Date.now();
    await user.save();

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture || '',
      },
    });
  } catch (err) {
    console.error(err.message);
    return res.status(500).send('Server Error');
  }
};

// SIMPLIFIED: forgotPassword - returns a message without sending email
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // For demo purposes, just return a success message
    // In production, you'd send an email with reset link
    return res.json({ 
      msg: 'Password reset link would be sent to your email. (Email functionality disabled for demo)' 
    });
  } catch (err) {
    console.error(err.message);
    return res.status(500).send('Server Error');
  }
};

// SIMPLIFIED: resetPassword - for demo purposes
export const resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    
    // Simple password reset without token (for demo only)
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    return res.json({ msg: 'Password has been reset successfully.' });
  } catch (err) {
    console.error(err.message);
    return res.status(500).send('Server Error');
  }
};