import { config } from 'dotenv';
config();
import {WalMartAfilliate} from "./walmartAffiliate/walAffilAPI.js"
import { Logger } from './utils/logger.js';
const logger = new Logger();

//Declare a few global variables
const consumerid = process.env.ConsumerID;
const impactId = process.env.ImpactID;
const keyver = process.env.KeyVer;
const walPKPass = process.env.WalPKPass;
const pemPath = process.env.PemPath;
const testCat = "4044";
const now = Date.now();
const date = new Date();
const walMartAfil = new WalMartAfilliate();
logger.getLogFile(date);

const pkString = walMartAfil.getPKString(pemPath, walPKPass);
const signature = walMartAfil.getWalSignature(now,consumerid,keyver,pkString);
walMartAfil.getItemsByCatagory(testCat,impactId,consumerid,now,keyver,signature);


