import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';
import { z } from 'zod';

// Force Node.js runtime
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Validation schemas
const CreatePresetSchema = z.object({
  name: z.string().min(1).max(100),
  broker_hint: z.string().optional(),
  file_glob: z.string().optional(),
  fields: z.record(z.string()),
});

const GetPresetsSchema = z.object({
  filename: z.string().optional(),
  broker_hint: z.string().optional(),
});

// Helper function to check if a filename matches a glob pattern
function matchesGlob(filename: string, glob: string): boolean {
  if (!glob) return false;
  
  try {
    // Simple glob matching - convert glob to regex
    const regexPattern = glob
      .replace(/\./g, '\\.')  // Escape dots
      .replace(/\*/g, '.*')   // Convert * to .*
      .replace(/\?/g, '.')    // Convert ? to .
      .replace(/\[/g, '\\[')  // Escape [
      .replace(/\]/g, '\\]')  // Escape ]
      .replace(/\(/g, '\\(')  // Escape (
      .replace(/\)/g, '\\)');  // Escape )
    
    const regex = new RegExp(`^${regexPattern}$`, 'i');
    const result = regex.test(filename);
    console.log(`[Glob Match] Testing "${filename}" against glob "${glob}" (regex: ${regexPattern}) = ${result}`);
    return result;
  } catch (error) {
    console.error(`[Glob Match] Error matching "${filename}" against glob "${glob}":`, error);
    return false;
  }
}

// Helper function to calculate preset match score
function calculateMatchScore(preset: any, filename?: string, brokerHint?: string): number {
  let score = 0;
  
  // Broker hint match (highest priority)
  if (brokerHint && preset.broker_hint && 
      preset.broker_hint.toLowerCase() === brokerHint.toLowerCase()) {
    score += 100;
  }
  
  // Filename glob match
  if (filename && preset.file_glob && matchesGlob(filename, preset.file_glob)) {
    score += 50;
  }
  
  // Partial broker hint match
  if (brokerHint && preset.broker_hint && 
      preset.broker_hint.toLowerCase().includes(brokerHint.toLowerCase())) {
    score += 25;
  }
  
  // Partial filename match
  if (filename && preset.file_glob && 
      filename.toLowerCase().includes(preset.file_glob.replace(/\*/g, '').toLowerCase())) {
    score += 10;
  }
  
  return score;
}

export async function GET(request: NextRequest) {
  try {
    console.log('[Presets API] Starting request');
    console.log('[Presets API] Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing');
    console.log('[Presets API] Supabase Anon Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing');
    const supabase = getServerSupabase();
    
    // Get authenticated user
    console.log('[Presets API] Getting user authentication');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('[Presets API] Auth error:', authError);
      return NextResponse.json({ error: 'Authentication error' }, { status: 401 });
    }
    
    if (!user) {
      console.log('[Presets API] No user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log('[Presets API] User authenticated:', user.id);

    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');
    const brokerHint = searchParams.get('broker_hint');

    console.log('[Presets API] Raw filename:', filename);
    console.log('[Presets API] Raw broker_hint:', brokerHint);

    // Validate query parameters
    const validation = GetPresetsSchema.safeParse({ filename, broker_hint: brokerHint });
    if (!validation.success) {
      console.error('[Presets API] Validation failed:', validation.error);
      return NextResponse.json({ error: 'Invalid query parameters', details: validation.error }, { status: 400 });
    }

    // Get user's presets
    console.log('[Presets API] Fetching user presets for user:', user.id);
    const { data: userPresets, error: userError } = await supabase
      .from('import_mapping_presets')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (userError) {
      console.error('Error fetching user presets:', userError);
      return NextResponse.json({ error: 'Failed to fetch presets' }, { status: 500 });
    }

    console.log('[Presets API] User presets found:', userPresets?.length || 0);

    // Get system presets (with dummy user_id)
    console.log('[Presets API] Fetching system presets');
    const { data: systemPresets, error: systemError } = await supabase
      .from('import_mapping_presets')
      .select('*')
      .eq('user_id', '00000000-0000-0000-0000-000000000000')
      .order('name', { ascending: true });

    if (systemError) {
      console.error('Error fetching system presets:', systemError);
      // Continue without system presets
    }

    console.log('[Presets API] System presets found:', systemPresets?.length || 0);

    // Combine and score presets
    const allPresets = [
      ...(userPresets || []),
      ...(systemPresets || [])
    ];

    // Calculate match scores and sort by relevance
    const scoredPresets = allPresets.map(preset => ({
      ...preset,
      matchScore: calculateMatchScore(preset, filename || undefined, brokerHint || undefined),
      isUserPreset: preset.user_id === user.id
    }));

    // Sort by match score (highest first), then by user presets first, then by name
    scoredPresets.sort((a, b) => {
      if (a.matchScore !== b.matchScore) {
        return b.matchScore - a.matchScore;
      }
      if (a.isUserPreset !== b.isUserPreset) {
        return a.isUserPreset ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });

    // Find best match
    const bestMatch = scoredPresets.find(p => p.matchScore > 0);

    return NextResponse.json({
      presets: scoredPresets,
      bestMatch: bestMatch || null,
      totalCount: scoredPresets.length
    });

  } catch (error) {
    console.error('Get presets error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getServerSupabase();
    
    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate request body
    const validation = CreatePresetSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { name, broker_hint, file_glob, fields } = validation.data;

    // Check if preset with same name already exists for this user
    const { data: existingPreset, error: checkError } = await supabase
      .from('import_mapping_presets')
      .select('id')
      .eq('user_id', user.id)
      .eq('name', name)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking existing preset:', checkError);
      return NextResponse.json({ error: 'Failed to check existing preset' }, { status: 500 });
    }

    if (existingPreset) {
      return NextResponse.json({ error: 'Preset with this name already exists' }, { status: 409 });
    }

    // Create new preset
    const { data: newPreset, error: createError } = await supabase
      .from('import_mapping_presets')
      .insert({
        user_id: user.id,
        name,
        broker_hint,
        file_glob,
        fields
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating preset:', createError);
      return NextResponse.json({ error: 'Failed to create preset' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Preset created successfully',
      preset: newPreset
    }, { status: 201 });

  } catch (error) {
    console.error('Create preset error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
