import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET() {
  try {
    const agencies = await prisma.agency.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
      },
    });
    return NextResponse.json({ agencies });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch agencies' }, { status: 500 });
  }
}
