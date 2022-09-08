import * as crypto from "node:crypto";
import * as fs from "node:fs";
import fetch from 'node-fetch';
import { Logger } from "../utils/logger.js";
const logger = new Logger();
 export class WalMartAfilliate {
  // read in the encrypted .pem file with password saved in .env file and load it to  the privatekeyobject
  getPKString = (keyPath, walPKPass) => {
   try {
    const encryptedPrivateKey = fs.readFileSync(keyPath);
    let privateKeyObject = crypto.createPrivateKey({
      format: "pem",
      key: encryptedPrivateKey,
      passphrase: walPKPass,
      type: "pkcs8",
    });
    //export the private key to string to be used in the signature.
    const privateKey = privateKeyObject
      .export({ format: "pem", type: "pkcs8" })
      .toString();
    return privateKey;
   } catch (error) {
    logger.punchLog("getPKString", error);
    
   }
  };

  // gather data to be used everytime we make a api call
  getWalSignature = (timestamp, consumerid, keyVer, privateKey) => {
    const strData = consumerid + "\n" + timestamp + "\n" + keyVer + "\n";
    console.log(strData);
    const data = Buffer.from(strData);

    const signature = crypto
      .sign("RSA-SHA256", data, privateKey)
      .toString("base64");
    console.log("Signing done");
    return signature;
  };

  relDiff = (a, b) => {
    return 100 * Math.abs((a - b) / ((a + b) / 2));
  };

  getItemsByCatagory = async (
    category,
    impactId,
    consumerid,
    timestamp,
    keyVer,
    signature
  ) => {
    let config = {
      method: "get",
      headers: {
        "WM_CONSUMER.ID": consumerid,
        "WM_CONSUMER.INTIMESTAMP": timestamp,
        "WM_SEC.KEY_VERSION": keyVer,
        "WM_SEC.AUTH_SIGNATURE": signature,
      },
    };
    let item = { items: [] }; // this will be the new array or sales data
    let url = `https://developer.api.walmart.com/api-proxy/service/affil/product/v2/paginated/items?category=${category}&publisherId=${impactId}&soldByWmt=1&available=1`;
    const getcatagoryResponse = await fetch(url, config);
    let gcResponse = await getcatagoryResponse.json();
    gcResponse.items.forEach((element) => {
      if (element.hasOwnProperty("msrp")) {
        item.items.push({
          name: element.name,
          msrp: element.msrp,
          salePrice: element.salePrice,
          upc: element.upc,
          shortDescription: element.shortDescription,
          brandName: element.brandName,
          thumbnailImage: element.thumbnailImage,
          mediumImage: element.mediumImage,
          largeImage: element.largeImage,
          customerRating: element.customerRating,
          affiliateAddToCartUrl: element.affiliateAddToCartUrl,
        });
      }
    });
    item.items.forEach((element) => {
      element.discountPrecent =  this.relDiff(
        element.msrp,
        element.salePrice
      ).toFixed(2);
    });

    fs.writeFile("file.json", JSON.stringify(item), (error) => {
      if (error) throw error;
    });
    logger.punchLog("getItemsByCatagory",`caegory ID: ${category} returned from API and written to file.`)
  };
}

