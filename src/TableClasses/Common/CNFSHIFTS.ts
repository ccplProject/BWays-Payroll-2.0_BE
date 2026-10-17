export class CNFSHIFTS {
    public static readonly TABLE_CNFSHIFTS = 'CNFSHIFTS';
    public static readonly RAW_DATA_COLUMNS = '*';
    public static readonly RAW_DATA_WHERE_CLAUSE = '';
    public static readonly HELP_DATA_COMPID_COLUMN = ' COMPANY_ID';
    public static readonly HELP_DATA_COLUMNS = ' CONVERT(VARCHAR,SHIFT) SHIFT, ISNULL(CONVERT(VARCHAR,SHIFT_MARK),SHIFT) SHIFT_NAME,SHIFT_MARK,CONVERT(VARCHAR,ISNULL(CONVERT(INT,CONVERT(DECIMAL(20,2),SHIFT_TIME)),0)) SHIFT_TIME';
    public static readonly HELP_DATA_WHERE_CLAUSE = ' STATUS_CODE = 0 ';
    public static readonly SORT_ORDER_CODE = ' SHIFT ';

    public static readonly SP_INS_CNFSHIFTS = 'Ins_CNFSHIFTS';

    public static readonly COMPANY_ID = 'intCompanyID';
    public static readonly SHIFT = 'intShift';
    public static readonly SHIFTMARK = 'chrShiftMark';
    public static readonly SHIFT_MARK = 'chrShiftMark';
    public static readonly SHIFTTIME = 'chrShifTime';
    public static readonly SHIFT_TIME = 'chrShifTime';
    public static readonly FROMTIME = 'decFromTime';
    public static readonly FROM_TIME = 'decFromTime';
    public static readonly TOTIME = 'decToTime';
    public static readonly TO_TIME = 'decToTime';
    public static readonly END_TIME = 'decEndTime';
    public static readonly SYSADD_DATETIME = 'chrSysAddDateTime';
    public static readonly SYSADD_LOGIN = 'chrSysAddLogin';
    public static readonly SYSCHNG_DATETIME = 'chrSysChngDateTime';
    public static readonly SYSCHNG_LOGIN = 'chrSysChngLogin';
    public static readonly STATUS_CODE = 'intStatusCode';
}

// [commit 97]: feat(tables): add shift grace time and break duration in CNFSHIFTS
