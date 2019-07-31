const { expect } = require('chai');
const knex = require('knex');
const app = require('../src/app');
const { makeBookmarksArray } = require('./bookmarks.fixtures');

describe('Bookmarks Endpoints', () => {
    let db;

    before('make knex instance', () => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DB_URL,
        });
        app.set('db', db);
    });

    before('clean table', () => db('bookmarks').truncate());

    afterEach('cleanup', () => db('bookmarks').truncate());

    after('disconnect from db', () => db.destroy());

    describe('GET /articles', () => {
        context('Given an empty database', () => {
            it('responds with 200 and an empty array', () => {
                return supertest(app)
                    .get('/bookmarks')
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200, []);
            })
        });

        context('Given there are bookmarks in the database', () => {
            const testBookmarks = makeBookmarksArray();
    
            beforeEach('insert articles', () => {
                return db
                    .into('bookmarks')
                    .insert(testBookmarks);
            });
    
            it('responds with 200 and all of the bookmarks', () => {
                return supertest(app)
                    .get('/bookmarks')
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200, testBookmarks)
            });
        });
    });

    describe('GET /articles/:id', () => {
        context('Given the database is empty', () => {
            it('responds with 404', () => {
                const id = 1234;
                return supertest(app)
                    .get(`/articles/${id}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(404);
            });
        });

        context('Given there are bookmarks in the database', () => {
            const testBookmarks = makeBookmarksArray();
        
            beforeEach('insert articles', () => {
                return db
                    .into('bookmarks')
                    .insert(testBookmarks);
            });
    
            it('responds with 200 and the specified bookmark', () => {
                const bookmarkId = 2;
                const expectedBookmark = testBookmarks[bookmarkId - 1];
                return supertest(app)
                    .get(`/bookmarks/${bookmarkId}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200, expectedBookmark);
            });
        });
    });
});