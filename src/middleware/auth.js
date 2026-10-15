
const jwt = require('jsonwebtoken');
const { jwtAccessToken, jwtTimeLimit, jwtRefreshToken } = require('../config/constants');
const { ValidationErrorHandler } = require('./errorHandler');

const isProd = process.env.NODE_ENV === 'production';

exports.generateToken = (payload) => {
    return jwt.sign(payload, jwtAccessToken, { expiresIn: jwtTimeLimit });
};

exports.generateRefreshToken = (payload) => {
    return jwt.sign(payload, jwtRefreshToken, { expiresIn: '10h' });
};

exports.validateToken = (req, res, next) => {
    
    const token = req.cookies.access_token;
    
    if (!token) {
        return next(new ValidationErrorHandler('access token not supplied', 403));
    }

    jwt.verify(token, jwtAccessToken, (error, data) => {
        if (error) {
            return next(new ValidationErrorHandler('Invalid or expired token', 403));
        }
        
        req.user = data;
        next();
    });
};

exports.refreshAccessToken = (req, res, next) => {
    const token = req.cookies.refresh_token;

    if (!token) {
        return next(new ValidationErrorHandler('Refresh token not supplied', 401));
    }

    jwt.verify(token, jwtRefreshToken, (error, data) => {
        if (error) {
            return next(new ValidationErrorHandler('Invalid or expired refresh token', 401));
        }

        const newAccessToken = exports.generateToken({
            user_id: data.user_id,
            user_role: data.user_role
        });

       res.cookie('access_token', newAccessToken, {
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? 'none' : 'lax',
            maxAge: 1000 * 60 * 60,
        });

        res.status(200).json({ success: true, message: 'Access token refreshed' });
    });
};
