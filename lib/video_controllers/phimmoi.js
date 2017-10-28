import cheerio from "cheerio"
import * as _ from "lodash";
import {decodeAES} from "../AES/aes";
import {requestAsync} from "../utils/request";

class Phimmoi {
    constructor() {
        this.baseUrl = "http://www.phimmoi.net/";
        this.requestOption = {
            headers: {
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/57.0.2987.133 Safari/537.36',
                'referer': 'http://www.phimmoi.net/',
                'cookie': '_a3rd1478681532=0-9; ADB3rdCookie1478681307=1; ADB3rdCookie1413887770=1; _a3rd1407405582=0-8; ADB3rdCookie1385973822=1; gen_crtg_rta=; __RC=5; __R=3; __UF=-1; __uif=__uid%3A2625795562883732188%7C__ui%3A-1%7C__create%3A1482579556; __tb=0; __IP=2883739208; __utmt=1; __utmt_b=1; __utma=247746630.1273382115.1482841916.1484328884.1484382954.4; __utmb=247746630.3.10.1484382954; __utmc=247746630; __utmz=247746630.1482841916.1.1.utmcsr=(direct)|utmccn=(direct)|utmcmd=(none); _a3rd1426850317=0-5; _a3rd1401790478=0-6'
            },
            timeout: 10000,
            retries: 5
        }
    }

