import { createClient } from '@supabase/supabase-js'
import {
  BrokerAccount,
  ImportRun,
  RawImportItem,
  ExecutionNormalized,
  Trade,
  Instrument,
  InstrumentAlias,
  CorporateAction,
  BrokerAccountInsert,
  ImportRunInsert,
  RawImportItemInsert,
  ExecutionNormalizedInsert,
  TradeInsert,
  InstrumentInsert,
  InstrumentAliasInsert,
  CorporateActionInsert,
  BrokerAccountUpdate,
  ImportRunUpdate,
  RawImportItemUpdate,
  ExecutionNormalizedUpdate,
  TradeUpdate,
  InstrumentUpdate,
  InstrumentAliasUpdate,
  CorporateActionUpdate,
  ExecutionFilters,
  TradeFilters,
  ImportRunFilters,
  TABLES
} from '../types/trading'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Broker Accounts
export const brokerAccountsService = {
  async create(data: BrokerAccountInsert): Promise<BrokerAccount> {
    const { data: result, error } = await supabase
      .from(TABLES.BROKER_ACCOUNTS)
      .insert(data)
      .select()
      .single()
    
    if (error) throw error
    return result
  },

  async getById(id: string): Promise<BrokerAccount | null> {
    const { data, error } = await supabase
      .from(TABLES.BROKER_ACCOUNTS)
      .select()
      .eq('id', id)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  async getByUserId(userId: string): Promise<BrokerAccount[]> {
    const { data, error } = await supabase
      .from(TABLES.BROKER_ACCOUNTS)
      .select()
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async update(id: string, data: BrokerAccountUpdate): Promise<BrokerAccount> {
    const { data: result, error } = await supabase
      .from(TABLES.BROKER_ACCOUNTS)
      .update(data)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return result
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from(TABLES.BROKER_ACCOUNTS)
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// Import Runs
export const importRunsService = {
  async create(data: ImportRunInsert): Promise<ImportRun> {
    const { data: result, error } = await supabase
      .from(TABLES.IMPORT_RUNS)
      .insert(data)
      .select()
      .single()
    
    if (error) throw error
    return result
  },

  async getById(id: string): Promise<ImportRun | null> {
    const { data, error } = await supabase
      .from(TABLES.IMPORT_RUNS)
      .select(`
        *,
        broker_account:broker_accounts(*)
      `)
      .eq('id', id)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  async getByUserId(userId: string, filters?: ImportRunFilters): Promise<ImportRun[]> {
    let query = supabase
      .from(TABLES.IMPORT_RUNS)
      .select(`
        *,
        broker_account:broker_accounts(*)
      `)
      .eq('user_id', userId)
    
    if (filters?.source) query = query.eq('source', filters.source)
    if (filters?.status) query = query.eq('status', filters.status)
    if (filters?.date_from) query = query.gte('started_at', filters.date_from)
    if (filters?.date_to) query = query.lte('started_at', filters.date_to)
    
    const { data, error } = await query.order('started_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async update(id: string, data: ImportRunUpdate): Promise<ImportRun> {
    const { data: result, error } = await supabase
      .from(TABLES.IMPORT_RUNS)
      .update(data)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return result
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from(TABLES.IMPORT_RUNS)
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// Raw Import Items
export const rawImportItemsService = {
  async create(data: RawImportItemInsert): Promise<RawImportItem> {
    const { data: result, error } = await supabase
      .from(TABLES.RAW_IMPORT_ITEMS)
      .insert(data)
      .select()
      .single()
    
    if (error) throw error
    return result
  },

  async createMany(items: RawImportItemInsert[]): Promise<RawImportItem[]> {
    const { data, error } = await supabase
      .from(TABLES.RAW_IMPORT_ITEMS)
      .insert(items)
      .select()
    
    if (error) throw error
    return data || []
  },

  async getByImportRunId(importRunId: string): Promise<RawImportItem[]> {
    const { data, error } = await supabase
      .from(TABLES.RAW_IMPORT_ITEMS)
      .select()
      .eq('import_run_id', importRunId)
      .order('source_line', { ascending: true })
    
    if (error) throw error
    return data || []
  },

  async update(id: string, data: RawImportItemUpdate): Promise<RawImportItem> {
    const { data: result, error } = await supabase
      .from(TABLES.RAW_IMPORT_ITEMS)
      .update(data)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return result
  }
}

// Executions Normalized
export const executionsService = {
  async create(data: ExecutionNormalizedInsert): Promise<ExecutionNormalized> {
    const { data: result, error } = await supabase
      .from(TABLES.EXECUTIONS_NORMALIZED)
      .insert(data)
      .select()
      .single()
    
    if (error) throw error
    return result
  },

  async createMany(executions: ExecutionNormalizedInsert[]): Promise<ExecutionNormalized[]> {
    const { data, error } = await supabase
      .from(TABLES.EXECUTIONS_NORMALIZED)
      .insert(executions)
      .select()
    
    if (error) throw error
    return data || []
  },

  async getById(id: string): Promise<ExecutionNormalized | null> {
    const { data, error } = await supabase
      .from(TABLES.EXECUTIONS_NORMALIZED)
      .select(`
        *,
        broker_account:broker_accounts(*)
      `)
      .eq('id', id)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  async getByUserId(userId: string, filters?: ExecutionFilters): Promise<ExecutionNormalized[]> {
    let query = supabase
      .from(TABLES.EXECUTIONS_NORMALIZED)
      .select(`
        *,
        broker_account:broker_accounts(*)
      `)
      .eq('user_id', userId)
    
    if (filters?.symbol) query = query.eq('symbol', filters.symbol)
    if (filters?.instrument_type) query = query.eq('instrument_type', filters.instrument_type)
    if (filters?.side) query = query.eq('side', filters.side)
    if (filters?.broker_account_id) query = query.eq('broker_account_id', filters.broker_account_id)
    if (filters?.date_from) query = query.gte('timestamp', filters.date_from)
    if (filters?.date_to) query = query.lte('timestamp', filters.date_to)
    
    const { data, error } = await query.order('timestamp', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async getByUniqueHash(hash: string): Promise<ExecutionNormalized | null> {
    const { data, error } = await supabase
      .from(TABLES.EXECUTIONS_NORMALIZED)
      .select()
      .eq('unique_hash', hash)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  async update(id: string, data: ExecutionNormalizedUpdate): Promise<ExecutionNormalized> {
    const { data: result, error } = await supabase
      .from(TABLES.EXECUTIONS_NORMALIZED)
      .update(data)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return result
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from(TABLES.EXECUTIONS_NORMALIZED)
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// Trades
export const tradesService = {
  async create(data: TradeInsert): Promise<Trade> {
    const { data: result, error } = await supabase
      .from(TABLES.TRADES)
      .insert(data)
      .select()
      .single()
    
    if (error) throw error
    return result
  },

  async getById(id: string): Promise<Trade | null> {
    const { data, error } = await supabase
      .from(TABLES.TRADES)
      .select()
      .eq('id', id)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  async getByUserId(userId: string, filters?: TradeFilters): Promise<Trade[]> {
    let query = supabase
      .from(TABLES.TRADES)
      .select()
      .eq('user_id', userId)
    
    if (filters?.symbol) query = query.eq('symbol', filters.symbol)
    if (filters?.instrument_type) query = query.eq('instrument_type', filters.instrument_type)
    if (filters?.status) query = query.eq('status', filters.status)
    if (filters?.date_from) query = query.gte('opened_at', filters.date_from)
    if (filters?.date_to) query = query.lte('opened_at', filters.date_to)
    
    const { data, error } = await query.order('opened_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async getByGroupKey(groupKey: string): Promise<Trade[]> {
    const { data, error } = await supabase
      .from(TABLES.TRADES)
      .select()
      .eq('group_key', groupKey)
      .order('opened_at', { ascending: true })
    
    if (error) throw error
    return data || []
  },

  async update(id: string, data: TradeUpdate): Promise<Trade> {
    const { data: result, error } = await supabase
      .from(TABLES.TRADES)
      .update(data)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return result
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from(TABLES.TRADES)
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// Instruments
export const instrumentsService = {
  async create(data: InstrumentInsert): Promise<Instrument> {
    const { data: result, error } = await supabase
      .from(TABLES.INSTRUMENTS)
      .insert(data)
      .select()
      .single()
    
    if (error) throw error
    return result
  },

  async getByUniqueSymbol(symbol: string): Promise<Instrument | null> {
    const { data, error } = await supabase
      .from(TABLES.INSTRUMENTS)
      .select()
      .eq('unique_symbol', symbol)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  async getByAlias(alias: string, source?: string): Promise<Instrument | null> {
    let query = supabase
      .from(TABLES.INSTRUMENT_ALIASES)
      .select(`
        instrument:instruments(*)
      `)
      .eq('alias_symbol', alias)
    
    if (source) query = query.eq('source', source)
    
    const { data, error } = await query.single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data?.instrument ? (data.instrument as unknown as Instrument) : null
  },

  async update(id: string, data: InstrumentUpdate): Promise<Instrument> {
    const { data: result, error } = await supabase
      .from(TABLES.INSTRUMENTS)
      .update(data)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return result
  }
}

// Instrument Aliases
export const instrumentAliasesService = {
  async create(data: InstrumentAliasInsert): Promise<InstrumentAlias> {
    const { data: result, error } = await supabase
      .from(TABLES.INSTRUMENT_ALIASES)
      .insert(data)
      .select()
      .single()
    
    if (error) throw error
    return result
  },

  async getByInstrumentId(instrumentId: string): Promise<InstrumentAlias[]> {
    const { data, error } = await supabase
      .from(TABLES.INSTRUMENT_ALIASES)
      .select()
      .eq('instrument_id', instrumentId)
    
    if (error) throw error
    return data || []
  },

  async update(id: string, data: InstrumentAliasUpdate): Promise<InstrumentAlias> {
    const { data: result, error } = await supabase
      .from(TABLES.INSTRUMENT_ALIASES)
      .update(data)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return result
  }
}

// Corporate Actions
export const corporateActionsService = {
  async create(data: CorporateActionInsert): Promise<CorporateAction> {
    const { data: result, error } = await supabase
      .from(TABLES.CORPORATE_ACTIONS)
      .insert(data)
      .select()
      .single()
    
    if (error) throw error
    return result
  },

  async getBySymbol(symbol: string): Promise<CorporateAction[]> {
    const { data, error } = await supabase
      .from(TABLES.CORPORATE_ACTIONS)
      .select()
      .eq('symbol', symbol)
      .order('effective_date', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async update(id: string, data: CorporateActionUpdate): Promise<CorporateAction> {
    const { data: result, error } = await supabase
      .from(TABLES.CORPORATE_ACTIONS)
      .update(data)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return result
  }
}

// Utility functions
export const tradingUtils = {
  // Generate a group key for trades based on symbol and date
  generateTradeGroupKey(symbol: string, date: string): string {
    const dateStr = new Date(date).toISOString().split('T')[0]
    return `${symbol}_${dateStr}`
  },

  // Check if an execution already exists by unique hash
  async executionExists(hash: string): Promise<boolean> {
    const execution = await executionsService.getByUniqueHash(hash)
    return execution !== null
  },

  // Get all executions for a specific trade group
  async getExecutionsForTradeGroup(groupKey: string, userId: string): Promise<ExecutionNormalized[]> {
    const trades = await tradesService.getByGroupKey(groupKey)
    if (trades.length === 0) return []
    
    // Get all executions within the trade's time range
    const firstTrade = trades[0]
    const lastTrade = trades[trades.length - 1]
    
    return executionsService.getByUserId(userId, {
      symbol: firstTrade.symbol,
      date_from: firstTrade.opened_at,
      date_to: lastTrade.closed_at || new Date().toISOString()
    })
  }
}
