import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../../lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ agencyId: string }> }
) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');

  try {
    const resolvedParams = await params;
    const agencyId = parseInt(resolvedParams.agencyId);
    const where: {
      title?: { agencyId: number };
      date?: Date;
    } = {
      title: {
        agencyId,
      },
    };

    if (date) {
      where.date = new Date(date);
    } else {
      // Get latest version
      const latestVersion = await prisma.version.findFirst({
        where: {
          title: {
            agencyId,
          },
        },
        orderBy: {
          date: 'desc',
        },
      });
      if (latestVersion) {
        where.date = latestVersion.date;
      }
    }

    const result = await prisma.section.aggregate({
      where: {
        version: where,
      },
      _sum: {
        wordCount: true,
      },
    });

    return NextResponse.json({
      agencyId,
      date,
      wordCount: result._sum.wordCount || 0,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch word count' }, { status: 500 });
  }
}
