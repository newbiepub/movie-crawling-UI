import express from 'express';
import Phimmoi from "../video_controllers/phimmoi";

const router = express.Router();

router.get("/", async (req, res, next) => {
   try {
       if(req.query.url) {
           let phimmoi = new Phimmoi(),
               movie = await phimmoi.crawlFromUrl(req.query.url);
           res.render("movie_detail.html", {csrfToken: req.csrfToken(), movie: movie, movieProvider: "phimmoi"});
       } else {
           res.statusCode = 406;
            throw new Error("Url is required");
       }
   } catch(e) {
       res.redirect('/crawler')
   }
});

router.get("/sources", async (req, res, next) => {
    try {
        res.setHeader("Content-Type", "application/json");
        if(req.query.url) {
            let phimmoi = new Phimmoi(),
                mediaUrls = await phimmoi.getMediaUrlsFromLink(decodeURIComponent(req.query.url));
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

router.get("*", (req, res, next) => {
    res.end("Not Found");
});

export default router;
