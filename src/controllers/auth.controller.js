
const bcrypt = require('bcryptjs');

const connectionPool = require('../config/database');
const { generateToken, generateRefreshToken } = require('../middleware/auth');
const { ValidationErrorHandler } = require('../middleware/errorHandler');

const isProd = process.env.NODE_ENV === 'production';

exports.login = async (req, res, next) => {

    try {
        const { user_id, user_role, user_password } = req.body;

        const [data] = await connectionPool.execute(
            `SELECT user_id, user_role, password_hash FROM users WHERE user_id = ? AND user_role = ?`,
            [user_id, user_role]
        );

        const user = data[0];

        if (!user) {
            next(new ValidationErrorHandler('Invalid credentials', 401));
            return;
        }

        const passwordValid = await bcrypt.compare(user_password, user.password_hash);

        if (!passwordValid) {
            next(new ValidationErrorHandler('Invalid credentials', 401));
            return;
        }

        const token = generateToken({ user_id: user.user_id, user_role: user.user_role });
        const refreshToken = generateRefreshToken({ user_id: user.user_id, user_role: user.user_role });

        const cookieBase = {
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? 'none' : 'lax',
        };

        res.cookie('access_token', token, {
            ...cookieBase,
            maxAge: 1000 * 60 * 60,
        });

        res.cookie('refresh_token', refreshToken, {
            ...cookieBase,
            maxAge: 1000 * 10 * 60 * 60,
            path: '/api/auth/refresh',
        });

        res.json({success: true, message: 'Login successful'});

    } catch (error) {
        next(error);
    }
};

exports.getLoggedIn = async (req, res, next) => {

    const [data] = await connectionPool.execute(
        'SELECT user_id, user_role, fName FROM users WHERE user_id = ?',
        [req.user.user_id]
    );

    if (data.length === 0) {
        return next(new ValidationErrorHandler('User not found', 404));
    }

    res.status(200).json({
        success: true,
        data: {
            user_name: data[0].fName,
            user_id: data[0].user_id,
            user_role: data[0].user_role,
        },
    });
}

exports.logout = (req, res) => {
    res.clearCookie('access_token');
    res.clearCookie('refresh_token', { path: '/api/auth/refresh' });
    res.status(200).json({ success: true, message: 'Logged out' });
};
