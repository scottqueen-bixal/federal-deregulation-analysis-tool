import { NextResponse } from 'next/server';
import { prisma } from '../../../../../../lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { agencyId: string } }
) {
  try {
    const agencyId = parseInt(params.agencyId);

    // Get the selected agency
    const selectedAgency = await prisma.agency.findUnique({
      where: { id: agencyId },
      select: { id: true, name: true, slug: true }
    });

    if (!selectedAgency) {
      return NextResponse.json(
        { error: 'Agency not found' },
        { status: 404 }
      );
    }

    // Get all titles for the selected agency
    const agencyTitles = await prisma.title.findMany({
      where: { agencyId: agencyId },
      select: { code: true, name: true }
    });

    // Get all titles across all agencies to find cross-cutting analysis
    const allTitles = await prisma.title.findMany({
      include: {
        agency: {
          select: { id: true, name: true, slug: true }
        }
      }
    });

    // Group by CFR number and find which ones the selected agency shares
    const cfrTitleMap = new Map<string, {
      name: string;
      agencies: Array<{ id: number; name: string; slug: string }>;
      hasSelectedAgency: boolean;
      selectedAgencyName?: string;
    }>();

    allTitles.forEach(title => {
      const cfrNumber = title.code.split('-')[0];

      if (!cfrTitleMap.has(cfrNumber)) {
        const originalName = title.name.replace(/ \([^)]+\)$/, '');
        cfrTitleMap.set(cfrNumber, {
          name: originalName,
          agencies: [],
          hasSelectedAgency: false
        });
      }

      const titleInfo = cfrTitleMap.get(cfrNumber)!;

      // Check if this agency is already in the list
      const agencyExists = titleInfo.agencies.some(existingAgency => existingAgency.id === title.agency.id);
      if (!agencyExists) {
        titleInfo.agencies.push(title.agency);
      }

      // Mark if this CFR title involves our selected agency
      if (title.agency.id === agencyId) {
        titleInfo.hasSelectedAgency = true;
        titleInfo.selectedAgencyName = title.agency.name;
      }
    });

    // Filter to only CFR titles that involve the selected agency
    const agencyRelevantTitles = Array.from(cfrTitleMap.entries())
      .filter(([, info]) => info.hasSelectedAgency)
      .map(([cfrNumber, info]) => ({
        cfrNumber: parseInt(cfrNumber),
        name: info.name,
        agencyCount: info.agencies.length,
        agencies: info.agencies,
        sharedWith: info.agencies.filter(agency => agency.id !== agencyId),
        impactLevel: info.agencies.length >= 4 ? 'HIGH' :
                    info.agencies.length >= 3 ? 'MEDIUM' : 'LOW',
        isShared: info.agencies.length > 1
      }))
      .sort((a, b) => b.agencyCount - a.agencyCount);

    // Calculate summary for this agency
    const sharedTitles = agencyRelevantTitles.filter(t => t.isShared);
    const exclusiveTitles = agencyRelevantTitles.filter(t => !t.isShared);
    const highImpactShared = sharedTitles.filter(t => t.impactLevel === 'HIGH');

    const summary = {
      agencyName: selectedAgency.name,
      totalCfrTitles: agencyRelevantTitles.length,
      sharedTitles: sharedTitles.length,
      exclusiveTitles: exclusiveTitles.length,
      highImpactShared: highImpactShared.length,
      sharedWithAgencies: new Set(sharedTitles.flatMap(t => t.sharedWith.map(a => a.name))).size,
      crossCuttingPercentage: agencyRelevantTitles.length > 0 ?
        (sharedTitles.length / agencyRelevantTitles.length * 100) : 0
    };

    return NextResponse.json({
      summary,
      crossCuttingTitles: agencyRelevantTitles,
      selectedAgency
    });

  } catch (error) {
    console.error('Error analyzing agency cross-cutting rules:', error);
    return NextResponse.json(
      { error: 'Failed to analyze agency cross-cutting rules' },
      { status: 500 }
    );
  }
}
