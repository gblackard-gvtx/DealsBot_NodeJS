const crypto = require('crypto');
const fs = require('fs');
require('dotenv').config()

// Reading keys from files.
const privateKey = fs.readFileSync('./WM_IO_private_key.pem');
const publicKey = fs.readFileSync('./WM_IO_public_key.pem');
const now = Date.now(); // Unix timestamp in milliseconds
console.log( now );

const data = Buffer.from(process.env.ConsumerID + "\n " + now+ "\n" + process.env.KeyVer + "\n")
console.log(data);

const signature = crypto.sign('RSA-SHA256', data, privateKey).toString("base64"); 
console.log("Signing done", signature);


const verify = crypto.verify('RSA-SHA256', data, publicKey, Buffer.from(signature, "base64"));
console.log("verfy done", verify);