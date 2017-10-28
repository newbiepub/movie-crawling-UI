import request from "request";

function requestAsync (url, method, data) {
    return new Promise((resolve, reject) => {
        request[method](url, data, (err, httpResponse, body) => {
            if (err) {
                reject(err);
            } else {
                resolve({response: httpResponse, html: body});
            }
        })
    })
}

export { requestAsync };