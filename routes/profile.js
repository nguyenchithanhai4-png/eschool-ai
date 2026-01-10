/**
 * Profile Routes - API endpoints cho user profile
 * 
 * Routes:
 * - GET /api/profile/:username - Lấy thông tin profile
 * - PUT /api/profile/update - Cập nhật profile
 */
const express = require('express');
const router = express.Router();

// Import User model - Comment out khi dùng server.js truyền vào
// const { UserModel } = require('../models');

/**
 * Factory function để tạo router với dependencies
 * @param {Object} deps - { UserModel }
 */
module.exports = function (deps) {
    const { UserModel } = deps;

    // GET Profile by username
    router.get('/:username', async (req, res) => {
        try {
            const { username } = req.params;
            const user = await UserModel.findOne({ username }).select('-password');
            if (!user) {
                return res.status(404).json({ success: false, error: 'User not found' });
            }
            res.json({
                success: true,
                user: {
                    _id: user._id,
                    username: user.username,
                    fullname: user.fullname,
                    email: user.email,
                    phone: user.phone,
                    studentClass: user.studentClass,
                    birthday: user.birthday,
                    gender: user.gender,
                    address: user.address,
                    role: user.role,
                    schoolId: user.schoolId,
                    avatarUrl: user.avatarUrl,
                    isVip: user.isVip,
                    createdAt: user.createdAt
                }
            });
        } catch (err) {
            console.error('[API] Get profile error:', err.message);
            res.status(500).json({ success: false, error: err.message });
        }
    });

    // UPDATE Profile
    router.put('/update', async (req, res) => {
        try {
            const { username, fullname, email, phone, studentClass, birthday, gender, address, avatarUrl, subject, school, experience } = req.body;

            if (!username) {
                return res.status(400).json({ success: false, error: 'Username is required' });
            }

            const updateData = {};
            if (fullname !== undefined) updateData.fullname = fullname;
            if (email !== undefined) updateData.email = email;
            if (phone !== undefined) updateData.phone = phone;
            if (studentClass !== undefined) updateData.studentClass = studentClass;
            if (birthday !== undefined) updateData.birthday = birthday;
            if (gender !== undefined) updateData.gender = gender;
            if (address !== undefined) updateData.address = address;
            if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
            // Teacher-specific fields
            if (subject !== undefined) updateData.subject = subject;
            if (school !== undefined) updateData.school = school;
            if (experience !== undefined) updateData.experience = experience;

            const updatedUser = await UserModel.findOneAndUpdate(
                { username },
                { $set: updateData },
                { new: true, upsert: true, setDefaultsOnInsert: true }
            ).select('-password');

            if (!updatedUser) {
                return res.status(500).json({ success: false, error: 'Failed to update/create user' });
            }

            console.log(`[API] Profile updated for: ${username}`);
            res.json({
                success: true,
                message: 'Profile updated successfully',
                user: {
                    _id: updatedUser._id,
                    username: updatedUser.username,
                    fullname: updatedUser.fullname,
                    email: updatedUser.email,
                    phone: updatedUser.phone,
                    studentClass: updatedUser.studentClass,
                    birthday: updatedUser.birthday,
                    gender: updatedUser.gender,
                    address: updatedUser.address,
                    role: updatedUser.role,
                    avatarUrl: updatedUser.avatarUrl,
                    subject: updatedUser.subject,
                    school: updatedUser.school,
                    experience: updatedUser.experience
                }
            });
        } catch (err) {
            console.error('[API] Update profile error:', err.message);
            res.status(500).json({ success: false, error: err.message });
        }
    });

    return router;
};
