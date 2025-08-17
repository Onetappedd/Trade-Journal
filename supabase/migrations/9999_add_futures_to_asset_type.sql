DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'asset_type') THEN
    BEGIN
      ALTER TYPE asset_type ADD VALUE IF NOT EXISTS 'futures';
    EXCEPTION WHEN duplicate_object THEN NULL; END;
  ELSIF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'trade_asset_type') THEN
    BEGIN
      ALTER TYPE trade_asset_type ADD VALUE IF NOT EXISTS 'futures';
    EXCEPTION WHEN duplicate_object THEN NULL; END;
  END IF;
END $$;