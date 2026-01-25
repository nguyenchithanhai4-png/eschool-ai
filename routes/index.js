/**
 * Routes Index - Central router aggregator
 * 
 * Usage in server.js:
 * const routes = require('./routes');
 * app.use('/api/profile', routes.profile({ UserModel }));
 * app.use('/api/auth', routes.auth({ UserModel, passport }));
 * app.use('/api/school', routes.school({ SchoolModel, ClassModel, UserModel }));
 * app.use('/api/admin', routes.admin({ UserModel, SchoolModel }));
 */

// Import route modules
const profileRoutes = require('./profile');
const authRoutes = require('./auth.routes');
const schoolRoutes = require('./school.routes');
const adminRoutes = require('./admin.routes');

module.exports = {
    profile: profileRoutes,
    auth: authRoutes,
    school: schoolRoutes,
    admin: adminRoutes
};
