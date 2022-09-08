import * as fs from "node:fs";
import * as path from 'path';
export class Logger {
  getLogFile = (date) => {
    var myLog = `D:/DealsBot_NodeJS/log/${date}.json`;
""
    // See if the file exists
    if (fs.existsSync(myLog)) {
      console.log("Log exits");
    } else {
      console.log("Creating Daily Log");
      let logBody = [];
      let logJson = JSON.stringify(logBody);
      fs.writeFileSync(`D:/DealsBot_NodeJS/log/${date}.json`, logJson, "utf-8");
    }
  };
  punchLog = (method, date, data, timestamp) => {
    let logJson = fs.readFileSync(`D:/DealsBot_NodeJS/log/${date}.json`, "utf-8");
    let log = JSON.parse(logJson);
    log.push({
      method: method,
      beginTime: timestamp,
      data: data,
      endTime: new Date(),
    });
    logJson = JSON.stringify(log);
    fs.writeFileSync(`D:/DealsBot_NodeJS/log/${date}.json`,logJson,"utf-8");
  };
}

var rightNow = new Date();
var res = rightNow.toISOString().slice(0,10).replace(/-/g,"");
const log = new Logger();
log.getLogFile(res);
log.punchLog("sample",res,"This is a test of the logging class",rightNow);
