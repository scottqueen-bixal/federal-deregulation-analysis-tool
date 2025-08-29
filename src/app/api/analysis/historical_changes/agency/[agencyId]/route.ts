import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../../lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { agencyId: string } }
) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  if (!from || !to) {
    return NextResponse.json({ error: 'from and to dates are required' }, { status: 400 });
  }

  try {
    const agencyId = parseInt(params.agencyId);

    // Get sections for 'from' date
    const fromSections = await prisma.section.findMany({
      where: {
        version: {
          title: {
            agencyId,
          },
          date: new Date(from),
        },
      },
      select: {
        identifier: true,
        textContent: true,
        wordCount: true,
      },
    });

    // Get sections for 'to' date
    const toSections = await prisma.section.findMany({
      where: {
        version: {
          title: {
            agencyId,
          },
          date: new Date(to),
        },
      },
      select: {
        identifier: true,
        textContent: true,
        wordCount: true,
      },
    });

    // Simple diff: find added, removed, changed
    const fromMap = new Map(fromSections.map(s => [s.identifier, s]));
    const toMap = new Map(toSections.map(s => [s.identifier, s]));

    const added = toSections.filter(s => !fromMap.has(s.identifier));
    const removed = fromSections.filter(s => !toMap.has(s.identifier));
    const changed = toSections.filter(s => {
      const old = fromMap.get(s.identifier);
      return old && (old.textContent !== s.textContent || old.wordCount !== s.wordCount);
    });

    const wordCountDelta = toSections.reduce((sum, s) => sum + s.wordCount, 0) -
                           fromSections.reduce((sum, s) => sum + s.wordCount, 0);

    return NextResponse.json({
      agencyId,
      from,
      to,
      changes: {
        added: added.length,
        removed: removed.length,
        changed: changed.length,
        wordCountDelta,
      },
      details: {
        added,
        removed,
        changed,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch historical changes' }, { status: 500 });
  }
}
