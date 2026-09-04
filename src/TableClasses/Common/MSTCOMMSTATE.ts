export class MSTCOMMSTATE {
    public static readonly TABLE_MSTCOMMSTATE = 'MSTCOMMSTATE';
    public static readonly RAW_DATA_COLUMNS = '*';
    public static readonly RAW_DATA_WHERE_CLAUSE = '';
    public static readonly HELP_DATA_COLUMNS = ' CODE, NAME, STATUS_CODE,EWAYBILL_STATE';
    public static readonly HELP_DATA_COMPID_COLUMN = '';
    public static readonly HELP_DATA_WHERE_CLAUSE = '';
    public static readonly SORT_ORDER_CODE = ' CODE ';
    public static readonly SORT_ORDER_NAME = ' NAME ';
    public static readonly SP_INS_MSTCOMMSTATE = 'Ins_MSTCOMMSTATE';

    public static readonly CODE = 'intCODE';
    public static readonly SHORT_NAME = 'chrShortName';
    public static readonly NAME = 'chrName';
    public static readonly EWAYBILL_STATE = 'chrEwayBillState';
    public static readonly SYSADD_DATETIME = 'chrSysAddDateTime';
    public static readonly SYSADD_LOGIN = 'chrSysAddLogin';
    public static readonly SYSCHNG_DATETIME = 'chrSysChngDateTime';
    public static readonly SYSCHNG_LOGIN = 'chrSysChngLogin';
    public static readonly STATUS_CODE = 'intStatusCode';
}
