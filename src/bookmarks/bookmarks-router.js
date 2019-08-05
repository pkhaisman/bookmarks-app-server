const express = require('express');
const BookmarksService = require('./bookmarks-service');
const logger = require('../logger');
const xss = require('xss');

const bookmarksRouter = express.Router();

const serializeBookmark = bookmark => ({
    id: bookmark.id,
    title: xss(bookmark.title),
    url: xss(bookmark.url),
    rating: bookmark.rating,
    description: bookmark.description && xss(bookmark.description),
});

bookmarksRouter
    .route('/')
    .get((req, res, next) => {
        const knexInstance = req.app.get('db');
        BookmarksService.getAllBookmarks(knexInstance)
            .then(bookmarks => {
                res.json(bookmarks.map(serializeBookmark));
            })
            .catch(next)
    })
    .post((req, res, next) => {
        const { description, rating, title, url } = req.body;
        const bookmark = {
            description,
            rating,
            title,
            url
        };

        for (const [key, value] of Object.entries(bookmark)) {
            if (value == null && key !== 'description') {
                return res.status(400).json({
                    error: { message: `Missing '${key}' in request body`}
                })
            }
        }


        BookmarksService.addBookmark(
            req.app.get('db'),
            bookmark
        )
            .then(bookmark => {
                res
                    .status(201)
                    .json(serializeBookmark(bookmark))
            })
            .catch(next)
    })

bookmarksRouter
    .route('/:id')
    .all((req, res, next) => {
        BookmarksService.getById(
            req.app.get('db'),
            req.params.id
        )
            .then(bookmark => {
                if (!bookmark) {
                    return res.status(404).json({
                        error: { message: `Bookmark doesn't exist` }
                    });
                }
                res.bookmark = bookmark;
                next();
            })
            .catch(next);
    })
    .get((req, res, next) => {
        res.json(serializeBookmark(res.bookmark))
    })
    .delete((req, res, next) => {
        const knexInstance = req.app.get('db');
        const { id } = req.params;

        BookmarksService.deleteBookmark(knexInstance, id)
            .then(() => {
                res.status(204).end()
            })
            .catch(next)
    })

module.exports = bookmarksRouter;