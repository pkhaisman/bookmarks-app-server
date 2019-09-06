const BookmarksService = {
    getAllBookmarks(knex) {
        return knex.select('*').from('bookmarks');
    },
    getById(knex, id) {
        return knex.from('bookmarks').select('*').where('id', id).first();
    },
    addBookmark(knex, bookmark) {
        return knex
            .insert(bookmark)
            .into('bookmarks')
            .returning('*')
            .then(rows => {
                return rows[0];
            });
    },
    deleteBookmark(knex, id) {
        return knex('bookmarks')
            .where({ id })
            .delete()
    },
    updateBookmark(knex, id, updatedBookmark) {
        return knex('bookmarks')
            .where({ 'id': id })
            .update(updatedBookmark)
    }
}

module.exports = BookmarksService;