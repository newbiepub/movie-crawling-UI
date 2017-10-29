'strict mode'
const test = require('ava');
const _bilutv = require("../dist/video_controllers/bilutv");

const _bilutv2 = _interopRequireDefault(_bilutv);
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

test("get medias", async t => {
    try {
        let _bilutv = new _bilutv2.default();
        const movie =  await _bilutv.crawlMovieFromUrl("http://bilutv.com/phim/tuong-quan-o-tren-ta-o-duoi-6097.html");
        t.true(movie != undefined);
        if(movie.mediaUrls != undefined) {
            t.true(movie.mediaUrls.length > 0)
        } else {
            t.true(movie.movieEpisodes.length > 0);
        }
    } catch(e) {
        console.log(e);
        t.fail("Error");
    }
});