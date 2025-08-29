import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET() {
  try {
    // Get all titles with their agencies
    const titles = await prisma.title.findMany({
      include: {
        agency: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    });

    // Group titles by CFR number to find cross-cutting rules
    const cfrTitleMap = new Map<string, {
      name: string;
      agencies: Array<{ id: number; name: string; slug: string }>;
      originalNumber: number;
    }>();

    titles.forEach(title => {
      // Extract original CFR number from composite key (e.g., "2-agriculture-department" -> 2)
      const cfrNumber = title.code.split('-')[0];
      const originalNumber = parseInt(cfrNumber);

      if (!cfrTitleMap.has(cfrNumber)) {
        // Extract original title name (remove agency suffix)
        const originalName = title.name.replace(/ \([^)]+\)$/, '');

        cfrTitleMap.set(cfrNumber, {
          name: originalName,
          agencies: [],
          originalNumber
        });
      }

      const titleInfo = cfrTitleMap.get(cfrNumber)!;

      // Check if this agency is already in the list to avoid duplicates
      const agencyExists = titleInfo.agencies.some(existingAgency => existingAgency.id === title.agency.id);
      if (!agencyExists) {
        titleInfo.agencies.push(title.agency);
      }
    });

    // Convert to array and sort by impact (number of agencies)
    const crossCuttingAnalysis = Array.from(cfrTitleMap.entries())
      .map(([cfrNumber, info]) => ({
        cfrNumber: parseInt(cfrNumber),
        name: info.name,
        agencyCount: info.agencies.length,
        agencies: info.agencies,
        impactLevel: info.agencies.length >= 4 ? 'HIGH' :
                    info.agencies.length >= 3 ? 'MEDIUM' : 'LOW'
      }))
      .sort((a, b) => b.agencyCount - a.agencyCount);

    // Generate summary statistics
    const summary = {
      totalCfrTitles: crossCuttingAnalysis.length,
      highImpact: crossCuttingAnalysis.filter(t => t.impactLevel === 'HIGH').length,
      mediumImpact: crossCuttingAnalysis.filter(t => t.impactLevel === 'MEDIUM').length,
      lowImpact: crossCuttingAnalysis.filter(t => t.impactLevel === 'LOW').length,
      totalTitleAgencyRelationships: crossCuttingAnalysis.reduce((sum, t) => sum + t.agencyCount, 0),
      averageAgenciesPerTitle: crossCuttingAnalysis.length > 0 ?
        (crossCuttingAnalysis.reduce((sum, t) => sum + t.agencyCount, 0) / crossCuttingAnalysis.length) : 0
    };

    return NextResponse.json({
      summary,
      crossCuttingTitles: crossCuttingAnalysis
    });

  } catch (error) {
    console.error('Error analyzing cross-cutting rules:', error);
    return NextResponse.json(
      { error: 'Failed to analyze cross-cutting rules' },
      { status: 500 }
    );
  }
}
