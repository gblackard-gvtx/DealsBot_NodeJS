import config from "./config.json";
import { WalMartAfilliate } from "./walmartAffiliate/walmarteAffiliate";
import { Logger } from "./utils/logger";
const logger = Logger.createLogger(config.LogLevel);
const walMartAfil = new WalMartAfilliate();
const cat = {
  catigories: [
    { id: "2636", name: "Video Games" },
    { id: "1229749", name: "Office Supplies" },
    { id: "4044", name: "Home" },
    { id: "4171", name: "Toys" },
    { id: "3920", name: "Books" },
    { id: "5440", name: "Pets" },
    { id: "5427", name: "Baby" },
    { id: "5438", name: "Clothing" },
    { id: "1105910", name: "Cell Phones" },
    { id: "4096", name: "Movies & TV Shows" },
    { id: "3944", name: "Electronics" },
    { id: "1085666", name: "Beauty" },
    { id: "1085632", name: "Seasonal" },
    { id: "1115193", name: "Household Essentials" },
    { id: "7924299", name: "Premium Beauty" },
    { id: "91083", name: "Auto & Tires" },
    { id: "5428", name: "Patio & Garden" },
    { id: "4125", name: "Sports & Outdoors" },
    { id: "1072864", name: "Home Improvement" },
    { id: "1334134", name: "Arts Crafts & Sewing" },
    { id: "6197502", name: "Industrial & Scientific" },
  ],
};

//Declare a few global variables
const walPKPass = config.WalPKPass;
const pemPath = config.PemPath;
const specialOffer = ["rollback", "clearance", "specialBuy"];
const date = new Date().getTime();
const pkString = walMartAfil.getPKString(pemPath, walPKPass);
//Create a param object to pass to the getItemsByCatagory instead of a multi param method
const walmartParams = {
  consumerid: config.ConsumerID,
  impactid: config.ImpactID,
  keyVer: config.KeyVer,
  pkString: pkString!,
  mongoDBUser: config.MDBUSER,
  mongoDBPW: config.MDBPW,
  mongoDBClient: config.MDBCLIENT,
  mongoDBColection: config.MDBCollection,
};
// added ! after pkString to utilize non-null assertion
//Main function calls the getItemsByCatagory in a nested loop. It loops through categories and specialoffers
const main = async () => {
  //walMartAfil.getSingleCategory(walmartParams,specialOffer[1],"4096");
  await walMartAfil.clearMongoDB(walmartParams);
  for (let i = 0; i < specialOffer.length; i++) {
    for (let index = 0; index < cat.catigories.length; index++) {
      await walMartAfil.getItemsByCatagory(
        walmartParams,
        specialOffer[i],
        cat.catigories[index].id
      );
    }
  }
};

main();
