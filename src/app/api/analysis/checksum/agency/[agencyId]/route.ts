import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../../lib/prisma';
import * as crypto from 'crypto';

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
        checksum: true,
      },
      orderBy: {
        identifier: 'asc',
      },
    });

    const concatenated = sections.map(s => s.checksum).join('');
    const aggregateChecksum = crypto.createHash('sha256').update(concatenated).digest('hex');

    return NextResponse.json({
      agencyId,
      date,
      checksum: aggregateChecksum,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch checksum' }, { status: 500 });
  }
}
