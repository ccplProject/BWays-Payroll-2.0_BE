//-------------- BE Config 
export const __BE_PORT: number = 7002;
export const __BE_OPEN_TO: string = '0.0.0.0';

//----------- ccpl.projects@compservtech.com            uzhf bavy yfek yqgr
//------------------- Cloud
export const __CLOUD_PATH: string = "../../cloud";

///------------------- Database Backup 
export const __DB_BACKUP_AUTO: boolean = false;
export const __DB_BACKUP_AUTO_CRON: string = "0 * * * *"; /*  '* * * * *' -> 1 Min  ||  '0 0 * * *' -> 12:00 AM at night ||  '0 * * * *' --> 1 hour */
export const __DB_BACKUP_PATH: string = "D:/Macheasy/Source/DataBaseBackup/";

export const __FE_URL: string = "http://localhost:2026/";
export const __BE_URL: string = "http://localhost:7002/";
export const __OLD_SITE_URL: string = "http://192.168.1.156/bwayspayroll/Login.Aspx";

//-------------- DB Config - MSSQL (Payroll)
export const __MSSQL_DB_SERVER: string = '192.168.1.207';
export const __MSSQL_DB_PORT: number = 10433;
export const __MSSQL_DB_USER: string = "sa";
export const __MSSQL_DB_PASSWORD: string = 'Ccpl@7276';

//-------------- User DB Config - MSSQL (Prepared for future split, currently same database)
export const __MSSQL_DB_USSERVER: string = '192.168.1.207';
export const __MSSQL_DB_USPORT: number = 10433;
export const __MSSQL_DB_USUSER: string = "sa";
export const __MSSQL_DB_USPASSWORD: string = 'Ccpl@7276';

export const __MSSQL_DATABASE_MAIN: string = 'PARIKHM_20268';
export const __MSSQL_DATABASE_USER: string = 'PARIKHM_20268'; // Currently same as MAIN, can be changed to separate USERS DB in future

//-------------- Multi-Client DB Schema Version Handling
// Set to true to automatically check and filter missing columns per client DB (prevents "Invalid column name" errors)
// true  = Safe column checking ON (omits non-existent DB columns during insert/update)
// false = Safe column checking OFF (default TypeORM behaviour)
export const __SAFE_DB_COLUMN_CHECK: boolean = true;

//-------------- encryption key 
export const __LOGIN_ENC_KEY: string = "A quick brown fox jumped over lazy dog.";
export const __OTP_DATA_ENC_KEY: string = "your-32-character-key-here123456"; // Must be 16, 24, or 32 characters long
export const __USER_ENC_FOLDER_NAME: string = "users.enc"; // Must be 16, 24, or 32 characters long

///------------- OTP Login
export const __OTP_LOGIN_REQUIRED: boolean = true;
export const __OTP_SEND: boolean = true;
export const __OTP_GET_URL: string = "http://otpsms.vision360solutions.in/api/sendhttp.php?authkey=322776Ad8Sjus15XPx5e69f4ab&mobiles={mobile}&message=Dear Customer, Your OTP for verifying your account is {otp}. This OTP is valid for 10 min Thank You, Compserv Consultants&sender=CCPLBF&route=4&country=91&DLT_TE_ID=1707173130970167069";

export const __WHATSAPP_CONFIG: any = [
    {
        API_URL: "https://bways.compservtech.com/dwaysapi",
        API_USER: "uPK/9/s9bWE=",
        PASSWORD: "K+yr1gHF7A5cx1zDxX3jGg==",
        CLIENT_ID: "712588608604792",
        PARAMETER_NAME: "",
        PARAMETER_NAME_otp: "bways_otp",
    }
];

//*-------------- report 
export const __CREXPORT: string = "crexport.v2.exe";

//-------------- AI Config 
export const __AI_API_LOGSHEET: string = "http://192.168.1.207:8000/extract/";

// [commit 90]: refactor(config): add dynamic port resolution from site config
