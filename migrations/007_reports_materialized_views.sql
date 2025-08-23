-- Migration: Create reports schema and materialized views for reporting (Sprint 0)
-- Run this migration against your Postgres / Supabase database.

CREATE SCHEMA IF NOT EXISTS reports;

-- Daily revenue by service (from treatment_payments joined to treatments)
CREATE MATERIALIZED VIEW IF NOT EXISTS reports.daily_revenue_by_service AS
SELECT
  tp.clinic_id,
  tp.payment_date::date AS day,
  COALESCE(t.description, 'Sin Categorizar') AS service,
  SUM(tp.amount_paid)::numeric AS revenue
FROM public.treatment_payments tp
LEFT JOIN public.treatments t ON tp.treatment_id = t.id
GROUP BY tp.clinic_id, day, service;

CREATE INDEX IF NOT EXISTS idx_reports_daily_revenue_by_service_clinic_day ON reports.daily_revenue_by_service (clinic_id, day);

-- Monthly revenue (aggregate treatment_payments + general_payments)
CREATE MATERIALIZED VIEW IF NOT EXISTS reports.monthly_revenue AS
SELECT
  COALESCE(tp.clinic_id, gp.clinic_id) AS clinic_id,
  date_trunc('month', COALESCE(tp.payment_date, gp.payment_date))::date AS month,
  SUM(COALESCE(tp.amount_paid, 0) + COALESCE(gp.amount, 0))::numeric AS revenue
FROM (
  SELECT payment_date, clinic_id, amount_paid FROM public.treatment_payments
) tp
FULL OUTER JOIN (
  SELECT payment_date, clinic_id, amount FROM public.general_payments
) gp ON tp.payment_date = gp.payment_date AND tp.clinic_id = gp.clinic_id
GROUP BY COALESCE(tp.clinic_id, gp.clinic_id), date_trunc('month', COALESCE(tp.payment_date, gp.payment_date));

CREATE INDEX IF NOT EXISTS idx_reports_monthly_revenue_clinic_month ON reports.monthly_revenue (clinic_id, month);

-- Appointments by doctor (counts)
CREATE MATERIALIZED VIEW IF NOT EXISTS reports.appointments_by_doctor AS
SELECT
  a.clinic_id,
  a.doctor_id,
  COUNT(*) AS appointments
FROM public.appointments a
GROUP BY a.clinic_id, a.doctor_id;

CREATE INDEX IF NOT EXISTS idx_reports_appointments_by_doctor_clinic ON reports.appointments_by_doctor (clinic_id);

-- Quotes overview
CREATE MATERIALIZED VIEW IF NOT EXISTS reports.quotes_overview AS
SELECT
  q.clinic_id,
  q.status,
  COUNT(*) AS count,
  SUM(q.total_amount)::numeric AS total_amount
FROM public.quotes q
GROUP BY q.clinic_id, q.status;

CREATE INDEX IF NOT EXISTS idx_reports_quotes_overview_clinic ON reports.quotes_overview (clinic_id);

-- New patients by day
CREATE MATERIALIZED VIEW IF NOT EXISTS reports.new_patients_by_day AS
SELECT
  p.clinic_id,
  p.created_at::date AS day,
  COUNT(*) AS new_patients
FROM public.patients p
GROUP BY p.clinic_id, day;

CREATE INDEX IF NOT EXISTS idx_reports_new_patients_by_day_clinic ON reports.new_patients_by_day (clinic_id, day);

-- UNIQUE indexes for CONCURRENTLY refresh safety
CREATE UNIQUE INDEX IF NOT EXISTS uq_reports_daily_revenue_by_service ON reports.daily_revenue_by_service (clinic_id, day, service);
CREATE UNIQUE INDEX IF NOT EXISTS uq_reports_monthly_revenue ON reports.monthly_revenue (clinic_id, month);
CREATE UNIQUE INDEX IF NOT EXISTS uq_reports_appointments_by_doctor ON reports.appointments_by_doctor (clinic_id, doctor_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_reports_quotes_overview ON reports.quotes_overview (clinic_id, status);
CREATE UNIQUE INDEX IF NOT EXISTS uq_reports_new_patients_by_day ON reports.new_patients_by_day (clinic_id, day);

-- Refresh helper
CREATE OR REPLACE FUNCTION reports.refresh_all_materialized_views() RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  -- If CONCURRENTLY is not possible in your environment, remove CONCURRENTLY.
  BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY reports.daily_revenue_by_service;
  EXCEPTION WHEN others THEN
    REFRESH MATERIALIZED VIEW reports.daily_revenue_by_service;
  END;

  BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY reports.monthly_revenue;
  EXCEPTION WHEN others THEN
    REFRESH MATERIALIZED VIEW reports.monthly_revenue;
  END;

  BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY reports.appointments_by_doctor;
  EXCEPTION WHEN others THEN
    REFRESH MATERIALIZED VIEW reports.appointments_by_doctor;
  END;

  BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY reports.quotes_overview;
  EXCEPTION WHEN others THEN
    REFRESH MATERIALIZED VIEW reports.quotes_overview;
  END;

  BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY reports.new_patients_by_day;
  EXCEPTION WHEN others THEN
    REFRESH MATERIALIZED VIEW reports.new_patients_by_day;
  END;
END;
$$;

-- Notes:
-- 1) To schedule refreshes, call: SELECT reports.refresh_all_materialized_views(); from a cron job or your platform's scheduler.
-- 2) CONCURRENTLY requires that a unique index exists on the materialized view; if you encounter errors, remove CONCURRENTLY or add appropriate unique indexes.
-- 3) Adjust types/joins if your schema differs. Always test on staging before production.
