const crypto = require('crypto');
const fs = require('fs');
require('dotenv').config()
const encryptedPrivateKey = fs.readFileSync("./walmartPrivate.pem");
privateKeyObject = crypto.createPrivateKey({ format: 'pem', key: encryptedPrivateKey,     passphrase: process.env.WalPKPass,  type: 'pkcs8' }); 
const privateKey = privateKeyObject.export({ format: 'pem', type: 'pkcs8' }).toString();
const now = Date.now(); // Unix timestamp in milliseconds
console.log( now );
console.log(process.env.ConsumerID);
console.log(process.env.KeyVer);
const strData = process.env.ConsumerID + "\n" +now+ "\n" + process.env.KeyVer + "\n";
console.log(strData);
const data = Buffer.from(strData);

const signature = crypto.sign('RSA-SHA256', data, privateKey).toString("base64"); 
console.log("Signing done", signature);


//const verify = crypto.verify('RSA-SHA256', data, publicKey, Buffer.from(signature, "base64"));
//console.log("verfy done", verify);