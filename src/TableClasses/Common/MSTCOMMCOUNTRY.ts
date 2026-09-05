export class MSTCOMMCOUNTRY {
    public static readonly TABLE_MSTCOMMCOUNTRY = 'MSTCOMMCOUNTRY';
    public static readonly RAW_DATA_COLUMNS = '*';
    public static readonly RAW_DATA_WHERE_CLAUSE = '';
    public static readonly HELP_DATA_COLUMNS = ' CODE, NAME,CURRENCY_CODE,STATUS_CODE';
    public static readonly HELP_DATA_COMPID_COLUMN = '';
    public static readonly HELP_DATA_WHERE_CLAUSE = '';
    public static readonly SORT_ORDER_CODE = ' NAME ';
    public static readonly SORT_ORDER_NAME = ' NAME ';

    public static readonly SP_INS_MSTCOMMCOUNTRY = 'Ins_MSTCOMMCOUNTRY';

    public static readonly CODE = 'CODE';
    public static readonly NAME = 'chrName';
    public static readonly CURRENCY_CODE = 'chrCurrencyCode';
    public static readonly SYSADD_DATETIME = 'chrSysAddDateTime';
    public static readonly SYSADD_LOGIN = 'chrSysAddLogin';
    public static readonly SYSCHNG_DATETIME = 'chrSysChngDateTime';
    public static readonly SYSCHNG_LOGIN = 'chrSysChngLogin';
    public static readonly STATUS_CODE = 'intStatusCode';
}
