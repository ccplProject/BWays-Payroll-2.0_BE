-- ====================================================================================================
-- DATABASE SCRIPT & SCHEMA NOTES FOR PAYROLL 2.0
-- ====================================================================================================
-- Server: 192.168.1.207,10433
-- User: sa
-- Current Single Database: PARIKHM_20268
-- ====================================================================================================

-- 1. CURRENT SCHEMA (Single Database):
-- Both User tables and Payroll application tables reside together in 'PARIKHM_20268':
-- User Tables:
--   - USRMSTUSERS      (User credentials, password, status, module access)
--   - USRUSERROLES     (User role assignments)
--   - USRUSERSLOG      (Login / work log history)
--   - TRNSYSUSERAUTHO  (User authorization permissions)
--
-- Payroll Tables:
--   - CNFCOMPANY       (Company master, settings, formats)
--   - CNFCOMPANYLOG    (Company change log)
--   - MSTEMPLOYEE      (Employee master)
--   - Payroll masters and transaction tables

-- ====================================================================================================
-- 2. FUTURE MIGRATION SCRIPT (When splitting into separate USERS and PAYROLL databases):
-- ====================================================================================================
/*
-- STEP 1: Create separate USERS database
CREATE DATABASE PAYROLL_USERS;
GO

-- STEP 2: Transfer user tables from PARIKHM_20268 into PAYROLL_USERS
SELECT * INTO PAYROLL_USERS.dbo.USRMSTUSERS FROM PARIKHM_20268.dbo.USRMSTUSERS;
SELECT * INTO PAYROLL_USERS.dbo.USRUSERROLES FROM PARIKHM_20268.dbo.USRUSERROLES;
SELECT * INTO PAYROLL_USERS.dbo.USRUSERSLOG FROM PARIKHM_20268.dbo.USRUSERSLOG;
SELECT * INTO PAYROLL_USERS.dbo.TRNSYSUSERAUTHO FROM PARIKHM_20268.dbo.TRNSYSUSERAUTHO;
GO

-- STEP 3: In Backend 'src/config/config.config.ts':
-- Update:
-- export const __MSSQL_DATABASE_USER: string = 'PAYROLL_USERS';
-- export const __MSSQL_DATABASE_MAIN: string = 'PARIKHM_20268';
*/

