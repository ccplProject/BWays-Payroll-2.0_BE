export class MENUS {
    public static readonly TABLE_MENUS = 'MENUS';
    public static readonly TABLE_MENUEDIST = 'MENUSEDIST';
    public static readonly TABLE_MENUECONT = 'MENUSECONT';
    public static readonly TABLE_MENUEPROC = 'MENUSEPROC';

    public static readonly RAW_DATA_COLUMNS = '*';
    public static readonly RAW_DATA_WHERE_CLAUSE = '';
    public static readonly HELP_DATA_COLUMNS = '';
    public static readonly HELP_DATA_COMPID_COLUMN = '';
    public static readonly HELP_DATA_WHERE_CLAUSE = '';
    public static readonly SORT_ORDER_TRANNO = '';

    public static readonly SP_SEL_MENU = 'Sel_GetMainMenu';
    public static readonly SP_SEL_LEFTLINKS = 'Sel_GetLeftLinks';
    public static readonly SP_SEL_CHECKPAGE = 'Sel_CheckPage';
    public static readonly SP_SEL_MENUVIEWPAGE = 'Sel_MenuViewPage';
    public static readonly SP_SEL_MODULEWISEMENU = 'Sel_GetModuleWiseMainMenu';

    public static readonly COMPANY_ID = 'chrCompanyID';
    public static readonly PARENT = 'chrParent';
    public static readonly USER = 'chrUserId';
    public static readonly MENUKEY = 'chrMenuKey';
    public static readonly MODULENO = 'chrModuleNo';
    public static readonly MENU_DOCNO = 'intMenuDocNo';
    public static readonly LOGIN_IDENTITY = 'intLoginIdentity';
}
