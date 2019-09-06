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
                    // Manish. Why is this necessary? I think it works without it?
                    // Also, when I run tests, why does it async? Because of no end()?
                    .location(req.originalUrl + `/${bookmark.id}`)
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
    .patch((req, res, next) => {
        const { title, url, description, rating } = req.body;
        const bookmarkToUpdate = { title, url, description, rating };

        // check if any of keys are truthy
        // returns an array of truthy values for each key in bookmarksToUpdate
        // if length is 0 we know that there are no valid keys
        const numberOfValues = Object.values(bookmarkToUpdate).filter(Boolean).length;
        if (numberOfValues === 0) {
            return res.status(400).json({
                error: {
                    message: `Request body must contain either 'title', 'url', 'description', or 'rating'`
                }
            })
        }

        BookmarksService.updateBookmark(
            req.app.get('db'),
            req.params.id,
            bookmarkToUpdate
        )
            .then(numRowsAffected => {
                res.status(204).end()
            })
            .catch(next)
    })

module.exports = bookmarksRouter;