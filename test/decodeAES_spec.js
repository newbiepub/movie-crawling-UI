'strict mode'
const test = require('ava');
const { decodeAES } = require("../dist/AES/aes");

test('decode link bilutv', t => {
    try {
        const link = decodeAES('U2FsdGVkX1+TkfeDlTgOnw6ThlOjwfLUROCjTsVXPVLiXvQx5Z7nRYMJgy9mlya9X7ufnGW1kpjx0pyxdR3fgn9VwYjmwgyOxVH+9MPHw4CFMIykVCCYvowFTcTz52n3D11ZTYiIz8q5HRwFtRCwCrpdEFmYINgNCTnxxY0t1LM=', 'bilutv.com45904818773916')
        console.log(link);
        t.pass()
    } catch(e) {
        t.fail("Decode Failed");
    }
});