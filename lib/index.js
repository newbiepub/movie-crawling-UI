import express from "express";
import  compression from "compression";
import bodyParser from "body-parser"
import url from "url";
import  qs from "querystring";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import csrf from 'csurf';
import consolidate from "consolidate";
import {resolve, join} from "path";
import phimmmoiRouter from "./routes/phimmoi";
import bilutvRouter from "./routes/bilutv";
const minify = require('express-minify');

const app = express();

// Minifying Production
app.use(compression());
app.use(minify());

// Static resource
app.use("/", express.static(join(__dirname, "../", "public")));

//Body Parser
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

// query string
app.use(
    (req, res, next) => {
        req.query = qs.parse(
            url.parse(req.url).query
        );
        next()
    }
);

// enable cookie
app.use(cookieParser());

// helmet best practise protection
app.use(helmet());

// Prevent csrf
app.use(csrf({cookie: true}));
app.use(function (req, res, next) {
    res.locals = res.locals || {};
    res.locals.csrftoken = req.csrfToken();
    next();
});

// render
app.use(
    (req, res, next) => {
        res.render = (filename, params = {}) => {
            const path = resolve(__dirname, '../', 'views', filename);
            res.locals = res.locals || {};
            consolidate.mustache(
                path,
                Object.assign(params, res.locals),
                (err, html) => {
                    if (err) {
                        throw err
                    }
                    res.setHeader('Content-Type', 'text/html; charset=utf8')
                    res.end(html)
                }
            )
        };
        next()
    }
);

app.get("/", (req, res, next) => {
   res.setHeader("Content-Type", "text/html; charset=utf8");
   res.render("index.html");
});

app.use("/phimmoi", phimmmoiRouter);
app.use("/bilutv", bilutvRouter);

app.get("/crawler", (req, res, next) => {
   res.render("crawler.html")
});

app.get("*", (req, res, next) => {
   res.end("Not Found");
});

app.listen((process.env.PORT || 3000), () => {
    console.log("Server Started at port " + (process.env.PORT || 3000))
});