    /**
     * Unpack Obfuscated Codes
     * @param response
     * @returns {string}
     */
    unpackingMovie(response) {
        try {
            let beginSlice = response.indexOf('<script type="text/javascript">;eval') + 31,
                endSlice = response.indexOf(`));</script>`) + 3;
            const formater = require("js-beautify/js/lib/unpackers/reformatter");
            let getScript = formater.unpack(response.substring(beginSlice, endSlice));
            beginSlice = getScript.indexOf(`src=`) + 4;
            endSlice = getScript.indexOf(`" onload=`) + 1;
            return getScript.substring(beginSlice, endSlice).replace(/\"/gi, "")
        } catch (e) {
            throw e;
        }
    }

    /**
     * Crawl movie detail informations
     * @param url
     * @returns {Promise.<{title: jQuery, image: (string|*|string), imdb: jQuery, duration: jQuery, category: jQuery, description: jQuery, pubDate: jQuery, numberOfEp: jQuery, year: jQuery}>}
     */

    async crawlMovieDetail(url) {
        try {
            let {response, html} = await requestAsync(`${this.baseUrl}${url}`, "get", this.requestOption);
            if (response.statusCode === 200) {
                let $ = cheerio.load(html);
                let movieImage = $('.movie-l-img').children("img")[0].attribs.src,
                    movieTitle = $('.movie-title a.title-1').text(),
                    movieImdb = $('.movie-meta-info .imdb').text(),
                    duration = $(".movie-meta-info .movie-dt:contains('Thời lượng:')").next().text(),
                    pubDate = $(".movie-meta-info .movie-dt:contains('Ngày ra rạp:')").next().text(),
                    year = $(".movie-meta-info .movie-dt:contains('Năm:')").next().text(),
                    category = $(".movie-meta-info .dd-cat").text(),
                    numberOfEp = $(".movie-meta-info .movie-dt:contains('Số tập:')").next().text(),
                    description = $("#film-content").text();
                let movieData = {
                    title: movieTitle,
                    image: movieImage,
                    imdb: movieImdb,
                    duration,
                    category,
                    description,
                    pubDate,
                    numberOfEp,
                    year
                };
                return movieData;
            } else {
                throw new Error("No Content");
            }
        } catch (e) {
            throw e;
        }
    }

    /**
     * Get Episode Movies
     * @param serverEpisode
     * @returns {Promise.<Array>}
     */
    async getMovieEp(serverEpisode) {
        try {
            let episodes = [];
            for (let server of serverEpisode) {
                let episode = {epUrls: []};
                episode.title = server.title;
                for (let ep of server.listEp) {
                    episode.epUrls.push({name: ep.title, mediaUrls: encodeURIComponent(ep.url)});
                }
                episodes.push(episode);
            }
            return episodes;
        } catch (err) {
            console.log("Error at getMovieEp ", err);
        }
    }

    /**
     * Get Media Source
     * @param media
     * @param movie
     * @returns {Promise.<Array>}
     */
    async getMediaSource(media) {
        try {
            let {response, html} = await requestAsync(media, 'get', this.requestOption);
            if (response.statusCode === 200) {
                let body = JSON.parse(html),
                    password = "PhimMoi.Net@" + body.episodeId,
                    mediaItems = [];
                _.each(body.medias, (media) => {
                    let mediaItem = {
                        type: media.type,
                        label: media.resolution,
                        src: decodeAES(media.url, password)
                    };
                    mediaItems.push(mediaItem);
                });
                return mediaItems;
            }
            else {
                throw new Error("No Content");
            }
        } catch (e) {
            throw e;
        }
    }

    async getMediaUrlsFromLink(url) {
        try {
            let getMediaUrl = await this.findMedia(url);
            return await this.getMediaSource(getMediaUrl);
        } catch(e) {
            throw e;
        }
    }

    async getServerEpisode(url) {
        try {
            let {response, html} = await requestAsync(`${this.baseUrl}${url}xem-phim.html`, 'get', this.requestOption);
            if (response.statusCode === 200) {
                let $ = cheerio.load(html),
                    serverEpisodeOutput = [];
                /**
                 *  Movie
                 */
                let list_server = $(".list-server .server .server-list");
                if(list_server.length) {
                    _.each(list_server, (server) => {
                        let list_episode = server.children.reduce((episodes, item) => {
                            let list_server_item = {};
                            _.each(item.children, (nodeDetail) => {
                                if(nodeDetail.name === "h3") {
                                    list_server_item.title = nodeDetail.children[0].data;
                                }
                                if(nodeDetail.attribs.class === "list-episode") {
                                    list_server_item.listEp = nodeDetail.children.reduce((listUrl, nodeDetail) => {
                                        try {
                                            let name = nodeDetail.children[0].children[0].data,
                                                url = nodeDetail.children[0].attribs.href;
                                            listUrl.push({title: name, url});
                                            return listUrl;
                                        } catch (err) {
                                            console.log(err);
                                        }
                                    }, []);
                                }
                            });
                            episodes.push(list_server_item);
                            return episodes;
                        }, []);
                        serverEpisodeOutput = serverEpisodeOutput.concat(list_episode);
                    })
                } else {
                    /**
                     * Movie With Episodes
                     * @type {*}
                     */
                    list_server = $(".list-server");
                    _.each(list_server, (server) => {
                        let list_episode = server.children.reduce((episodes, item) => {
                            let list_server_item = {};
                            _.each(item.children, (nodeDetail) => {
                                if(nodeDetail.name === "h3") {
                                    list_server_item.title = nodeDetail.children[0].data;
                                }
                                if(nodeDetail.attribs.class === "list-episode") {
                                    list_server_item.listEp = nodeDetail.children.reduce((listUrl, nodeDetail) => {
                                        try {
                                            let name = nodeDetail.children[0].children[0].data,
                                                url = nodeDetail.children[0].attribs.href;
                                            listUrl.push({title: name, url});
                                            return listUrl;
                                        } catch (err) {
                                            console.log(err);
                                        }
                                    }, []);
                                }
                            });
                            episodes.push(list_server_item);
                            return episodes;
                        }, []);
                        serverEpisodeOutput = serverEpisodeOutput.concat(list_episode);
                    })
                }
                return serverEpisodeOutput;
            } else {
                throw new Error("No Content");
            }
        } catch (e) {
            throw e;
        }
    }

    async findMedia(url) {
        try {
            if(url.indexOf(".html") !== -1) {
                url = `${this.baseUrl}${url}`;
            } else {
                url = `${this.baseUrl}${url}xem-phim.html`;
            }
            let {response, html} = await requestAsync(url, 'get', this.requestOption);
            if (response.statusCode === 200) {
                let $ = cheerio.load(html);
                let media = this.unpackingMovie(html);
                if (media != undefined) {
                    console.log(`Getting PhimMoi Media: \n ${media} \n\n`,);
                    return media.replace("javascript", "json");
                } else {
                    throw new Error("No Media Found")
                }
            } else {
                throw new Error("No Content");
            }
        } catch (e) {
            throw e;
        }
    }

    async crawlFromUrl(url) {
        try {
            url = decodeURIComponent(url).replace('http://www.phimmoi.net/', "");
            url = url.replace("xem-phim.html", "");
            let movie = await this.crawlMovieDetail(url);
            Object.assign(movie, {link: url});
            let serverEpisode = await this.getServerEpisode(url);
            if (serverEpisode.length) {
                let movieEpisodes = await this.getMovieEp(serverEpisode);
                movie.movieEpisodes = movieEpisodes;
            } else {
                let mediaUrls = await this.getMediaUrlsFromLink(url);
                Object.assign(movie, {mediaUrls})
            }
            return movie
        } catch (e) {
            throw e;
        }
    }
}

export default Phimmoi;