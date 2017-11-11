import PhimVuiHd from "../video_controllers/phimvuihd";

const express = require("express");
const router = express.Router();

router.get('/', async (req, res, next) => {
    try {
        if(req.query.url) {
            let phimvuihd = new PhimVuiHd();
            let movie = await phimvuihd.crawlMovieFromUrl(req.query.url);
            return res.render("movie_detail.html", {csrfToken: req.csrfToken(), movie: movie, movieProvider: "phimvuihd"})
        }
        throw new Error("Url is required");
    } catch (e) {
        console.log(e);
        res.redirect('/crawler');
    }
});

router.get("/sources", async (req, res, next) => {
    try {
        res.setHeader("Content-Type", "application/json");
        if(req.query.url) {
            let phimvui = new PhimVuiHd(),
                mediaUrls = await phimvui.getMediaSources(`${phimvui.baseUrl}${decodeURIComponent(req.query.url.substring(1, req.query.url.length))}`);
            res.json([{label: "720", src: mediaUrls, type: "embed"}]);
        } else {
            throw new Error("Url is required");
        }
    } catch(e) {
        console.log(e);
        res.statusCode = 204;
        res.json({error: "Error"})
    }
});

export default router;