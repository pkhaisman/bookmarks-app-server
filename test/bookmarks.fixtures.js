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

module.exports = {
    makeBookmarksArray,
}