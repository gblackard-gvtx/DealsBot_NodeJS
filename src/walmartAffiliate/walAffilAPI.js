import * as crypto from "node:crypto";
import * as fs from "node:fs";
import fetch from "node-fetch";
import { Logger } from "../utils/logger.js";
import { MongoClient } from "mongodb";
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
    logger.punchLogEnter("getWalSignature");
    const strData = consumerid + "\n" + timestamp + "\n" + keyVer + "\n";
    const data = Buffer.from(strData);

    const signature = crypto
      .sign("RSA-SHA256", data, privateKey)
      .toString("base64");
    console.log("Signing done");
    logger.punchLogExit("getWalSignature");
    return signature;
  };

  relDiff = (a, b) => {
    return 100 * Math.abs((a - b) / ((a + b) / 2));
  };
  // This is the bread and butter api call that will get all the data needed and adds it to a json file.
  getItemsByCatagory = async (walmartParams, specialOffer, category) => {
    logger.punchLogEnter("getItemsByCatagory");
    const mongoURI = `mongodb+srv://${walmartParams.mongoDBUser}:${walmartParams.mongoDBPW}@cluster0.mofm6.mongodb.net/?retryWrites=true&w=majority`;
    const client = new MongoClient(mongoURI);
    let timestamp = Date.now();
    console.log(timestamp);
    let signature = this.getWalSignature(
      timestamp,
      walmartParams.consumerid,
      walmartParams.keyVer,
      walmartParams.pkString
    );
    let config = {
      method: "get",
      headers: {
        "WM_CONSUMER.ID": walmartParams.consumerid,
        "WM_CONSUMER.INTIMESTAMP": timestamp,
        "WM_SEC.KEY_VERSION": walmartParams.keyVer,
        "WM_SEC.AUTH_SIGNATURE": signature,
      },
    };
    let nextPageExist = true;
    let item = { items: [] }; // this will be the new array or sales data
    let count = 1;
    let url = "https://developer.api.walmart.com";
    let qParams = `/api-proxy/service/affil/product/v2/paginated/items?category=${category}&publisherId=${walmartParams.impactid}&soldByWmt=1&available=1&specialOffer=${specialOffer}`;
    while (nextPageExist) {
      try {
        const database = client.db(walmartParams.mongoDBClient);
        const walmartIO = database.collection(walmartParams.mongoDBColection);
        const options = { ordered: true };
        if (Date.now() > timestamp + 160000) {
          console.log("160 seconds");
          timestamp = Date.now();
          signature = this.getWalSignature(
            timestamp,
            walmartParams.consumerid,
            walmartParams.keyVer,
            walmartParams.pkString
          );
          console.log(timestamp);
          console.log(signature);
        }
        console.log(url + qParams);
        const getcatagoryResponse = await fetch(url + qParams, config);
        console.log("Request Status: " + getcatagoryResponse.status);
        if (getcatagoryResponse.status !== 200) {
          console.log(getcatagoryResponse.json());
        } else {
          let gcResponse = await getcatagoryResponse.json();
          gcResponse.items.forEach((element) => {
            if (element.hasOwnProperty("msrp")) {
              if (
                parseFloat(this.relDiff(element.msrp, element.salePrice)) > 50
              ) {
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
                  discountPrecentage: this.relDiff(
                    element.msrp,
                    element.salePrice
                  ).toFixed(2),
                });
              }
            }
          });
          if (gcResponse.nextPageExist) {
            count++;
            qParams = gcResponse.nextPage;
            console.log(category + " Page: " + count);
            const result = await walmartIO.insertMany(item.items, options);
            console.log(`${result.insertedCount} documents were inserted`);
            item.items.length = 0;
          } else if (gcResponse.nextPageExist == false && item.items.length > 0) {
            console.log("more pages not found");
            const result = await walmartIO.insertMany(item.items, options);
            console.log(`${result.insertedCount} documents were inserted`);
            nextPageExist = false;
            console.log("" + nextPageExist);
            item.items.length = 0;
            break;
          } else {
            console.log("more pages not found");
            nextPageExist = false;
            console.log("" + nextPageExist);
            item.items.length = 0;
            break;
          }
        }
      } catch (error) {}
    }
    await client.close();
    logger.punchLog(
      "getItemsByCatagory",
      `category ID: ${category} returned from API and written to file.`
    );
    logger.punchLogExit("getItemsByCatagory");
  };
  getCategoryList = async (consumerid, keyVer, pkString) => {
    logger.punchLogEnter("getCatagoryList");
    let timestamp = Date.now();
    console.log(timestamp);
    let signature = this.getWalSignature(
      timestamp,
      consumerid,
      keyVer,
      pkString
    );
    let config = {
      method: "get",
      headers: {
        "WM_CONSUMER.ID": consumerid,
        "WM_CONSUMER.INTIMESTAMP": timestamp,
        "WM_SEC.KEY_VERSION": keyVer,
        "WM_SEC.AUTH_SIGNATURE": signature,
      },
    };
    let URL =
      "https://developer.api.walmart.com/api-proxy/service/affil/product/v2/taxonomy";
    const getcatagorylistResponse = await fetch(URL, config);
    console.log("Request Status: " + getcatagorylistResponse.status);
    let gclResponse = await getcatagorylistResponse.json();
    fs.writeFile("tax.json", JSON.stringify(gclResponse), (error) => {
      if (error) throw error;
    });
  };
  clearMongoDB = async (params) => {
    const mongoURI = `mongodb+srv://${params.mongoDBUser}:${params.mongoDBPW}@cluster0.mofm6.mongodb.net/?retryWrites=true&w=majority`;
    const client = new MongoClient(mongoURI);
    const database = client.db(params.mongoDBClient);
    const walmartIO = database.collection(params.mongoDBColection);

    try {
      const results = await walmartIO.deleteMany({});
      console.log("Deleted " + results.deletedCount + " documents");
    } catch (error) {
    } finally {
      await client.close();
    }
  };
  getSingleCategory = async (walmartParams, specialOffer, category) => {
    let timestamp = Date.now();
    console.log(timestamp);
    let signature = this.getWalSignature(
      timestamp,
      walmartParams.consumerid,
      walmartParams.keyVer,
      walmartParams.pkString
    );
    let config = {
      method: "get",
      headers: {
        "WM_CONSUMER.ID": walmartParams.consumerid,
        "WM_CONSUMER.INTIMESTAMP": timestamp,
        "WM_SEC.KEY_VERSION": walmartParams.keyVer,
        "WM_SEC.AUTH_SIGNATURE": signature,
      },
    };
    let url = "https://developer.api.walmart.com";
    let qParams = `/api-proxy/service/affil/product/v2/paginated/items?category=${category}&publisherId=${walmartParams.impactid}&soldByWmt=1&available=1&specialOffer=${specialOffer}`;
    console.log(url + qParams);
    const getcatagoryResponse = await fetch(url + qParams, config);
    console.log("Request Status: " + getcatagoryResponse.status);
    if (getcatagoryResponse.status !== 200) {
      console.log(getcatagoryResponse.json());
    } else {
      let gcResponse = await getcatagoryResponse.json();
      fs.writeFile("GSC.json", JSON.stringify(gcResponse), (error) => {
        if (error) throw error;
      });
    }
  };
}
