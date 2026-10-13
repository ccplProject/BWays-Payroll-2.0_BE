export class USERS {
    public static readonly TABLE_USERS = 'USERS';
    public static readonly TABLE_USERSEDIST = 'USERSEDIST';
    public static readonly TABLE_USERSECONT = 'USERSECONT';
    public static readonly TABLE_USERSEPROC = 'USERSEPROC';

    public static readonly RAW_DATA_COLUMNS = '*';
    public static readonly RAW_DATA_WHERE_CLAUSE = '';
    public static readonly HELP_DATA_COLUMNS = "USER_ID, UPPER(NAME) AS NAME, NAME +' '+ USER_ID NAME_USERID, USER_TYPE";
    public static readonly HELP_DATA_COMPID_COLUMN = '  ';
    public static readonly HELP_DATA_WHERE_CLAUSE = 'STATUS_CODE=0';
    public static readonly SORT_ORDER_CODE = 'USER_ID';

    public static readonly SP_SEL_USERS = 'Sel_USERS';
    public static readonly SP_GET_USER_INFO = 'Sel_GetUserInfo';
    public static readonly SP_INS_USERS = 'Ins_USERS';
    public static readonly SP_UPD_USERS = 'Upd_USERS';
    public static readonly SP_BACKUPDB = 'sp_backupDb';

    public static readonly COMPANY_ID = 'chrCompanyID';
    public static readonly USER_ID = 'chrUserId';
    public static readonly USER_TYPE = 'intUserType';
    public static readonly USER_NAME = 'chrUserName';
    public static readonly PASSWORD = 'chrPassword';
    public static readonly DEPARTMENT = 'chrDepartment';
    public static readonly DESG_CODE = 'intDesgCode';
    public static readonly CELL_NO = 'chrCellNo';
    public static readonly EMAIL_ID = 'chrEmailId';
    public static readonly CREATED_DATE = 'chrCreatedDate';
    public static readonly VALID_TILL_DATE = 'chrValidTillDate';
    public static readonly PASSWORD_AGE = 'intPassAge';
    public static readonly STATUS_CODE = 'intStatusCode';
    public static readonly TYPE = 'intType';
    public static readonly MODULE_NO = 'intModuleNo';
    public static readonly EMP_CODE = 'intEmpCode';
    public static readonly DBNAME = 'dbname';
    public static readonly FILEPATH = 'filepath';
    public static readonly LOGIN_IDENTITY = 'intLoginIdentity';
}

// [commit 92]: feat(tables): add active flag and role fields to USERS table model
