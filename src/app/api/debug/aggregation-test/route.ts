import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const agencyId = url.searchParams.get('agencyId') || '6';

  try {
    // Simulate the frontend aggregation logic
    console.log(`[DEBUG] Testing aggregation for agency ${agencyId}`);

    // First get agency data
    const agencyResponse = await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/data/agencies`);
    const agencyData = await agencyResponse.json();

    const targetAgency = agencyData.agencies.find((a: { id: number }) => a.id === parseInt(agencyId));
    if (!targetAgency) {
      return NextResponse.json({ error: 'Agency not found' }, { status: 404 });
    }

    const childIds = targetAgency.children?.map((c: { id: number }) => c.id) || [];
    const allAgencyIds = [parseInt(agencyId), ...childIds];

    console.log(`[DEBUG] All agency IDs:`, allAgencyIds);

    // Fetch complexity scores for all agencies
    const promises = allAgencyIds.map(async (id) => {
      const url = `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/analysis/complexity_score/agency/${id}`;
      const res = await fetch(url);
      if (!res.ok) {
        console.error(`[DEBUG] Failed to fetch complexity for agency ${id}: ${res.status}`);
        return null;
      }
      return await res.json();
    });

    const results = await Promise.all(promises);
    const validResults = results.filter(result => result !== null);

    console.log(`[DEBUG] Valid results: ${validResults.length}/${allAgencyIds.length}`);

    const validScores = validResults.filter(result => result.complexity_score !== undefined);
    console.log(`[DEBUG] Valid scores: ${validScores.length}`);

    const scoresDetail = validScores.map(r => ({
      agencyId: r.agencyId,
      score: r.complexity_score,
      scoreType: typeof r.complexity_score
    }));

    const totalComplexity = validScores.reduce((sum, result) => {
      const score = Number(result.complexity_score) || 0;
      console.log(`[DEBUG] Adding ${score} from agency ${result.agencyId}`);
      return sum + score;
    }, 0);

    return NextResponse.json({
      agencyId: parseInt(agencyId),
      agencyName: targetAgency.name,
      childCount: childIds.length,
      allAgencyIds,
      validResultsCount: validResults.length,
      validScoresCount: validScores.length,
      scoresDetail,
      totalComplexity,
      parentScoreAlone: validScores.find(r => r.agencyId === parseInt(agencyId))?.complexity_score
    });

  } catch (error) {
    console.error('[DEBUG] Error in aggregation test:', error);
    return NextResponse.json({
      error: 'Failed to test aggregation',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
