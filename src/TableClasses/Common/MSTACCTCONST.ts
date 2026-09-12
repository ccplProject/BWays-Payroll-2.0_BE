export class MSTACCTCONST {
    public static readonly TABLE_MSTACCTCONST = 'MSTACCTCONST';
    public static readonly RAW_DATA_COLUMNS = '*';
    public static readonly RAW_DATA_WHERE_CLAUSE = '';
    public static readonly HELP_DATA_COLUMNS = ' COMPANY_ID, CODE, NAME, ISNULL(GL_ACNO,0) GL_ACNO, SUB_GLACNO';
    public static readonly HELP_DATA_COMPID_COLUMN = ' COMPANY_ID';
    public static readonly HELP_DATA_WHERE_CLAUSE = ' STATUS_CODE = 0';
    public static readonly SORT_ORDER_CODE = ' CODE ';

    public static readonly SP_INS_MSTACCTCONST = 'Ins_MSTACCTCONST';
    public static readonly SP_SEL_CONSTANTCODELIST = 'Sel_ConstantCodeList';

    public static readonly COMPANY_ID = 'chrCompanyID';
    public static readonly CODE = 'intCode';
    public static readonly NAME = 'chrName';
    public static readonly GL_ACNO = 'intGLACNo';
    public static readonly SUB_GLACNO = 'intSUBGLACNo';
    public static readonly DESCRIPTION = 'chrDesc';
    public static readonly IS_NOTEDITABLE = 'intNotEditable';
    public static readonly SYSADD_DATETIME = 'chrSysAddDateTime';
    public static readonly SYSADD_LOGIN = 'chrSysAddLogin';
    public static readonly SYSCHNG_DATETIME = 'chrSysChngDateTime';
    public static readonly SYSCHNG_LOGIN = 'chrSysChngLogin';
    public static readonly STATUS_CODE = 'intStatusCode';
    public static readonly USERDB = 'chrUserDB';
}
