import { type NextRequest, NextResponse } from 'next/server';

// Mock tags data
const mockTags = [
  {
    id: 'tag-1',
    name: 'swing-trade',
    user_id: 'user-1',
    color: '#10b981',
    description: 'Medium-term position trades',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'tag-2',
    name: 'day-trade',
    user_id: 'user-1',
    color: '#f59e0b',
    description: 'Intraday trades',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'tag-3',
    name: 'earnings-play',
    user_id: 'user-1',
    color: '#8b5cf6',
    description: 'Trades around earnings announcements',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'tag-4',
    name: 'breakout',
    user_id: 'user-1',
    color: '#06b6d4',
    description: 'Technical breakout trades',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'tag-5',
    name: 'stop-loss',
    user_id: 'user-1',
    color: '#ef4444',
    description: 'Trades closed due to stop loss',
    created_at: '2024-01-01T00:00:00Z',
  },
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('user_id');

  let filteredTags = [...mockTags];

  if (userId) {
    filteredTags = filteredTags.filter((tag) => tag.user_id === userId);
  }

  return NextResponse.json({
    data: filteredTags,
    meta: {
      total: filteredTags.length,
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.name) {
      return NextResponse.json({ error: 'Missing required field: name' }, { status: 400 });
    }

    // Check if tag already exists for this user
    const existingTag = mockTags.find(
      (tag) =>
        tag.name.toLowerCase() === body.name.toLowerCase() &&
        tag.user_id === (body.user_id || 'user-1'),
    );

    if (existingTag) {
      return NextResponse.json({ error: 'Tag already exists' }, { status: 409 });
    }

    const newTag = {
      id: `tag-${Date.now()}`,
      name: body.name.toLowerCase().replace(/\s+/g, '-'),
      user_id: body.user_id || 'user-1',
      color: body.color || '#6b7280',
      description: body.description || '',
      created_at: new Date().toISOString(),
    };

    mockTags.push(newTag);

    return NextResponse.json(newTag, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }
}
