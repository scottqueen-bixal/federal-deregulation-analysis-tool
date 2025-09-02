import { NextResponse } from 'next/server';

// This endpoint clears the max aggregated complexity cache
// Useful when data has been updated and the cache needs refreshing

export async function POST() {
  try {
    // Clear the cache by making a request to max-aggregated with cache-busting
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/analysis/complexity_score/max-aggregated?refresh=true`, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache'
      }
    });

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json({
        success: true,
        message: 'Max aggregated complexity cache cleared and recalculated',
        new_max_score: data.max_aggregated_complexity_score
      });
    } else {
      throw new Error('Failed to refresh max aggregated score');
    }
  } catch (error) {
    console.error('Error clearing max aggregated cache:', error);
    return NextResponse.json(
      { error: 'Failed to clear cache', details: error },
      { status: 500 }
    );
  }
}
