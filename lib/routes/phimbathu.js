import PhimBatHu from "../video_controllers/phimbathu";

const express = require("express");

const router = express.Router();

router.get("/", async (req, res, next) => {
    try {
        if(req.query.url) {
            let phimbathu = new PhimBatHu(),
                movie = await phimbathu.crawlMovieFromUrl(req.query.url);
            res.render("movie_detail.html", {csrfToken: req.csrfToken(), movie: movie, movieProvider: "phimbathu"})
        } else {
            throw new Error("Url is required");
        }
    } catch (e) {
        console.log(e);
        res.redirect("/crawler");
    }
});

router.get("/sources", async (req, res, next) => {
    try {
        res.setHeader("Content-Type", "application/json");
        if(req.query.url) {
            let phimbathu = new PhimBatHu(),
                mediaUrls = await phimbathu.getMediaSources(`${decodeURIComponent(req.query.url)}`);
            res.json(mediaUrls);
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
