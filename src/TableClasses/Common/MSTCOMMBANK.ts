export class MSTCOMMBANK {
    public static readonly TABLE_MSTCOMMBANK = 'MSTCOMMBANK';
    public static readonly SP_INS_MSTCOMMBANK = 'Ins_MSTCOMMBANK';
    public static readonly RAW_DATA_COLUMNS = '*';
    public static readonly RAW_DATA_WHERE_CLAUSE = '';
    public static readonly HELP_DATA_COLUMNS = ' CODE, NAME, BSR_CODE, ADDRESS1, ADDRESS2, ADDRESS3, PINCODE, CITY_CODE, CONTACT_STDCODE, CONTACT_PHONENO,STATUS_CODE';
    public static readonly HELP_DATA_COMPID_COLUMN = ' CODE';
    public static readonly HELP_DATA_WHERE_CLAUSE = '';
    public static readonly SORT_ORDER_CODE = ' NAME ';

    public static readonly CODE = 'CODE';
    public static readonly NAME = 'chrName';
    public static readonly BSR_CODE = 'chrBSRCode';
    public static readonly CONTACT_STDCODE = 'chrContactStdCode';
    public static readonly CONTACT_PHONENO = 'chrContactPhoneNo';
    public static readonly ADDRESS1 = 'chrAddress1';
    public static readonly ADDRESS2 = 'chrAddress2';
    public static readonly ADDRESS3 = 'chrAddress3';
    public static readonly PINCODE = 'chrPinCode';
    public static readonly CITY_CODE = 'intCityCode';
    public static readonly SYSADD_DATETIME = 'chrSysAddDateTime';
    public static readonly SYSADD_LOGIN = 'chrSysAddLogin';
    public static readonly SYSCHNG_DATETIME = 'chrSysChngDateTime';
    public static readonly SYSCHNG_LOGIN = 'chrSysChngLogin';
    public static readonly STATUS_CODE = 'intStatusCode';
}
