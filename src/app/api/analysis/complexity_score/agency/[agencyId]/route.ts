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
        identifier: true,
        version: {
          select: {
            structureJson: true,
          },
        },
      },
    });

    const totalSections = sections.length;
    const totalWords = sections.reduce((sum, s) => sum + s.wordCount, 0);
    const avgWordsPerSection = totalSections > 0 ? totalWords / totalSections : 0;

    // Calculate dynamic hierarchy depth based on section identifiers and structure
    const calculateHierarchyDepth = (
      sections: Array<{ identifier: string; version?: { structureJson: unknown } | null }>,
      structureJson: unknown
    ) => {
      if (!sections.length) return 1;

      // Method 1: Analyze section identifiers (e.g., "1.1.1.1" has depth 4)
      const maxIdentifierDepth = Math.max(...sections.map(section => {
        const identifier = section.identifier || '';
        // Count dots and other hierarchy indicators
        const dotDepth = (identifier.match(/\./g) || []).length + 1;
        const dashDepth = (identifier.match(/-/g) || []).length + 1;
        const parenDepth = (identifier.match(/\([a-zA-Z0-9]+\)/g) || []).length;

        return Math.max(dotDepth, dashDepth) + parenDepth;
      }));

      // Method 2: Analyze structure JSON if available
      let structureDepth = 1;
      if (structureJson && typeof structureJson === 'object') {
        const calculateJsonDepth = (obj: unknown, currentDepth = 1): number => {
          let maxDepth = currentDepth;

          if (Array.isArray(obj)) {
            for (const item of obj) {
              maxDepth = Math.max(maxDepth, calculateJsonDepth(item, currentDepth));
            }
          } else if (obj && typeof obj === 'object') {
            const objRecord = obj as Record<string, unknown>;
            for (const key of Object.keys(objRecord)) {
              if (key.includes('section') || key.includes('part') || key.includes('subpart') ||
                  key.includes('chapter') || key.includes('title') || key.includes('subsection')) {
                maxDepth = Math.max(maxDepth, calculateJsonDepth(objRecord[key], currentDepth + 1));
              } else {
                maxDepth = Math.max(maxDepth, calculateJsonDepth(objRecord[key], currentDepth));
              }
            }
          }

          return maxDepth;
        };

        structureDepth = calculateJsonDepth(structureJson);
      }

      // Use the maximum of both methods, with reasonable bounds
      const hierarchyDepth = Math.max(maxIdentifierDepth, structureDepth);
      return Math.min(Math.max(hierarchyDepth, 1), 10); // Bound between 1 and 10
    };

    // Get structure from first section's version (they should all be the same)
    const structureJson = sections.length > 0 ? sections[0].version?.structureJson : null;
    const hierarchyDepth = calculateHierarchyDepth(sections, structureJson);

    // Enhanced complexity score calculation
    // Base complexity from document size and structure
    const baseComplexity = totalSections + (avgWordsPerSection / 10); // Scale down words

    // Hierarchy multiplier: deeper structures are more complex to navigate
    const hierarchyMultiplier = 1 + (hierarchyDepth - 1) * 0.3; // 30% increase per level

    // Final complexity score
    const complexityScore = baseComplexity * hierarchyMultiplier;

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
