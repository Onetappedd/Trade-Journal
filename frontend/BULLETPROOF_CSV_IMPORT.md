# Bulletproof CSV Import System

## Overview
A comprehensive, production-ready CSV import system with server-side processing, idempotency, real-time status updates, and automatic trade matching.

## Key Features

### 🔒 **Security & Validation**
- **File Size Limits**: 50MB maximum file size
- **MIME Type Validation**: Only allows CSV files with proper MIME types
- **Authentication**: All endpoints require valid JWT tokens
- **RLS Protection**: All database operations respect Row Level Security

### 🚀 **Performance & Scalability**
- **Streaming/Chunked Parsing**: Processes large files without memory issues
- **Background Processing**: Non-blocking import with real-time status updates
- **Batch Processing**: Efficient database operations with chunked inserts
- **Pagination**: Limits prevent memory overflow

### 🔄 **Idempotency & Reliability**
- **Row-Level Idempotency**: SHA256 hash prevents duplicate imports
- **Upsert Logic**: Handles re-uploads gracefully
- **Error Recovery**: Comprehensive error handling and retry mechanisms
- **Status Tracking**: Real-time progress monitoring

### 🌍 **Data Normalization**
- **UTC Timestamps**: All timestamps normalized to UTC
- **Fee Mapping**: Automatic commission and fee detection
- **Broker Presets**: Pre-configured mappings for major brokers
- **Data Validation**: Comprehensive input validation and sanitization

## Architecture

### Server-Side Components

#### 1. **CSV Import API** (`/api/import/csv`)
```typescript
POST /api/import/csv
- File upload with multipart form data
- File validation (size, MIME type, extension)
- Background processing initiation
- Returns import run ID for status tracking
```

#### 2. **Status API** (`/api/import/csv?id={id}`)
```typescript
GET /api/import/csv?id={importRunId}
- Real-time status updates
- Progress tracking
- Error reporting
- Result statistics
```

#### 3. **Matching Service** (`/api/matching/process`)
```typescript
POST /api/matching/process
- Processes trade matching jobs
- Creates execution records
- Handles batch processing
- Updates job status
```

### Database Schema

#### **Import Runs Table**
```sql
CREATE TABLE import_runs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  source TEXT DEFAULT 'csv',
  status TEXT CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
  file_name TEXT,
  file_size BIGINT,
  total_rows INTEGER DEFAULT 0,
  processed_rows INTEGER DEFAULT 0,
  progress INTEGER DEFAULT 0,
  errors TEXT[] DEFAULT '{}',
  result JSONB,
  options JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **Matching Jobs Table**
```sql
CREATE TABLE matching_jobs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  import_run_id UUID REFERENCES import_runs(id),
  symbol TEXT NOT NULL,
  date DATE NOT NULL,
  status TEXT CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  result JSONB,
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **Enhanced Trades Table**
```sql
ALTER TABLE trades ADD COLUMN row_hash TEXT;
ALTER TABLE trades ADD COLUMN broker TEXT;
ALTER TABLE trades ADD COLUMN broker_trade_id TEXT;
ALTER TABLE trades ADD COLUMN import_run_id UUID REFERENCES import_runs(id);
```

### Frontend Components

#### 1. **BulletproofCSVImporter**
- File upload with drag-and-drop
- Broker preset selection
- Import options configuration
- Real-time status monitoring
- Error handling and retry logic

#### 2. **ImportStatusCard**
- Live progress updates
- Status indicators (queued, processing, completed, failed)
- Error reporting
- Result statistics
- Retry functionality

## Import Flow

### 1. **File Upload**
```
User selects CSV file
↓
Client validates file (size, type, extension)
↓
File uploaded to /api/import/csv
↓
Server validates file and creates import run
↓
Background processing initiated
↓
Returns import run ID
```

### 2. **Background Processing**
```
Parse CSV with streaming parser
↓
For each row:
  - Normalize data (timestamps, fees, etc.)
  - Compute row hash for idempotency
  - Check for existing trades
  - Insert or update trade record
↓
Update progress in real-time
↓
Create matching jobs for symbol/date batches
↓
Mark import as completed
```

