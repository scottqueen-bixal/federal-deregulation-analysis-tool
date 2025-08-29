import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const agencyId = searchParams.get('agencyId');

  try {
    const where = agencyId ? { agencyId: parseInt(agencyId) } : {};
    const titles = await prisma.title.findMany({
      where,
      select: {
        id: true,
        code: true,
        name: true,
        agency: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });
    return NextResponse.json({ titles });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch titles' }, { status: 500 });
  }
}
