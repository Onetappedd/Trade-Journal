import { type NextRequest, NextResponse } from 'next/server';

// Mock tags data (same as above for consistency)
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
];

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const tag = mockTags.find((t) => t.id === params.id);

  if (!tag) {
    return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
  }

  return NextResponse.json(tag);
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const tagIndex = mockTags.findIndex((t) => t.id === params.id);

    if (tagIndex === -1) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
    }

    // Update the tag
    const updatedTag = {
      ...mockTags[tagIndex],
      ...body,
      updated_at: new Date().toISOString(),
    };

    mockTags[tagIndex] = updatedTag;

    return NextResponse.json(updatedTag);
  } catch (error) {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const tagIndex = mockTags.findIndex((t) => t.id === params.id);

  if (tagIndex === -1) {
    return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
  }

  mockTags.splice(tagIndex, 1);

  return NextResponse.json({ message: 'Tag deleted successfully' }, { status: 200 });
}
