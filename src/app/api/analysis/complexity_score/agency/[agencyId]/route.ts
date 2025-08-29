import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../../lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { agencyId: string } }
) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');

  try {
    const agencyId = parseInt(params.agencyId);
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

    const sections = await prisma.section.findMany({
      where: {
        version: where,
      },
      select: {
        wordCount: true,
      },
    });

    const totalSections = sections.length;
    const totalWords = sections.reduce((sum, s) => sum + s.wordCount, 0);
    const avgWordsPerSection = totalSections > 0 ? totalWords / totalSections : 0;

    // For hierarchy depth, we can use the structureJson, but for simplicity, assume depth 1
    const hierarchyDepth = 1; // Placeholder

    const complexityScore = (totalSections + avgWordsPerSection) / hierarchyDepth;

    return NextResponse.json({
      agencyId,
      date,
      complexityScore,
      metrics: {
        totalSections,
        totalWords,
        avgWordsPerSection,
        hierarchyDepth,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch complexity score' }, { status: 500 });
  }
}
