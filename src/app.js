require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const { NODE_ENV } = require('./config');
const logger = require('./logger');
const bookmarks = require('./store');
const uuid = require('uuid/v4');

const app = express();

const morganOption = (NODE_ENV === 'production')
    ? 'tiny'
    : 'dev';

app.use(morgan(morganOption));
app.use(helmet());
app.use(cors());
app.use(express.json());

app.use(function validateBearerToken(req, res, next) {
    const apiToken = process.env.API_TOKEN;
    const authToken = req.get('Authorization');

    if (!authToken || authToken.split(' ')[1] !== apiToken) {
        logger.error(`Unauthorized request to path: ${req.path}`);
        return res.status(401).json({ error: 'Unauthorized request' });
    }

    next();
});

app.get('/', (req, res) => {
    res.send('Hello, world!');
});

app.get('/bookmarks', (req, res) => {
    res.json(bookmarks);
});

app.get('/bookmarks/:id', (req, res) => {
    const { id } = req.params;
    const bookmark = bookmarks.find(b => b.id == id);

    if (!bookmark) {
        logger.error(`Bookmark with id ${id} not found`);
        return res
            .status(404)
            .send('Bookmark not found');
    }

    res.json(bookmark);
});

app.post('/bookmarks', (req, res) => {
    const { description, rating, title, url } = req.body;

    if (!description) {
        logger.error('Description required.');
        return res
            .status(400)
            .send('Invalid data');
    }

    if (!rating) {
        logger.error('Rating required');
        return res
            .status(400)
            .send('Invalid data');
    }

    if (!title) {
        logger.error('Title required');
        return res
            .status(400)
            .send('Invalid data');
    }

    if (!url) {
        logger.error('Url required');
        return res
            .status(400)
            .send('Invalid data');
    }

    const id = uuid();

    const bookmark = {
        description,
        id,
        rating,
        title,
        url
    };

    bookmarks.push(bookmark);

    logger.info(`Boomark with id ${id} created`);

    res
        .status(201)
        .location(`http://localhost:8000/bookmarks/${id}`)
        .json(bookmark);
});

app.delete('/bookmarks/:id', (req, res) => {
    const { id } = req.params;
    const bookmarkIndex = bookmarks.findIndex(b => b.id == id);

    if (bookmarkIndex === -1) {
        logger.error(`Could not find bookmark with id ${id}.`);
        return res
            .status(400)
            .send('Could not find bookmark')
    }

    bookmarks.splice(bookmarkIndex, 1);

    res
        .status(204)
        .end();
});

app.use(function errorHandler(error, req, res, next) {
    let response;
    if (NODE_ENV === 'production') {
        response = { error: { message: 'server error' }}
    } else {
        console.error(error)
        response = { message: error.message, error }
    }
    res.status(500).json(response);
});

module.exports = app;