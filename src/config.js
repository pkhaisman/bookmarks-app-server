module.exports = {
    PORT: process.env.PORT || 8000,
    NODE_ENV: process.env.NODE_ENV || 'development',
    // why do we bother with the env file if explicitly including its' contents?
    DB_URL: process.env.DB_URL || 'postgresql://dunder-mifflin@localhost/bookmarks-app'
}