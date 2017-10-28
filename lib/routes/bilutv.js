import express from "express";
import Bilutv from "../video_controllers/bilutv";

const router = express.Router();

router.get('/', async (req, res, next) => {
   try {
        if(req.query.url) {
            let bilutv = new Bilutv(),
                movie = await bilutv.crawlMovieFromUrl(req.query.url);
            res.render("movie_detail.html", {csrfToken: req.csrfToken(), movie: movie, movieProvider: "bilutv"})
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
            let bilutv = new Bilutv(),
                mediaUrls = await bilutv.getMediaSources(`${bilutv.baseUrl}${decodeURIComponent(req.query.url)}`);
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