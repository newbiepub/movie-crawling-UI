'strict mode'
const test = require('ava');
const _phimmoi = require("../dist/video_controllers/phimmoi");

const _phimmoi2 = _interopRequireDefault(_phimmoi);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {default: obj};
}

test('get medias', async t => {
    try {
        let phimmoi = new _phimmoi2.default();
        const movie = await phimmoi.crawlFromUrl("http://www.phimmoi.net/phim/am-anh-kinh-hoang-2-3405/");
        t.true(movie != undefined);
        if (movie.mediaUrls != undefined) {
            t.true(movie.mediaUrls.length > 0)
        } else {
            t.true(movie.movieEpisodes.length > 0);
        }
    } catch (e) {
        if (e.message === "No Content")
            t.pass();
        else
            t.fail("Error");
    }
});