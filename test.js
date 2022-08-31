const crypto = require('crypto');
const fs = require('fs');
require('dotenv').config();
const fetch = require("node-fetch");
const encryptedPrivateKey = fs.readFileSync("./walmartPrivate.pem");
privateKeyObject = crypto.createPrivateKey({ format: 'pem', key: encryptedPrivateKey,     passphrase: process.env.WalPKPass,  type: 'pkcs8' }); 
const privateKey = privateKeyObject.export({ format: 'pem', type: 'pkcs8' }).toString();
const now = Date.now(); // Unix timestamp in milliseconds
console.log( now );
const consumerid = process.env.ConsumerID;
console.log(consumerid);
const keyVer = process.env.KeyVer;
console.log(keyVer);
const impactID = process.env.ImpactID;
console.log(impactID);
const strData = process.env.ConsumerID + "\n" +now+ "\n" + process.env.KeyVer + "\n";
console.log(strData);
const data = Buffer.from(strData);

const signature = crypto.sign('RSA-SHA256', data, privateKey).toString("base64"); 
console.log("Signing done", signature);


//const verify = crypto.verify('RSA-SHA256', data, publicKey, Buffer.from(signature, "base64"));
//console.log("verfy done", verify);

const getItemsByCatagory = async (sig, consumerid, keyVer, timestamp, category, ImpactID)=>{
    let url = `https://developer.api.walmart.com/api-proxy/service/affil/product/v2/paginated/items?category=${category}&publisherId=${ImpactID}`;
    let config = {
        method: "get",
        headers: {
            "WM_CONSUMER.ID": consumerid,
            "WM_CONSUMER.INTIMESTAMP":timestamp,
            "WM_SEC.KEY_VERSION":keyVer,
            "WM_SEC.AUTH_SIGNATURE":sig
        }
      }
      const getcatagoryResponse = await fetch(url,config);
      let gcResponse = await getcatagoryResponse.json();
      let json = JSON.stringify(gcResponse);
      let fs = require('fs');
        fs.writeFile('myjsonfile.json', json, 'utf8'); 
}
getItemsByCatagory(signature,consumerid,keyVer,now,3944,impactID);
