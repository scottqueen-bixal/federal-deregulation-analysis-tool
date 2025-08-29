import { prisma } from '../lib/prisma';
import * as crypto from 'crypto';

const BASE_URL = 'https://www.ecfr.gov';

interface AgencyData {
  id: number;
  name: string;
  description?: string;
  slug: string;
}

interface TitleData {
  number: number;
  name: string;
  agencyId: number;
}

interface RawAgency {
  id: number;
  name: string;
  description?: string;
  slug: string;
}

interface SectionData {
  identifier: string;
  label: string;
  text: string;
}

async function fetchAgencies(): Promise<AgencyData[]> {
  const response = await fetch(`${BASE_URL}/api/admin/v1/agencies.json`);
  const data = await response.json();
  return data.agencies.map((agency: RawAgency) => ({
    id: agency.id,
    name: agency.name,
    description: agency.description,
    slug: agency.slug,
  }));
}

async function fetchTitles(): Promise<TitleData[]> {
  const response = await fetch(`${BASE_URL}/api/versioner/v1/titles.json`);
  const data = await response.json();
  return data.titles;
}

async function fetchStructure(title: string, date: string): Promise<object> {
  const response = await fetch(`${BASE_URL}/api/versioner/v1/structure/${date}/title-${title}.json`);
  return await response.json();
}

async function fetchContent(title: string, date: string): Promise<string> {
  const response = await fetch(`${BASE_URL}/api/versioner/v1/full/${date}/title-${title}.xml`);
  return await response.text();
}

function parseSections(xml: string): SectionData[] {
  const sections: SectionData[] = [];

  try {
    // Simple regex-based parsing for sections
    // Look for DIV8 TYPE="SECTION" elements
    const sectionRegex = /<DIV8[^>]*N="([^"]*)"[^>]*>[\s\S]*?<HEAD>([^<]*)<\/HEAD>([\s\S]*?)<\/DIV8>/g;
    let match;

    while ((match = sectionRegex.exec(xml)) !== null) {
      const identifier = match[1];
      const head = match[2].replace(/^§\s*/, '').trim();
      const content = match[3];

      // Extract text from P elements
      const textRegex = /<P[^>]*>([\s\S]*?)<\/P>/g;
      let textContent = '';
      let textMatch;

      while ((textMatch = textRegex.exec(content)) !== null) {
        let text = textMatch[1];
        // Remove nested tags
        text = text.replace(/<[^>]*>/g, '');
        textContent += text + ' ';
      }

      // Clean up the text
      textContent = textContent.replace(/\s+/g, ' ').trim();

      if (textContent) {
        sections.push({
          identifier,
          label: head,
          text: textContent
        });
      }
    }
  } catch (error) {
    console.error('Error parsing XML:', error);
  }

  return sections;
}

function calculateWordCount(text: string): number {
  return text.trim().split(/\s+/).length;
}

function calculateChecksum(text: string): string {
  return crypto.createHash('md5').update(text).digest('hex');
}

async function ingestData() {
  console.log('Fetching agencies...');
  const agencies = await fetchAgencies();

  for (const agency of agencies) {
    await prisma.agency.upsert({
      where: { slug: agency.slug },
      update: { name: agency.name, description: agency.description },
      create: agency,
    });
  }

  console.log('Fetching titles...');
  const titlesData = await fetchTitles();

  for (const titleData of titlesData) {
    const agency = await prisma.agency.findFirst({
      where: { id: titleData.agencyId },
    });
    if (!agency) continue;

    await prisma.title.upsert({
      where: { code: titleData.number.toString() },
      update: { name: titleData.name },
      create: {
        code: titleData.number.toString(),
        name: titleData.name,
        agencyId: agency.id,
      },
    });
  }

  // For each title, fetch latest data
  const titles = await prisma.title.findMany();

  for (const title of titles) {
    // Use the latest available date from the API
    const date = '2025-08-27';

    console.log(`Fetching data for title ${title.code} on ${date}...`);

    try {
      const structure = await fetchStructure(title.code, date);
      const content = await fetchContent(title.code, date);

      const version = await prisma.version.upsert({
        where: {
          titleId_date: {
            titleId: title.id,
            date: new Date(date),
          },
        },
        update: {
          structureJson: structure,
          contentXml: content,
        },
        create: {
          titleId: title.id,
          date: new Date(date),
          structureJson: structure,
          contentXml: content,
        },
      });

      // Parse sections from XML
      const sections = parseSections(content);

      for (const section of sections) {
        const text = section.text || '';
        const wordCount = calculateWordCount(text);
        const checksum = calculateChecksum(text);

        await prisma.section.upsert({
          where: {
            versionId_identifier: {
              versionId: version.id,
              identifier: section.identifier,
            },
          },
          update: {
            label: section.label,
            textContent: text,
            wordCount,
            checksum,
          },
          create: {
            versionId: version.id,
            identifier: section.identifier,
            label: section.label,
            textContent: text,
            wordCount,
            checksum,
          },
        });
      }
    } catch (error) {
      console.error(`Error fetching data for title ${title.code}:`, error);
    }
  }

  console.log('Ingestion complete.');
}

ingestData().catch(console.error);
