export class MSTCOMMEMPLOYEE {
    public static readonly TABLE_MSTCOMMEMPLOYEE = 'MSTCOMMEMPLOYEE';
    public static readonly RAW_DATA_COLUMNS = '*';
    public static readonly RAW_DATA_WHERE_CLAUSE = '';
    public static readonly HELP_DATA_COMPID_COLUMN = '';
    public static readonly HELP_DATA_COLUMNS = 'CONVERT(VARCHAR,CODE) CODE,UPPER(NAME) AS NAME,PARENT_CODE,SUB_GLACNO,DISCLEVEL_CODE,REGION_CODE,USER_ID,ISNULL(DEPT_CODE,0) DEPT_CODE';
    public static readonly HELP_DATA_WHERE_CLAUSE = '';
    public static readonly SORT_ORDER_CODE = ' NAME ';

    public static readonly SP_INS_MSTCOMMEMPLOYEE = 'Ins_MSTCOMMEMPLOYEE';

    public static readonly CODE = 'Code';
    public static readonly NAME = 'chrName';
    public static readonly SHORT_NAME = 'chrShortName';
    public static readonly DESIG_CODE = 'intDesigcode';
    public static readonly DESG_CODE = 'intDesigcode';
    public static readonly DISC_LEVEL = 'intDiscLevel';
    public static readonly DISCLEVEL_CODE = 'intDiscLevel';
    public static readonly REGION_CODE = 'intRegionCode';
    public static readonly SUB_GLACNO = 'intSubGlAcNo';
    public static readonly REPORT_TO = 'intParentCode';
    public static readonly PARENT_CODE = 'intParentCode';
    public static readonly JOB_DESCRIPTION = 'chrJobDecsription';
    public static readonly EXPERIENCE = 'decExperience';
    public static readonly QUALIFICATION = 'chrQualification';
    public static readonly SPECIALIZATION = 'chrSpecialization';
    public static readonly JOINING_DATE = 'chrJoiningDate';
    public static readonly CONFIRMATION_DATE = 'chrConfirmationDate';
    public static readonly LEAVING_DATE = 'chrLeavingDate';
    public static readonly TRAINING_COURSES = 'chrTrainingCourses';
    public static readonly DEPT_CODE = 'intDeptCode';
    public static readonly COMPANY_ID = 'intcompanyID';
    public static readonly ADDRESS1 = 'chrAddress1';
    public static readonly PINCODE = 'chrPinCode';
    public static readonly CITY_CODE = 'intCityCode';
    public static readonly PHONE_NO = 'chrPhoneNo';
    public static readonly CELL_NO = 'chrCellNo';
    public static readonly EMAIL_ID = 'chrEmailId';
    public static readonly SEX = 'chrSex';
    public static readonly IS_ACTIVE = 'intIsActive';
    public static readonly USER_ID = 'ChrUserId';
    public static readonly EMP_NO = 'intEmpNo';
    public static readonly SYSADD_DATETIME = 'chrSysAddDateTime';
    public static readonly SYSADD_LOGIN = 'chrSysAddLogin';
    public static readonly SYSCHNG_DATETIME = 'chrSysChngDateTime';
    public static readonly SYSCHNG_LOGIN = 'chrSysChngLogin';
    public static readonly STATUS_CODE = 'intStatusCode';
}
