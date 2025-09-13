import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';
import { withTelemetry, checkRateLimit } from '@/lib/observability/withTelemetry';

// Rate limiting configuration
const RETRY_RATE_LIMIT = {
  maxRequests: 10,
  windowMs: 60 * 1000, // 1 minute
  keyPrefix: 'retry'
};

// Payload size limits
const MAX_RETRY_ITEMS = 500;
const MAX_PAYLOAD_SIZE = 1024 * 1024; // 1MB

async function retryHandler(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const supabase = getServerSupabase();

  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const runId = params.id;

  // Rate limiting check
  const rateLimitResult = checkRateLimit(user.id, RETRY_RATE_LIMIT);
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { 
        error: 'Rate limit exceeded. Please wait before retrying.',
        retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
      },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString()
        }
      }
    );
  }

  // Verify user owns this import run
  const { data: importRun, error: runError } = await supabase
    .from('import_runs')
    .select('id, user_id, source')
    .eq('id', runId)
    .eq('user_id', user.id)
    .single();

  if (runError || !importRun) {
    return NextResponse.json({ error: 'Import run not found' }, { status: 404 });
  }

  // Parse request body
  const { itemIds } = await request.json();

  if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
    return NextResponse.json({ error: 'Invalid itemIds provided' }, { status: 400 });
  }

  // Check payload size limit
  if (itemIds.length > MAX_RETRY_ITEMS) {
    return NextResponse.json(
      { 
        error: `Too many items to retry. Maximum allowed: ${MAX_RETRY_ITEMS}. Received: ${itemIds.length}`,
        suggestion: 'Please retry in smaller batches'
      },
      { status: 413 }
    );
  }

  // Log retry attempt with sanitized data
  console.log('Retry attempt:', {
    runId,
    userId: user.id,
    itemCount: itemIds.length,
    itemIds: itemIds.slice(0, 5), // Log first 5 IDs only
    timestamp: new Date().toISOString()
  });

  // Get the failed items to retry
  const { data: failedItems, error: itemsError } = await supabase
    .from('raw_import_items')
    .select('id, source_line, raw_payload, error')
    .eq('import_run_id', runId)
    .eq('user_id', user.id)
    .in('id', itemIds)
    .eq('status', 'error');

  if (itemsError) {
    console.error('Error fetching failed items:', {
      runId,
      userId: user.id,
      error: itemsError.message,
      itemCount: itemIds.length
    });
    return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 });
  }

  if (!failedItems || failedItems.length === 0) {
    return NextResponse.json({ error: 'No failed items found to retry' }, { status: 404 });
  }

  // Create a new "retry" import run
  const { data: retryRun, error: retryRunError } = await supabase
    .from('import_runs')
    .insert({
      user_id: user.id,
      source: `${importRun.source}-retry`,
      status: 'processing',
      started_at: new Date().toISOString(),
      summary: {
        total: failedItems.length,
        added: 0,
        duplicates: 0,
        errors: 0
      }
    })
    .select('id')
    .single();

  if (retryRunError) {
    console.error('Error creating retry run:', {
      runId,
      userId: user.id,
      error: retryRunError.message
    });
    return NextResponse.json({ error: 'Failed to create retry run' }, { status: 500 });
  }

  // Copy the failed items to the new run with status reset to 'parsed'
  const retryItems = failedItems.map(item => ({
    user_id: user.id,
    import_run_id: retryRun.id,
    source_line: item.source_line,
    raw_payload: item.raw_payload,
    status: 'parsed',
    created_at: new Date().toISOString()
  }));

  const { error: insertError } = await supabase
    .from('raw_import_items')
    .insert(retryItems);

  if (insertError) {
    console.error('Error inserting retry items:', {
      runId,
      retryRunId: retryRun.id,
      userId: user.id,
      error: insertError.message,
      itemCount: retryItems.length
    });
    return NextResponse.json({ error: 'Failed to create retry items' }, { status: 500 });
  }

  // Mark the original items as 'retried'
  const { error: updateError } = await supabase
    .from('raw_import_items')
    .update({ status: 'retried' })
    .eq('import_run_id', runId)
    .eq('user_id', user.id)
    .in('id', itemIds);

  if (updateError) {
    console.error('Error updating original items:', {
      runId,
      userId: user.id,
      error: updateError.message,
      itemCount: itemIds.length
    });
    // Don't fail the retry if this update fails
  }

  // Update the retry run summary
  const { error: summaryError } = await supabase
    .from('import_runs')
    .update({
      summary: {
        total: failedItems.length,
        added: failedItems.length,
        duplicates: 0,
        errors: 0
      },
      status: 'success',
      finished_at: new Date().toISOString()
    })
    .eq('id', retryRun.id);

  if (summaryError) {
    console.error('Error updating retry run summary:', {
      retryRunId: retryRun.id,
      userId: user.id,
      error: summaryError.message
    });
    // Don't fail the retry if this update fails
  }

  // Log successful retry
  console.log('Retry completed successfully:', {
    runId,
    retryRunId: retryRun.id,
    userId: user.id,
    retriedItems: failedItems.length,
    timestamp: new Date().toISOString()
  });

  return NextResponse.json({
    success: true,
    retryRunId: retryRun.id,
    retriedItems: failedItems.length
  });
}

// Export with telemetry wrapper
export const POST = withTelemetry(retryHandler, {
  route: '/api/import/runs/[id]/retry',
  redactFields: ['raw_payload', 'error'],
  maxPayloadSize: MAX_PAYLOAD_SIZE
});
