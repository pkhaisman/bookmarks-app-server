const { expect } = require('chai');
const knex = require('knex');
const app = require('../src/app');
const { makeBookmarksArray, makeMaliciousBookmark } = require('./bookmarks.fixtures');

describe('Bookmarks Endpoints', () => {
    let db;
    let auth = ['Authorization', `Bearer ${process.env.API_TOKEN}`]

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

    describe('GET /bookmarks', () => {
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
    
            beforeEach('insert bookmarks', () => {
                return db
                    .into('bookmarks')
                    .insert(testBookmarks);
            });
    
            it('responds with 200 and all of the bookmarks', () => {
                return supertest(app)
                    .get('/bookmarks')
                    .set(...auth)
                    .expect(200, testBookmarks)
            });
        });


        context(`Given an XSS attack bookmark`, () => {
            const { maliciousBookmark, expectedBookmark } = makeMaliciousBookmark();
            
            beforeEach('insert bookmarks', () => {
                return db
                    .into('bookmarks')
                    .insert(maliciousBookmark)
            })

            it('removes XSS attack content', () => {
                return supertest(app)
                    .get('/bookmarks')
                    .set(...auth)
                    .expect(200)
                    .expect(res => {
                        expect(res.body[0].title).to.eql(expectedBookmark.title)
                        expect(res.body[0].url).to.eql(expectedBookmark.url)
                    })
            })
        });
    });

    describe('GET /bookmarks/:id', () => {
        context('Given the database is empty', () => {
            it('responds with 404', () => {
                const id = 1234;
                return supertest(app)
                    .get(`/bookmarks/${id}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(404, { error: { message: `Bookmark doesn't exist` } });
            });
        });

        context('Given there are bookmarks in the database', () => {
            const testBookmarks = makeBookmarksArray();
        
            beforeEach('insert bookmarks', () => {
                return db
                    .into('bookmarks')
                    .insert(testBookmarks);
            });
    
            it('responds with 200 and the specified bookmark', () => {
                const bookmarkId = 2;
                const expectedBookmark = testBookmarks[bookmarkId - 1];
                return supertest(app)
                    .get(`/bookmarks/${bookmarkId}`)
                    .set(...auth)
                    .expect(200, expectedBookmark);
            });
        });

        context(`Given an XSS attack bookmark`, () => {
            const { maliciousBookmark } = makeMaliciousBookmark();

            beforeEach(`insert malicious bookmark`, () => {
                return db
                    .into('bookmarks')
                    .insert(maliciousBookmark)
            });

            it('removes XSS attack content', () => {
                return supertest(app)
                    .get(`/bookmarks/${maliciousBookmark.id}`)
                    .set(...auth)
                    .expect(200)
                    .expect(res => {
                        expect(res.body.title).to.eql('Attack! &lt;script&gt;alert(\"xss\");&lt;/script&gt;')
                        expect(res.body.url).to.eql(`Bad image <img src="https://this.does.not.exist">.`)
                    })
            });
        })
    });

    describe('POST /bookmarks', () => {
        it('creates a bookmark and responds with 201 and the created bookmark', () => {
            const newBookmark = {
                title: 'Amazon',
                url: 'https://www.amazon.com',
                description: 'Consumerism at its best',
                rating: 4,
            }
            
            supertest(app)
                .post('/bookmarks')
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .send(newBookmark)
                .expect(201)
                .expect(res => {
                    expect(res.body.title).to.eql(newBookmark.title)
                    expect(res.body.url).to.eql(newBookmark.url)
                    expect(res.body.description).to.eql(newBookmark.description)
                    expect(res.body.rating).to.eql(newBookmark.rating)
                    expect(res.body).to.have.property('id')
                })
                .then(postRes => {
                    supertest(app)
                        .get(`/articles/${postRes.body.id}`)
                        .expect(postRes.body)
                })
        });

        const requiredFields = ['title', 'url', 'rating'];

        requiredFields.forEach(field => {
            const bookmark = {
                title: 'Amazon',
                url: 'https://www.amazon.com',
                description: 'Consumerism at its best',
                rating: 4,
            }

            it(`responds with 400 and an error message when the '${field}' is missing`, () => {
                delete bookmark[field]

                return supertest(app)
                    .post('/bookmarks')
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .send(bookmark)
                    .expect(400, {
                        error: { message: `Missing '${field}' in request body` }
                    })
            });
        });

        it('removes XSS attack content', () => {
            const { maliciousBookmark, expectedBookmark } = makeMaliciousBookmark();

            return supertest(app)
                .post(`/bookmarks`)
                .set(...auth)
                .send(maliciousBookmark)
                .expect(201)
                .expect(res => {
                    expect(res.body.title).to.eql(expectedBookmark.title);
                    expect(res.body.url).to.eql(expectedBookmark.url);
                });
        });
    });

    describe('DELETE /bookmarks/:id', () => {
        context('Given no bookmarks in the database', () => {
            it('responds with 404', () => {
                const id = 1234;
                return supertest(app)
                    .delete(`/bookmarks/${id}`)
                    .set(...auth)
                    .expect(404, {
                        error: { message: `Bookmark doesn't exist` }
                    })
            });
        });

        context('Given there are bookmarks in the database', () => {
            const testBookmarks = makeBookmarksArray();

            beforeEach('insert bookmarks', () => {
                return db
                    .into('bookmarks')
                    .insert(testBookmarks)
            });

            it('responds with 204 and removes the specified bookmark', () => {
                const idToRemove = 2;
                const expectedBookmarks = testBookmarks.filter(b => b.id !== idToRemove);
                return supertest(app)
                    .delete(`/bookmarks/${idToRemove}`)
                    .set(...auth)
                    .expect(204)
                    .then(res => 
                        supertest(app)
                            .get(`/bookmarks`)
                            .set(...auth)
                            .expect(expectedBookmarks)
                    );
            });
        });
    });
});