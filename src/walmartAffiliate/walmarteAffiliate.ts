import * as crypto from "crypto"
import * as fs from "fs";
import fetch from "node-fetch";
import { MongoClient } from "mongodb";
import config from "../config.json";
import { Logger } from "../utils/logger";
const logger = Logger.createLogger(config.LogLevel);



export class WalMartAfilliate {
  // read in the encrypted .pem file with password saved in .env file and load it to  the privatekeyobject
  getPKString = (keyPath: string, walPKPass: string) => {
    try {
      logger.info("Reading in private key");
      const encryptedPrivateKey = fs.readFileSync(keyPath);
      let privateKeyObject = crypto.createPrivateKey({
        format: "pem",
        key: encryptedPrivateKey,
        passphrase: walPKPass,
        type: "pkcs8",
      });
      //export the private key to string to be used in the signature.
      const privateKey = privateKeyObject
        .export({ format: "pem", type: "pkcs8" }).toString();
      return privateKey;
    } catch (error) {
      logger.error(error);
    }
  };

  // gather data to be used everytime we make a api call
  getWalSignature = (
    timestamp: number,
    consumerid: string,
    keyVer: string,
    privateKey: string
  ) => {
    logger.info("Signing");
    const strData = consumerid + "\n" + timestamp + "\n" + keyVer + "\n";
    const data = Buffer.from(strData);

    const signature:string = crypto
      .sign("RSA-SHA256", data, privateKey)
      .toString("base64");
      logger.info("Signing done");
    return signature;
  };
// returns the relative difference between two numbers returns a number
  relDiff = (a: number, b: number) => {
    let precentage:number = 100 * Math.abs((a - b) / ((a + b) / 2));
    return precentage;
  };
  // This is the bread and butter api call that will get all the data needed and adds it to a json file.
  getItemsByCatagory = async (
    walmartParams: {
      consumerid: string;
      keyVer: string;
      pkString: string;
      mongoDBUser: string;
      mongoDBPW: string;
      mongoDBClient: string;
      mongoDBColection: string;
      impactid: string;
    },
    specialOffer: string,
    category: string
  ) => {
    logger.info("Starting category: " + category);
    const mongoURI = `mongodb+srv://${walmartParams.mongoDBUser}:${walmartParams.mongoDBPW}@cluster0.mofm6.mongodb.net/?retryWrites=true&w=majority`;
    const client = new MongoClient(mongoURI);
    let timestamp = Date.now();
    logger.info(`Timestamp: ${timestamp}`);
    let signature = this.getWalSignature(
      timestamp,
      walmartParams.consumerid,
      walmartParams.keyVer,
      walmartParams.pkString
    );
    let config: object = {
      method: "get",
      headers: {
        "WM_CONSUMER.ID": walmartParams.consumerid,
        "WM_CONSUMER.INTIMESTAMP": timestamp,
        "WM_SEC.KEY_VERSION": walmartParams.keyVer,
        "WM_SEC.AUTH_SIGNATURE": signature,
      },
    };
    let nextPageExist = true;
    let items = []
    interface saleItem{
      retailer: string,
      category: string,
      name:string,
      msrp: number,
      salePrice: number,
      upc: string,
      shortDescription: string,
      brandName: string,
      thumbnailImage: string,
      mediumImage: string,
      largeImage: string,
      customerRating: string,
      affiliateAddToCartUrl: string,
      discountPrecentage: string|number
    }
    let count = 1;
    let url = "https://developer.api.walmart.com";
    let qParams = `/api-proxy/service/affil/product/v2/paginated/items?category=${category}&publisherId=${walmartParams.impactid}&soldByWmt=1&available=1&specialOffer=${specialOffer}`;
    while (nextPageExist) {
      try {
        const database = client.db(walmartParams.mongoDBClient);
        const walmartIO = database.collection(walmartParams.mongoDBColection);
        const options = { ordered: true };
        if (Date.now() > timestamp + 160000) {
          logger.info("160 seconds");
          timestamp = Date.now();
          signature = this.getWalSignature(
            timestamp,
            walmartParams.consumerid,
            walmartParams.keyVer,
            walmartParams.pkString
          );
          logger.info("New Signature: " + signature);
          logger.info("New Timestamp: " + timestamp);
        }
        logger.info("Requesting: " + url + qParams);
        const getcatagoryResponse = await fetch(url + qParams, config);
        logger.info("Request Status: " + getcatagoryResponse.status);
        if (getcatagoryResponse.status !== 200) {
          logger.error("Error: " + getcatagoryResponse.status);
          logger.info("Response: " + getcatagoryResponse.json());
        } else {
          let gcResponse = await getcatagoryResponse.json();
          for (const item of gcResponse.items) {
            if (item.hasOwnProperty("msrp")&& this.relDiff(item.msrp,item.salePrice)>=50) {
              let foundItem :saleItem = {
                retailer: "Walmart",
                category: category,
                name: item.name,
                  msrp: item.msrp,
                  salePrice: item.salePrice,
                  upc: item.upc,
                  shortDescription: item.shortDescription,
                  brandName: item.brandName,
                  thumbnailImage: item.thumbnailImage,
                  mediumImage: item.mediumImage,
                  largeImage: item.largeImage,
                  customerRating: item.customerRating,
                  affiliateAddToCartUrl: item.affiliateAddToCartUrl,
                  discountPrecentage: parseFloat(this.relDiff(
                    item.msrp,
                    item.salePrice
                  ).toFixed(2))
              }
              items.push(foundItem)
            }
          }
          if (gcResponse.nextPageExist) {
            count++;
            qParams = gcResponse.nextPage;
            logger.info(category + " Page: " + count);
            const result = await walmartIO.insertMany(items, options);
            logger.info(`${result.insertedCount} documents were inserted`);
            items.length = 0;
          } else if (
            gcResponse.nextPageExist == false &&
            items.length > 0
          ) {
            logger.info("more pages not found");
            const result = await walmartIO.insertMany(items, options);
            logger.info(`${result.insertedCount} documents were inserted`);
            nextPageExist = false;
            logger.info("nextPageExist: " + nextPageExist);
            items.length = 0;
            break;
          } else {
            logger.info("more pages not found");
            nextPageExist = false;
            logger.info("nextPageExist: " + nextPageExist);
            items.length = 0;
            break;
          }
          logger.info("Proccess Complete");
        }
      } catch (error) {}
    }
    await client.close();
  };
  getCategoryList = async (
    consumerid: string,
    keyVer: string,
    pkString: string
  ) => {
    let timestamp = Date.now();
    logger.info(`Timestamp: ${timestamp}`);
    let signature = this.getWalSignature(
      timestamp,
      consumerid,
      keyVer,
      pkString
    );
    let config: object = {
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
    logger.info("Request Status: " + getcatagorylistResponse.status);
    let gclResponse = await getcatagorylistResponse.json();
    fs.writeFile("tax.json", JSON.stringify(gclResponse), (error) => {
      if (error) throw error;
    });
  };
  clearMongoDB = async (walmartParams: {
    mongoDBUser: string;
    mongoDBPW: string;
    mongoDBClient: string;
    mongoDBColection: string;
  }) => {
    const mongoURI = `mongodb+srv://${walmartParams.mongoDBUser}:${walmartParams.mongoDBPW}@cluster0.mofm6.mongodb.net/?retryWrites=true&w=majority`;
    const client = new MongoClient(mongoURI);
    const database = client.db(walmartParams.mongoDBClient);
    const walmartIO = database.collection(walmartParams.mongoDBColection);

    try {
      const results = await walmartIO.deleteMany({});
      logger.info("Deleted " + results.deletedCount + " documents");
    } catch (error) {
    } finally {
      await client.close();
    }
  };
  getSingleCategory = async (
    walmartParams: {
      consumerid: string;
      keyVer: string;
      pkString: string;
      mongoDBUser: string;
      mongoDBPW: string;
      mongoDBClient: string;
      mongoDBColection: string;
      impactid: string;
    },
    specialOffer: string,
    category: string
  ) => {
    let timestamp = Date.now();
    logger.info(`Timestamp: ${timestamp}`);
    let signature = this.getWalSignature(
      timestamp,
      walmartParams.consumerid,
      walmartParams.keyVer,
      walmartParams.pkString
    );
    let config: object = {
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
    logger.info(`Request URL: ${url} + ${qParams}`);
    const getcatagoryResponse = await fetch(url + qParams, config);
   logger.info("Request Status: " + getcatagoryResponse.status);
    if (getcatagoryResponse.status !== 200) {
      logger.info(getcatagoryResponse.json());
    } else {
      let gcResponse = await getcatagoryResponse.json();
      fs.writeFile("GSC.json", JSON.stringify(gcResponse), (error) => {
        if (error) throw error;
      });
    }
  };
}
