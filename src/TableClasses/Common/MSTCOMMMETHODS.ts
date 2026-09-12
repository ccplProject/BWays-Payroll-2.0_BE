export class MSTCOMMMETHODS {
    // ------------ Store Procedure Constants
    public static readonly SP_GET_USRAPPROLEVAL = 'Sel_GetApprovalLevel';
    public static readonly SP_GET_CONFIGERROR = 'Get_ConfigErrorData';
    public static readonly SP_GET_CONFIGERRORMAST = 'Get_ConfigErrorDataMast';
    public static readonly SP_GET_CONFIGERRORQUOT = 'Get_ConfigErrorDataQuot';
    public static readonly SP_GET_CONFIGERROROACP = 'Get_ConfigErrorDataOACP';
    public static readonly SP_GET_CHECKTRANNO = 'Get_ChkNext_TransNo';
    public static readonly SP_SEL_USERWISECOMPUNIT = 'Sel_UserWiseCompUnit';
    public static readonly SP_SEL_COMPUNITUSERWISE = 'Sel_CompUnitUserWise';
    public static readonly SP_SEL_SUBGLTRANPORTMODE = 'Sel_SubGlTranportMode';
    public static readonly SP_SEL_CONFIGTYPE = 'Sel_ConfigType';
    public static readonly SP_SEL_MATERIALTYPE = 'Sel_ConfigMatType';
    public static readonly SP_SEL_MATRATEHIST = 'Sel_MatRateHist';
    public static readonly SP_SEL_ACBALANCE = 'Sel_AcBalance';
    public static readonly SP_INS_MASTERTRANSFER = 'Ins_MasterTransfer';
    public static readonly SEL_ASSIGNEDCOMPANYLIST = 'Sel_AssignedCompanyList';

    // From CNFMATRIX
    public static readonly SP_MATRIXDETAIL = 'Get_MatrixDetail';

    // From CNFRATEGST
    public static readonly SP_Sel_CNFRATEGST = 'Sel_CNFRATEGST';
    public static readonly SP_Sel_CNFRATEGSTHSNSAC = 'Sel_CNFRATEGSTHSNSAC';

    // From MenusObject
    public static readonly SP_SEL_MENUVIEWPAGE = 'Sel_MenuViewPage';

    // From CNFPOSTKEYSGL
    public static readonly SP_SEL_CNFPOSTKEYSGL = 'Sel_CnfPostKeysGL';

    // Other SPs (Direct calls)
    public static readonly DEL_TABELDATA = 'Del_TabelData';
    public static readonly SP_GET_NEXT_TRANS_NO = 'Get_Next_Trans_No';

    public static readonly SP_GET_NEXT_REFTRANS_NO = 'Get_Next_RefTrans_No';
    public static readonly SP_GET_TRANTYPESERIES = 'Get_TranTypeSeries';
    public static readonly SP_GET_TRANSUBTYPESERIES = 'Get_TranSubTypeSeries';
    public static readonly SP_GET_NEXTMASTCODE = 'Get_Next_Master_Code';
    public static readonly SP_SEL_VEHICLEROUTERATE = 'Sel_VehicleRouteRate';
    public static readonly SP_UPD_STATUSQUARANTINE = 'Upd_StatusQuarantine';
    public static readonly SP_SEL_ITEMSTOCKDETAILSDAILY = 'Sel_ItemStockDetailsDaily';

    // ------------ Field Constants
    public static readonly COMPANY_ID = 'chrCompanyID';
    public static readonly COMPANY_UNITID = 'chrCompUnitId';
    public static readonly VOUCHER_TYPE = 'intTranType';
    public static readonly MAST_TYPE = 'intMastType';
    public static readonly VOUCHER_SERIES = 'vouseries';
    public static readonly TRAN_DATE = 'chrTranDate';
    public static readonly TRAN_NO = 'chrTranNo';
    public static readonly USER_ID = 'chrUserId';
    public static readonly SUB_GLACNO = 'intSubGlAcNo';
    public static readonly HELP_WHERE_CLAUSE = 'chrHelpColFilter';
    public static readonly OPTION_TYPE = 'intOptType';
    public static readonly USERDB = 'chrUserDB';
    public static readonly MAT_CODE = 'intMatCode';

    public static readonly QTRAN_NO = 'bintTranNo';
    public static readonly AMEND_NO = 'intAmendNo';

    public static readonly AC_NO = 'intAcNo';
    public static readonly REF_TRANNO = 'bintTranNo';
    public static readonly TO_DATE = 'chrToDate';
    public static readonly FROM_DATE = 'chrFromDate';

    public static readonly MENU_DOCNO = 'intMenuDocNo';
    public static readonly MAST_CODE = 'intMastCode';

    public static readonly STATUS_CODE = 'intStatusCode';
    public static readonly TRAN_SUBTYPE = 'intTranSubType';
    public static readonly CHNG_REMARK = 'chrChngRemark';
    public static readonly COMPID_COLUMN = 'chrCompIdColumn';
    public static readonly HELP_COLUMNS = 'chrHelpColumns';
    public static readonly SORT_ORDER_CODE = 'intSortOrderCode';
    public static readonly OUTPUT_TYPE = 'intOutputType';

    public static readonly FORMULA_CODE = 'intFormulaCode';
    public static readonly POST_TYPE = 'intPostType';

    public static readonly EFFECT_DATE = 'chrEffectDate';
    public static readonly GST_CATEGORY = 'intGSTCategory';
    public static readonly DISPLAY_MODE = 'intDisplayMode';
    public static readonly SAC_LABOURONLY = 'intSACLabourOnly';

    public static readonly COMPUNIT_ID = 'intCompUnitId';
    public static readonly POSTKEY_GROUP = 'intPostKeyGroup';

    // TRNPRCHPOH mapping for RelQuarantineOrder
    public static readonly TRNPRCHPOH_TRAN_NO = 'bintTranNo';
    public static readonly TRNPRCHPOH_AMENDNO = 'intAmendNo';
    public static readonly TRNPRCHPOH_QURR_DATE = 'chrQurrDate';
    public static readonly TRNPRCHPOH_SYSQURR_LOGIN = 'chrSysQurrLogin';
    public static readonly TRNPRCHPOH_CHNG_REMARK = 'chrChngRemark';
    public static readonly TRNPRCHPOH_STATUS_CODE = 'intStatusCode';
}
