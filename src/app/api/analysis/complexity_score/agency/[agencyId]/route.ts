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

    const sections = await prisma.section.findMany({
      where: sectionWhere,
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
