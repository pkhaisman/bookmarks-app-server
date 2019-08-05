function makeBookmarksArray() {
    return [
        {
            id: 1,
            title: 'Thinkful',
            url: 'https://www.thinkful.com',
            description: 'Redefining education',
            rating: 4,
        },
        {
            id: 2,
            title: 'Google',
            url: 'https://www.google.com',
            description: 'It knows',
            rating: 5,
        },
        {
            id: 3,
            title: 'Surfline',
            url: 'https://www.surfline.com',
            description: null,
            rating: 5,
        },
    ];
};

function makeMaliciousBookmark() {
    const maliciousBookmark = {
        id: 911,
        title: 'Attack! <script>alert("xss");</script>',
        url: `Bad image <img src='https://this.does.not.exist' onerror="alert(document.cookie);">.`,
        rating: 4,
    }
    
    const expectedBookmark = {
        ...maliciousBookmark,
        title: 'Attack! &lt;script&gt;alert(\"xss\");&lt;/script&gt;',
        url: `Bad image <img src="https://this.does.not.exist">.`,    
    }

    return {
        maliciousBookmark,
        expectedBookmark
    }
}

module.exports = {
    makeBookmarksArray,
    makeMaliciousBookmark,
}