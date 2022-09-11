import * as fs from "node:fs";
export class Logger {
  getLogFile = (timestamp) => {
    let date = timestamp.toISOString().slice(0,10).replace(/-/g,"");
    const myLog = `D:/DealsBot_NodeJS/log/${date}.json`;
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
  punchLog = (method, data) => {
    let timestamp = new Date();
    let date = timestamp.toISOString().slice(0,10).replace(/-/g,"");
    let logJson = fs.readFileSync(`D:/DealsBot_NodeJS/log/${date}.json`, "utf-8");
    let log = JSON.parse(logJson);
    log.push({
      method: method,
      data: data,
    });
    logJson = JSON.stringify(log);
    fs.writeFileSync(`D:/DealsBot_NodeJS/log/${date}.json`,logJson,"utf-8");
  };
  punchLogEnter = (method) => {
    let timestamp = new Date();
    let date = timestamp.toISOString().slice(0,10).replace(/-/g,"");
    let logJson = fs.readFileSync(`D:/DealsBot_NodeJS/log/${date}.json`, "utf-8");
    let log = JSON.parse(logJson);
    log.push({
      method: method,
      beginTime: timestamp,
    });
    logJson = JSON.stringify(log);
    fs.writeFileSync(`D:/DealsBot_NodeJS/log/${date}.json`,logJson,"utf-8");
  };
  punchLogExit = (method) => {
    let timestamp = new Date();
    let date = timestamp.toISOString().slice(0,10).replace(/-/g,"");
    let logJson = fs.readFileSync(`D:/DealsBot_NodeJS/log/${date}.json`, "utf-8");
    let log = JSON.parse(logJson);
    log.push({
      method: method,
      endTime: new Date(),
    });
    logJson = JSON.stringify(log);
    fs.writeFileSync(`D:/DealsBot_NodeJS/log/${date}.json`,logJson,"utf-8");
  };
}
