
--------------------------------------------------------
------ US Disputes SQL - Billed only -------
------ Updated 29/04/26 - Reverted to use triumph_transactions over triumph_billed_unbilled
--------------------------------------------------------
DECLARE lookback_date default DATE_SUB(CURRENT_DATE, INTERVAL 3 MONTH);
DECLARE lookback_year default EXTRACT(YEAR from lookback_date);

with disputes as (
    select
        case_id,
        cm15,
        se10,
        dspt_am_usd,
        trans_am_usd,
        creat_ts_gmt,
        indus_cd
        from `axp-lumi.dw.gdm_dispute`
        where dspt_am_usd < 20000
        and indus_cd not like 'Airline'
        and case_id in ${case_id_list}

),

credits as (
    select
        cm15,
        se10,
        amt_trans,
        code_trans,
        date_post
    from `axp-lumi.dw.triumph_transactions`
    where code_trans= '0410' and
    date_post > lookback_date and
    --date_stmt_yr >= lookback_year
),

scoped_cases as (
    select
    a.case_id,
    a.cm15,
    a.se10,
    a.dspt_am_usd,
    a.trans_am_usd,
    a.indus_cd,
    b.prod_ds,
    d.asgn_opr_id,
    row_number() over(partition by d.ref_obj_nm order by d.updt_ts_gmt DESC) as row_nr

    from disputes a
    left join credits c on
        a.cm15 = c.cm15 and
        a.se10 = c.se10 and
        (a.dspt_am_usd = abs(c.amt_trans) or a.trans_am_usd = abs(c.amt_trans))
    left join `axp-lumi.dw.gdm_claim` b on a.cm15 = b.cm15
    left join `axp-lumi.dw.gdm_assignment` d on a.case_id = d.ref_obj_nm

    where c.code_trans is not NULL
    and b.prod_ds is not NULL
    and upper(b.prod_ds) not like '%CENTURION%'
    and upper(b.prod_ds) not like '%IDC%'
    and d.asgn_opr_id not in (
            'GD_US_Exception_Handling_2',
            'GD_US_Missing_Sedetails',
            'GD_US_Phone_IncompleteCaseSetup',
            'GD_IM_US_IntlMerchant',
            'GD_US_CST_incompleteCaseSetup',
            'GD_US_ODS_IncompleteCaseSetup',
            'GD_IM_US_HiROC20K',
            'GD_US_Centurion',
            'GD_US_Exception_Handling_4',
            'GD_US_Redisputes_WB_2',
            'GD_IM_US_TLS',
            'GD_AESC-I_Approval_4',
            'GD_AESC-I_Approval_5',
            'GD_US_ES_INTL',
            'GD_US_Exception_Handling_2',
            'OverallSLA'
            )
)

select distinct case_id
    from scoped_cases
    where row_nr = 1
;