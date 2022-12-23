import { createLogger, transports, format } from "winston";
import fs from "fs";
// create a custom logger class using winston as the base
export class Logger {
    // function that takes a logging level then check to see if the log file exists for current date
    // if it does not exist it will create it
    public static checkForLogFile = () => {
        const date = new Date();
        const logFile = `./logs/${date.getFullYear()}-(${date.getMonth()}+1)-${date.getDate()}.log`;
        if (!fs.existsSync(logFile)) {
            fs.writeFileSync(logFile, "");
        }
        return logFile;
    }
    


    // function that creates a logger object
    public static createLogger = (level: string) => {
        const logFile = Logger.checkForLogFile();
        const logger = createLogger({
            level: level,
            format: format.combine(
                format.timestamp(),
                format.json()
            ),
            transports: [
                new transports.File({ filename: logFile })  // log to a file
            ]   
        }); 
        return logger;
    } 
} 