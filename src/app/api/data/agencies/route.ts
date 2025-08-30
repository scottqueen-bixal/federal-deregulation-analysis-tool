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
        parentId: true,
        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        children: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: [
        { parentId: { sort: 'asc', nulls: 'first' } },
        { name: 'asc' }
      ],
    });
    return NextResponse.json({ agencies });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch agencies' }, { status: 500 });
  }
}
