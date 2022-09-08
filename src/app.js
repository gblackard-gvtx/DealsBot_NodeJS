import { config } from 'dotenv';
config();
import {WalMartAfilliate} from "./walmartAffiliate/walAffilAPI.js"

//Declare a few global variables
const consumerid = process.env.ConsumerID;
const impactId = process.env.ImpactID;
const keyver = process.env.KeyVer;
const walPKPass = process.env.WalPKPass;
const pemPath = process.env.PemPath;
const testCat = "4044";
const now = Date.now();
const walMartAfil = new WalMartAfilliate();

const pkString = walMartAfil.getPKString(pemPath, walPKPass);
console.log(pkString);
const signature = walMartAfil.getWalSignature(now,consumerid,keyver,pkString);
walMartAfil.getItemsByCatagory(testCat,impactId,consumerid,now,keyver,signature);


