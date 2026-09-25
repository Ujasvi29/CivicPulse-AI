-- CivicPulse AI Migration 004: Optional assigned department column
-- Allows explicit separation of AI recommendation vs Admin manual assignment

ALTER TABLE public.reports 
ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_reports_department_id ON public.reports(department_id);
