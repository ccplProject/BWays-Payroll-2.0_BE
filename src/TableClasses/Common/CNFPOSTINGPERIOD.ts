export class CNFPOSTINGPERIOD {
    public static readonly TABLE_CNFPOSTINGPERIOD = 'CNFPOSTINGPERIOD';
    public static readonly RAW_DATA_COLUMNS = '*';
    public static readonly RAW_DATA_WHERE_CLAUSE = '';
    public static readonly HELP_DATA_COLUMNS = 'PERIOD_ID, END_DATE';
    public static readonly HELP_DATA_COMPID_COLUMN = '';
    public static readonly HELP_DATA_WHERE_CLAUSE = '';
    public static readonly SORT_ORDER_START_END = 'PERIOD_ID, END_DATE';

    // ------------ Store Procedure Constants
    public static readonly SP_GET_POSTING_DATES = 'Get_Posting_Dates';
    public static readonly SP_GET_MONTHS_LIST = 'Get_Months_List';
    public static readonly SP_GET_AMC_MONTHS_LIST = 'Get_AMCMonths_List';
    public static readonly SP_GET_WEEK_WISE_DATES = 'Get_WeekWise_Dates';
    public static readonly SP_GET_WEEKDATES = 'Get_WeekDates';
    public static readonly SP_GET_FROMTODATES = 'Get_FromToDates';

    public static readonly SP_GET_MONTHS = 'Get_Months';
    public static readonly SP_GET_YEARS = 'Get_Years';

    // ------------ Field Constants
    public static readonly COMPANY_ID = 'COMPANY_ID';
    public static readonly DISPLAY_CODE = 'display_code';
    public static readonly DAYS = 'days';
    public static readonly MTHS = 'intMths';
    public static readonly AMC_DATE = 'AMCDate';

    public static readonly LASTYEARS = 'intLastYears';
    public static readonly NEXTYEARS = 'intNextYears';

    public static readonly MONTH_DATE = 'chrMonthDate';
    public static readonly AVOID_DAY = 'chrAvoidDay';
    public static readonly FROM_DATE = 'chrFromDate';
    public static readonly TO_DATE = 'chrToDate';
}
