-- Migration: Legacy Import Tables
-- Description: Rename old import tables to legacy versions and revoke write permissions
-- Date: 2025-01-15
-- Note: Drop after 30 days.

-- Rename existing import tables to legacy versions (if they exist)
DO $$
BEGIN
    -- Rename import_runs to import_runs_legacy
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'import_runs' AND table_schema = 'public') THEN
        ALTER TABLE public.import_runs RENAME TO import_runs_legacy;
        RAISE NOTICE 'Renamed import_runs to import_runs_legacy';
    END IF;

    -- Rename raw_import_items to raw_import_items_legacy
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'raw_import_items' AND table_schema = 'public') THEN
        ALTER TABLE public.raw_import_items RENAME TO raw_import_items_legacy;
        RAISE NOTICE 'Renamed raw_import_items to raw_import_items_legacy';
    END IF;

    -- Rename import_mapping_presets to import_mapping_presets_legacy
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'import_mapping_presets' AND table_schema = 'public') THEN
        ALTER TABLE public.import_mapping_presets RENAME TO import_mapping_presets_legacy;
        RAISE NOTICE 'Renamed import_mapping_presets to import_mapping_presets_legacy';
    END IF;

    -- Rename executions_normalized to executions_normalized_legacy
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'executions_normalized' AND table_schema = 'public') THEN
        ALTER TABLE public.executions_normalized RENAME TO executions_normalized_legacy;
        RAISE NOTICE 'Renamed executions_normalized to executions_normalized_legacy';
    END IF;
END $$;

-- Revoke write permissions on legacy tables from authenticated users
-- Keep SELECT permissions for read-only access

-- Revoke INSERT/UPDATE/DELETE on import_runs_legacy
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'import_runs_legacy' AND table_schema = 'public') THEN
        REVOKE INSERT, UPDATE, DELETE ON public.import_runs_legacy FROM authenticated;
        RAISE NOTICE 'Revoked write permissions on import_runs_legacy';
    END IF;
END $$;

-- Revoke INSERT/UPDATE/DELETE on raw_import_items_legacy
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'raw_import_items_legacy' AND table_schema = 'public') THEN
        REVOKE INSERT, UPDATE, DELETE ON public.raw_import_items_legacy FROM authenticated;
        RAISE NOTICE 'Revoked write permissions on raw_import_items_legacy';
    END IF;
END $$;

-- Revoke INSERT/UPDATE/DELETE on import_mapping_presets_legacy
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'import_mapping_presets_legacy' AND table_schema = 'public') THEN
        REVOKE INSERT, UPDATE, DELETE ON public.import_mapping_presets_legacy FROM authenticated;
        RAISE NOTICE 'Revoked write permissions on import_mapping_presets_legacy';
    END IF;
END $$;

-- Revoke INSERT/UPDATE/DELETE on executions_normalized_legacy
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'executions_normalized_legacy' AND table_schema = 'public') THEN
        REVOKE INSERT, UPDATE, DELETE ON public.executions_normalized_legacy FROM authenticated;
        RAISE NOTICE 'Revoked write permissions on executions_normalized_legacy';
    END IF;
END $$;
