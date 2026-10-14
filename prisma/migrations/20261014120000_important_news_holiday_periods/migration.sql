-- Новости: пометка «Важное»
ALTER TABLE "ContentItem" ADD COLUMN "isImportant" BOOLEAN NOT NULL DEFAULT false;

-- Праздники: вместо одного дня на запись храним период (startDate - endDate)
DROP INDEX IF EXISTS "CompanyHoliday_date_key";
ALTER TABLE "CompanyHoliday" RENAME COLUMN "date" TO "startDate";
ALTER TABLE "CompanyHoliday" ADD COLUMN "endDate" DATE;
UPDATE "CompanyHoliday" SET "endDate" = "startDate";

-- Склеиваем подряд идущие дни с одинаковым названием в один период
WITH islands AS (
  SELECT
    "id",
    "name",
    "startDate",
    "startDate" - (ROW_NUMBER() OVER (PARTITION BY "name" ORDER BY "startDate"))::int AS grp
  FROM "CompanyHoliday"
),
merged AS (
  SELECT
    (ARRAY_AGG("id" ORDER BY "startDate"))[1] AS keep_id,
    MAX("startDate") AS last_day
  FROM islands
  GROUP BY "name", grp
)
UPDATE "CompanyHoliday" h
SET "endDate" = m.last_day
FROM merged m
WHERE h."id" = m.keep_id;

DELETE FROM "CompanyHoliday"
WHERE "id" NOT IN (
  SELECT (ARRAY_AGG("id" ORDER BY "startDate"))[1]
  FROM (
    SELECT "id", "name", "startDate",
      "startDate" - (ROW_NUMBER() OVER (PARTITION BY "name" ORDER BY "startDate"))::int AS grp
    FROM "CompanyHoliday"
  ) t
  GROUP BY "name", grp
);

ALTER TABLE "CompanyHoliday" ALTER COLUMN "endDate" SET NOT NULL;
