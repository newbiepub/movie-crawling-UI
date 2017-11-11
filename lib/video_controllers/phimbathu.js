import {requestAsync} from "../utils/request";
import * as _ from "lodash";
import {decodeAES} from "../../dist/AES/aes";
const cheerio = require("cheerio");

class PhimBatHu {
    constructor() {
        this.baseUrl = "https://phimbathu.com/";
        this.requestOption = {
            headers: {
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/57.0.2987.133 Safari/537.36',
                'referer': "https://phimbathu.com/",
                'cookie': '_a3rd1478681532=0-9; ADB3rdCookie1478681307=1; ADB3rdCookie1413887770=1; _a3rd1407405582=0-8; ADB3rdCookie1385973822=1; gen_crtg_rta=; __RC=5; __R=3; __UF=-1; __uif=__uid%3A2625795562883732188%7C__ui%3A-1%7C__create%3A1482579556; __tb=0; __IP=2883739208; __utmt=1; __utmt_b=1; __utma=247746630.1273382115.1482841916.1484328884.1484382954.4; __utmb=247746630.3.10.1484382954; __utmc=247746630; __utmz=247746630.1482841916.1.1.utmcsr=(direct)|utmccn=(direct)|utmcmd=(none); _a3rd1426850317=0-5; _a3rd1401790478=0-6'
            },
            timeout: 10000,
            retries: 5
        }
    }

    async crawlMovieFromUrl(url) {
        try {
            if(url.indexOf("/xem-phim/") === -1) {
                let movie = await this.getMovieDetail(url);
                url = `${this.baseUrl}${movie.link.substring(1, movie.link.length)}`;
                let serverEpisodes = await this.getServerEpisode(url);
                if(serverEpisodes.length) {
                    movie.movieEpisodes = serverEpisodes;
                } else {
                    let mediaUrls = await this.getMediaSources(url);
                    Object.assign(movie, {mediaUrls});
                }
                return movie;
            }
            throw new Error("Url is invalid");
        } catch (e) {
            throw e;
        }
    }

    async getMovieDetail(url) {
        try {
            let { response, html } = await requestAsync(url, "get", this.requestOption);
            if(response.statusCode === 200) {
                let $ = cheerio.load(html),
                    movieTitle = $("p.title").text(),
                    movieImage = $(".poster img")[0].attribs.src,
                    category = $("dt:contains('Thể loại:')").next().text(),
                    year = $("dt:contains('Năm xuất bản:')").next().text(),
                    duration = $("dt:contains('Thời lượng')").next().text(),
                    numberOfEp = $("dt:contains('Đang phát:')").next().text(),
                    pubDate = new Date(),
                    description = $("div.detail").html(),
                    movieLink = $(".poster a")[0].attribs.href;
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
            let { response, html } = await requestAsync(url, "get", this.requestOption);
            if(response.statusCode === 200) {
                let $ = cheerio.load(html),
                    serverEpisodeOutput = [];
                // List Episode
                let list_eps = $("#list_episodes>a");
                if(list_eps.length) {
                    let values = _.values(list_eps),
                        episodes = [];
                    _.each(values, (item) => {
                        if(item.type === "tag" && item.name === "a") {
                            let epName = item.children[0].data,
                                url = item.attribs.href;
                            episodes.push({name: epName, mediaUrls: url})
                        }
                    });
                    let server_item = [
                        {
                            title: "Server#1",
                            epUrls: episodes
                        }
                    ];
                    serverEpisodeOutput = serverEpisodeOutput.concat(server_item);
                }
                return serverEpisodeOutput;
            }
            throw new Error("No Content");
        } catch(e) {
            throw e;
        }
    }

    async getMediaSources(url) {
        try {
            let {response, html} = await requestAsync(url, 'get', this.requestOption);
            if (response.statusCode === 200) {
                let playerSetting = this.extractMedia(html);
                if (playerSetting != undefined) {
                    return playerSetting.sources.map(video => ({

                        src: decodeAES(
                            video.file,
                            'phimbathu.com' + '4590481877' + playerSetting.modelId
                        ),
                        label: parseFloat(video.label),
                        type: video.type
                    }))
                } else {
                    throw new Error("playerSetting not found")
                }
            } else {
                throw new Error("No Content");
            }
        } catch (e) {
            throw e;
        }
    }

    extractMedia(body) {
        try {
            const beginSlice = body.indexOf('var playerSetting = {') + 20;
            const endSlice = body.indexOf('"};') + 2;
            const result = JSON.parse(body.slice(beginSlice, endSlice).trim());
            let sources = [];
            if (result.err) {
                return {
                    sources
                }
            }
            _.each(result.sourceLinks, (item) => {
                sources = sources.concat(item.links);
            });
            _.each(result.sourceLinksBk, (item) => {
                sources = sources.concat(item.links);
            });
            return {
                modelId: result.modelId,
                sources
            }
        } catch (e) {
            console.log(e);
            console.log("Error - extractMedia");
            throw e;
        }
    }
}

export default PhimBatHu;