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

    // Build the where clause for sections
    const sectionWhere: {
      version: {
        title: { agencyId: number };
        date?: Date;
      };
    } = {
      version: {
        title: {
          agencyId,
        },
      },
    };

    if (date) {
      sectionWhere.version.date = new Date(date);
    } else {
      // Get latest version that has sections
      const latestVersion = await prisma.version.findFirst({
        where: {
          title: {
            agencyId,
          },
          sections: {
            some: {}, // Ensure the version has at least one section
          },
        },
        orderBy: {
          date: 'desc',
        },
      });
      if (latestVersion) {
        sectionWhere.version.date = latestVersion.date;
      }
    }

    const result = await prisma.section.aggregate({
      where: sectionWhere,
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
