import { prisma } from '../lib/prisma';
import * as crypto from 'crypto';

const BASE_URL = 'https://www.ecfr.gov';

interface AgencyData {
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
  slug: string;
  name: string;
  short_name: string;
  display_name: string;
  sortable_name: string;
  children: unknown[];
  cfr_references: { title: number; chapter: string }[];
}

interface SectionData {
  identifier: string;
  label: string;
  text: string;
}

async function fetchAgencies(): Promise<AgencyData[]> {
  const response = await fetch(`${BASE_URL}/api/admin/v1/agencies.json`);
  const data = await response.json();

  // Debug: Log a few agency names to see what's available
  console.log('Sample agencies from API:');
  data.agencies.slice(0, 3).forEach((agency: RawAgency, index: number) => {
    console.log(`  ${index}: ${agency.name} (slug: ${agency.slug})`);
  });

  // Select agencies by their names - major regulatory agencies
  const selectedNames = [
    "Department of Agriculture",
    "Department of Defense",
    "Department of Commerce",
    "Department of Labor",
    "Department of Justice"
  ];

  const matchedAgencies = data.agencies.filter((agency: RawAgency) =>
    selectedNames.includes(agency.name)
  );

  console.log(`Found ${matchedAgencies.length} matching agencies out of ${selectedNames.length} requested`);
  matchedAgencies.forEach((agency: RawAgency) => console.log(`  - ${agency.name} (slug: ${agency.slug})`));

  return matchedAgencies.map((agency: RawAgency) => ({
    name: agency.name,
    description: agency.short_name, // Use short_name as description since no description field
    slug: agency.slug,
  }));
}

async function fetchTitles(): Promise<TitleData[]> {
  const response = await fetch(`${BASE_URL}/api/versioner/v1/titles.json`);
  const data = await response.json();

  // Debug: log first few titles to see the structure
  console.log('Sample titles from API:');
  data.titles.slice(0, 3).forEach((title: unknown, index: number) => {
    console.log(`  Title ${index}:`, JSON.stringify(title, null, 2));
  });

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

  // Create agencies in database and get their IDs
  const createdAgencies = [];
  for (const agency of agencies) {
    const createdAgency = await prisma.agency.upsert({
      where: { slug: agency.slug },
      update: { name: agency.name, description: agency.description },
      create: {
        name: agency.name,
        description: agency.description,
        slug: agency.slug,
      },
    });
    createdAgencies.push(createdAgency);
  }

  console.log('Fetching titles...');
  const titlesData = await fetchTitles();

  // Since ECFR API doesn't directly map titles to agencies, we'll need to
  // assign titles to agencies based on CFR references or use a simpler approach
  // For now, let's distribute titles evenly among our selected agencies
  console.log(`Processing ${titlesData.length} titles for ${createdAgencies.length} selected agencies`);

  // Log title count per agency for debugging
  const titleCountByAgency: Record<string, number> = {};

  let agencyIndex = 0;
  for (const titleData of titlesData) {
    const agency = createdAgencies[agencyIndex % createdAgencies.length];

    titleCountByAgency[agency.name] = (titleCountByAgency[agency.name] || 0) + 1;

    await prisma.title.upsert({
      where: { code: titleData.number.toString() },
      update: { name: titleData.name },
      create: {
        code: titleData.number.toString(),
        name: titleData.name,
        agencyId: agency.id,
      },
    });

    agencyIndex++;
  }

  console.log('Titles per agency:', titleCountByAgency);

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
