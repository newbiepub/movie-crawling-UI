import CryptoJS from "crypto-js";

function decodeAES(url, password) {
    try {
        if (!url.match(/[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi)) {
            let decrytData = CryptoJS.AES.decrypt(url.toString(), password);
            return decrytData.toString(CryptoJS.enc.Utf8);
        }
        return url;

    } catch (e) {
        console.log(e);
        return url;
    }
}

export {decodeAES};