### 3. **Trade Matching**
```
Matching jobs queued by symbol/date
↓
Background processor picks up jobs
↓
Group trades by symbol and side
↓
Apply matching algorithm:
  - Price tolerance (1% or $0.01)
  - Time tolerance (1 hour)
  - Quantity matching
↓
Create execution records
↓
Update job status
```

## Broker Presets

### Supported Brokers
- **E*TRADE**: Standard E*TRADE CSV format
- **TD Ameritrade**: TD Ameritrade CSV format
- **Charles Schwab**: Schwab CSV format
- **Fidelity**: Fidelity CSV format
- **Robinhood**: Robinhood CSV format

### Preset Configuration
```typescript
interface BrokerPreset {
  id: string;
  name: string;
  description: string;
  mapping: Record<string, string>;
}
```

## Error Handling

### Client-Side Errors
- File validation errors
- Network connectivity issues
- Authentication failures
- UI state management

### Server-Side Errors
- File processing errors
- Database constraint violations
- Memory limitations
- Background job failures

### Recovery Mechanisms
- Automatic retry for transient failures
- Manual retry for user-initiated failures
- Error logging and monitoring
- Graceful degradation

## Performance Optimizations

### Database
- Indexed columns for fast lookups
- Batch operations for efficiency
- Connection pooling
- Query optimization

### File Processing
- Streaming parser for large files
- Chunked processing to prevent memory issues
- Background processing to avoid timeouts
- Progress tracking for user feedback

### Caching
- Session-based caching
- Result caching for repeated operations
- Database query caching
- Static asset caching

## Monitoring & Observability

### Metrics Tracked
- Import success/failure rates
- Processing times
- File sizes and row counts
- Error frequencies
- User engagement

### Logging
- Structured logging with correlation IDs
- Error tracking and alerting
- Performance monitoring
- Audit trails

### Health Checks
- Database connectivity
- File system availability
- Background job processing
- API endpoint health

## Testing

### Unit Tests
- Individual component testing
- API endpoint testing
- Database operation testing
- Error handling testing

### Integration Tests
- End-to-end import flow
- Database integration
- File processing pipeline
- Matching algorithm testing

### E2E Tests
- User workflow testing
- Browser compatibility
- Performance testing
- Error scenario testing

## Deployment Considerations

### Environment Variables
```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Optional
MAX_FILE_SIZE=52428800  # 50MB
MAX_ROWS=100000
CHUNK_SIZE=100
```

### Database Migrations
- Run migration scripts in order
- Test migrations in staging environment
- Backup database before migrations
- Monitor migration performance

### Background Jobs
- Set up job queue (Redis, PostgreSQL, etc.)
- Configure job processors
- Set up monitoring and alerting
- Implement retry logic

## Security Considerations

### File Upload Security
- File type validation
- File size limits
- Malware scanning (optional)
- Content sanitization

### Data Protection
- Encryption in transit and at rest
- Access controls and permissions
- Audit logging
- Data retention policies

### API Security
- Rate limiting
- Authentication and authorization
- Input validation
- Output sanitization

## Future Enhancements

### Planned Features
- **Async Processing**: Queue-based job processing
- **Advanced Matching**: ML-based trade matching
- **Data Validation**: Enhanced validation rules
- **Reporting**: Import analytics and reporting
- **API Integration**: Direct broker API connections

### Scalability Improvements
- **Horizontal Scaling**: Multi-instance processing
- **Caching**: Redis-based caching layer
- **CDN**: Static asset delivery
- **Database Sharding**: Partitioned data storage

---

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Run Database Migrations**
   ```bash
   npx supabase db push
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Test Import Flow**
   - Navigate to `/import`
   - Upload a CSV file
   - Monitor status updates
   - Verify results

## Support

For issues or questions:
- Check the troubleshooting guide
- Review error logs
- Contact support team
- Submit bug reports

---

*Last updated: 2025-09-27*
*Version: 1.0.0*

