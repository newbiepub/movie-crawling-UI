import {requestAsync} from "../utils/request";
import * as _ from "lodash";

const cheerio = require('cheerio');

class PhimVuiHd {
    constructor(props) {
        this.baseUrl = "http://phimvuihd.com/";
        this.requestOption = {
            headers: {
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/57.0.2987.133 Safari/537.36',
                'referer': 'http://phimvuihd.com/',
                'cookie': '_a3rd1478681532=0-9; ADB3rdCookie1478681307=1; ADB3rdCookie1413887770=1; _a3rd1407405582=0-8; ADB3rdCookie1385973822=1; gen_crtg_rta=; __RC=5; __R=3; __UF=-1; __uif=__uid%3A2625795562883732188%7C__ui%3A-1%7C__create%3A1482579556; __tb=0; __IP=2883739208; __utmt=1; __utmt_b=1; __utma=247746630.1273382115.1482841916.1484328884.1484382954.4; __utmb=247746630.3.10.1484382954; __utmc=247746630; __utmz=247746630.1482841916.1.1.utmcsr=(direct)|utmccn=(direct)|utmcmd=(none); _a3rd1426850317=0-5; _a3rd1401790478=0-6'
            },
            timeout: 10000,
            retries: 5
        }
    }

    async crawlMovieFromUrl(url) {
        try {
            if (url.indexOf("/xem-phim") === -1) {
                let movie = await this.crawlMovieDetails(url);
                url = `${this.baseUrl}${movie.link.substring(1, movie.link.length)}`
                movie.movieEpisodes = await this.getServerEpisode(url);
                return movie;
            }
            throw new Error("Url is invalid");
        } catch (e) {
            throw e;
        }
    }

    async crawlMovieDetails(url) {
        try {
            let {response, html} = await requestAsync(url, 'get', this.requestOption);
            if (response.statusCode === 200) {
                let $ = cheerio.load(html),
                    movieTitle = $(".media-heading").text();
                let movieInfo = $('.media-heading').next().text().replace(/\n/g, "").split(/\s{2,}/g),
                    movieImage = $(".media-left img")[0].attribs.src,
                    category = "",
                    year = "",
                    duration = "",
                    numberOfEp = "",
                    pubDate = new Date(),
                    description = $("#info").html(),
                    movieLink = $(".media-body .btn")[0].attribs.href;
                for (let index in movieInfo) {
                    let pairValue = movieInfo[index].split(": ");
                    if (pairValue.length > 1) {
                        switch (pairValue[0]) {
                            case "Năm phát hành": {
                                year = pairValue[1];
                                break;
                            }
                            case "Thời lượng": {
                                duration = pairValue[1];
                                break;
                            }
                        }
                    } else {
                        if (pairValue[0] === "Thể loại:") {
                            category = movieInfo[parseInt(index) + 1];
                            continue;
                        }
                    }
                }
                let movieData = {
                    title: movieTitle,
                    image: movieImage,
                    imdb: 0,
                    duration,
                    category,
                    description,
                    pubDate,
                    numberOfEp,
                    year,
                    link: movieLink
                };
                return movieData;
            }
            throw new Error("No Content");
        } catch (e) {
            throw e;
        }
    }

    async getServerEpisode(url) {
        try {
            let {response, html} = await requestAsync(url, 'get', this.requestOption);
            if (response.statusCode === 200) {
                let $ = cheerio.load(html),
                    serverEpisodeOutput = [],
                    list_eps = $(".tapphim ul"),
                    server_item = [];
                _.each(list_eps, (item, index) => {
                    if (item.type === "tag" && item.name === "ul") {
                        let getUrls = $(item).children().find("a"),
                            episodes = [];
                        _.each(getUrls, (linkData) => {
                            if (linkData.type === "tag" && linkData.name === "a") {
                                let epName = linkData.children[0].data,
                                    url = linkData.attribs.href;
                                episodes.push({name: epName, mediaUrls: url})
                            }
                        });
                        server_item.push({
                            title: `Server#${index}`,
                            epUrls: episodes
                        })
                    }
                });
                serverEpisodeOutput = serverEpisodeOutput.concat(server_item);
                return serverEpisodeOutput;
            }
            throw new Error("No Content");
        } catch (e) {
            throw e;
        }
    }

    async getMediaSources(url) {
        try {
            let {response, html} = await requestAsync(url, 'get', this.requestOption);
            if (response.statusCode === 200) {
                let $ = cheerio.load(html);
                return $("iframe")[0].attribs.src;
            }
            throw new Error("No Content");
        } catch (e) {
            throw e;
        }
    }
}

export default PhimVuiHd;