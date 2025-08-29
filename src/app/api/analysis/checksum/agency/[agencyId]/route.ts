import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../../lib/prisma';
import * as crypto from 'crypto';

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
