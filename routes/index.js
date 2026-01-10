/**
 * Routes Index - Central router aggregator
 * 
 * Usage in server.js:
 * const routes = require('./routes');
 * app.use('/api/profile', routes.profile({ UserModel }));
 */
const profileRoutes = require('./profile');

module.exports = {
    profile: profileRoutes
};
