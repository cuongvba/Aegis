-- Aegis Global Cognitive Infrastructure (AGCI)
-- Patch 04: Migrate Creator Studio Topics to Pure 4-Level Hierarchy (STUDIO / YMD / CRT / TP)
-- Ensures Root, Date, Creator and Topic levels conform to SSoT naming standards.

-- 1. Ensure Root Topic 'STUDIO' exists
INSERT INTO "BankTopics" (
    "Id", "Code", "Name", "Description", "CategoryCode", "DomainCode", 
    "Scope", "MaterializedPath", "DepthLevel", "VisibilityScope", "Enabled", 
    "TenantId", "CreatedAt"
)
SELECT 
    '7fa57d9b-cb85-4dd2-9bf1-11583b9573ac', 
    'STUDIO', 
    'Creator Studio', 
    'Thư mục gốc đề thi và bài giảng Creator Zen Studio', 
    'STUDIO', 
    'EDUCATION', 
    'COMMUNITY', 
    '/STUDIO/', 
    1, 
    'PUBLIC', 
    true, 
    '00000000-0000-0000-0000-000000000000', 
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM "BankTopics" WHERE "Code" = 'STUDIO');

-- 2. Convert old flat studio topic codes (e.g. STUDIO_9967D005 -> TP9967D005)
UPDATE "BankTopics"
SET "Code" = 'TP' || SUBSTRING("Code" FROM 8)
WHERE "Code" LIKE 'STUDIO_%' AND LENGTH("Code") = 15;

-- 3. Sync questions category_code to match new TP topic codes
UPDATE "Questions"
SET "CategoryCode" = 'TP' || SUBSTRING("CategoryCode" FROM 8)
WHERE "CategoryCode" LIKE 'STUDIO_%' AND LENGTH("CategoryCode") = 15;

-- 4. Normalize Creator Folders containing CRTTEACH to pure CRT
UPDATE "BankTopics"
SET 
    "Code" = REPLACE("Code", 'CRTTEACH', 'CRT'),
    "Name" = REPLACE("Name", 'CRTTEACH', 'CRT'),
    "MaterializedPath" = REPLACE("MaterializedPath", 'CRTTEACH', 'CRT')
WHERE "Code" LIKE '%CRTTEACH%';

-- 5. Normalize Creator Partnerships referral codes from TEACH-XXXX to CRTXXXX
UPDATE "EducatorPartnerships"
SET "ReferralCode" = 'CRT' || REGEXP_REPLACE("ReferralCode", '^(TEACH|CRT)[-_]?', '', 'i')
WHERE "ReferralCode" LIKE 'TEACH%';

