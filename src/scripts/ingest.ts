import { prisma } from '../lib/prisma';
import * as crypto from 'crypto';

const BASE_URL = 'https://www.ecfr.gov';

interface TitleWithDate {
  titleData: TitleData & {
    dbId: number;
    up_to_date_as_of?: string;
    latest_issue_date?: string;
    latest_amended_on?: string
  };
  agency: {
    id: number;
    name: string;
    slug: string;
  };
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
  children: RawAgency[];
  cfr_references: { title: number; chapter: string }[];
}

interface SectionData {
  identifier: string;
  label: string;
  text: string;
}

async function fetchAgencies(): Promise<RawAgency[]> {
  const response = await fetch(`${BASE_URL}/api/admin/v1/agencies.json`);
  const data = await response.json();
  return data.agencies;
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

async function ingestData(maxAgencies?: number) {
  console.log('Fetching agencies...');

  // Get all agencies from the API
  const allAgencies = await fetchAgencies();

  // Filter for agencies that have CFR references (indicate regulatory activity)
  let agenciesWithCFR = allAgencies.filter(agency =>
    agency.cfr_references && agency.cfr_references.length > 0
  );

  // Limit agencies if maxAgencies is specified
  if (maxAgencies && maxAgencies > 0) {
    agenciesWithCFR = agenciesWithCFR.slice(0, maxAgencies);
    console.log(`Limited to ${maxAgencies} agencies for testing`);
  }

  console.log(`Found ${agenciesWithCFR.length} agencies with CFR references out of ${allAgencies.length} total agencies`);

  // Create agencies in database and get their IDs
  // First pass: create all agencies without parent relationships
  const createdAgencies = [];
  const agencyTitleMap = new Map<string, number[]>(); // Map agency slug to their CFR title numbers
  const agencySlugToId = new Map<string, number>(); // Map for parent relationship resolution

  // Flatten all agencies (parent + children) that have CFR references
  const flatAgencies: RawAgency[] = [];

  for (const agency of agenciesWithCFR) {
    flatAgencies.push(agency);
    // Add children if they have CFR references
    for (const child of agency.children) {
      if (child.cfr_references && child.cfr_references.length > 0) {
        flatAgencies.push(child);
      }
    }
  }

  // First pass: Create all agencies
  for (const rawAgency of flatAgencies) {
    const createdAgency = await prisma.agency.upsert({
      where: { slug: rawAgency.slug },
      update: {
        name: rawAgency.name,
        description: rawAgency.short_name
      },
      create: {
        name: rawAgency.name,
        description: rawAgency.short_name,
        slug: rawAgency.slug,
      },
    });
    createdAgencies.push(createdAgency);
    agencySlugToId.set(rawAgency.slug, createdAgency.id);

    // Get CFR title references for this agency
    const titleNumbers = rawAgency.cfr_references?.map((ref: { title: number; chapter: string }) => ref.title) || [];
    agencyTitleMap.set(rawAgency.slug, titleNumbers);
    console.log(`${rawAgency.name} references CFR titles: ${titleNumbers.join(', ')}`);
  }

  // Second pass: Update parent relationships
  for (const parentAgency of agenciesWithCFR) {
    for (const childAgency of parentAgency.children) {
      if (childAgency.cfr_references && childAgency.cfr_references.length > 0) {
        const childId = agencySlugToId.get(childAgency.slug);
        const parentId = agencySlugToId.get(parentAgency.slug);

        if (childId && parentId) {
          await prisma.agency.update({
            where: { id: childId },
            data: { parentId: parentId },
          });
          console.log(`Set ${childAgency.name} as child of ${parentAgency.name}`);
        }
      }
    }
  }

  console.log('Fetching titles...');
  const titlesData = await fetchTitles();

  // Get all title numbers that are referenced by our selected agencies
  const referencedTitleNumbers = new Set<number>();
  agencyTitleMap.forEach((titleNumbers: number[]) => {
    titleNumbers.forEach((titleNum: number) => referencedTitleNumbers.add(titleNum));
  });

  // Filter titles to only include those referenced by our selected agencies
  const filteredTitlesData = titlesData.filter(titleData =>
    referencedTitleNumbers.has(titleData.number)
  );

  console.log(`Found ${referencedTitleNumbers.size} unique CFR titles referenced by our agencies`);
  console.log(`Processing ${filteredTitlesData.length} relevant titles for ${createdAgencies.length} selected agencies`);

  // Log title count per agency for debugging
  const titleCountByAgency: Record<string, number> = {};
  const titlesWithDates: TitleWithDate[] = [];

  for (const titleData of filteredTitlesData) {
    // Find ALL agencies that reference this title and create entries for each
    const candidateAgencies = [];

    for (const [agencySlug, titleNumbers] of agencyTitleMap.entries()) {
      if (titleNumbers.includes(titleData.number)) {
        const agency = createdAgencies.find(a => a.slug === agencySlug);
        if (agency) {
          candidateAgencies.push(agency);
        }
      }
    }

    // Create title entries for ALL agencies that reference this CFR title
    for (const agency of candidateAgencies) {
      titleCountByAgency[agency.name] = (titleCountByAgency[agency.name] || 0) + 1;

      console.log(`Creating CFR Title ${titleData.number} entry for ${agency.name}`);

      // Use a composite key that includes agency to allow shared titles
      const titleKey = `${titleData.number}-${agency.slug}`;

      const createdTitle = await prisma.title.upsert({
        where: { code: titleKey },
        update: { name: titleData.name },
        create: {
          code: titleKey,
          name: `${titleData.name} (${agency.name})`,
          agencyId: agency.id,
        },
      });

      // Store title data with date info for later processing
      titlesWithDates.push({
        titleData: { ...titleData, dbId: createdTitle.id },
        agency: agency
      });
    }
  }

  console.log('Titles per agency:', titleCountByAgency);

  // Analyze cross-cutting administrative rules and agency impact
  console.log('\n=== CROSS-CUTTING ADMINISTRATIVE RULES ANALYSIS ===');

  const titleAgencyMap = new Map<number, string[]>();

  // Build map of CFR titles to agencies that reference them
  for (const titleData of filteredTitlesData) {
    const agenciesForTitle: string[] = [];

    for (const [agencySlug, titleNumbers] of agencyTitleMap.entries()) {
      if (titleNumbers.includes(titleData.number)) {
        const agency = createdAgencies.find(a => a.slug === agencySlug);
        if (agency) {
          agenciesForTitle.push(agency.name);
        }
      }
    }

    titleAgencyMap.set(titleData.number, agenciesForTitle);
  }

  // Sort titles by number of agencies (most cross-cutting first)
  const titlesByImpact = Array.from(titleAgencyMap.entries())
    .sort((a, b) => b[1].length - a[1].length);

  console.log('\nCFR Titles by Cross-Agency Impact:');
  titlesByImpact.forEach(([titleNum, agencies]) => {
    const titleInfo = filteredTitlesData.find(t => t.number === titleNum);
    const impactLevel = agencies.length >= 4 ? '🔴 HIGH IMPACT' :
                       agencies.length >= 3 ? '🟡 MEDIUM IMPACT' :
                       '🟢 SINGLE AGENCY';

    console.log(`  ${impactLevel} CFR Title ${titleNum}: ${titleInfo?.name}`);
    console.log(`    └─ Affects ${agencies.length} agencies: ${agencies.join(', ')}`);
  });

  // Summary statistics
  const highImpactTitles = titlesByImpact.filter(([, agencies]) => agencies.length >= 4);
  const mediumImpactTitles = titlesByImpact.filter(([, agencies]) => agencies.length === 3);
  const singleAgencyTitles = titlesByImpact.filter(([, agencies]) => agencies.length <= 2);

  console.log('\n=== REGULATORY IMPACT SUMMARY ===');
  console.log(`📊 Total CFR Titles Analyzed: ${titlesByImpact.length}`);
  console.log(`🔴 High Impact (4+ agencies): ${highImpactTitles.length} titles`);
  console.log(`🟡 Medium Impact (3 agencies): ${mediumImpactTitles.length} titles`);
  console.log(`🟢 Single/Low Impact (≤2 agencies): ${singleAgencyTitles.length} titles`);

  const totalTitleInstances = Array.from(titleAgencyMap.values())
    .reduce((sum, agencies) => sum + agencies.length, 0);
  console.log(`📈 Total Title-Agency Relationships: ${totalTitleInstances}`);
  console.log(`🔄 Average Agencies per Title: ${(totalTitleInstances / titlesByImpact.length).toFixed(1)}`);
  console.log('================================================\n');

  // Group titles by unique CFR number to avoid duplicate fetching
  const uniqueTitleMap = new Map<number, {
    titleWithDateData: TitleWithDate['titleData'],
    dbEntries: { dbId: number, agency: { id: number, name: string, slug: string } }[]
  }>();

  for (const { titleData, agency } of titlesWithDates) {
    if (!uniqueTitleMap.has(titleData.number)) {
      uniqueTitleMap.set(titleData.number, {
        titleWithDateData: titleData,
        dbEntries: []
      });
    }
    uniqueTitleMap.get(titleData.number)!.dbEntries.push({
      dbId: titleData.dbId,
      agency
    });
  }

  console.log(`Fetching content for ${uniqueTitleMap.size} unique CFR titles...`);

  for (const [titleNumber, { titleWithDateData, dbEntries }] of uniqueTitleMap.entries()) {
    // Use the most recent date available from the title data
    const latestDate = titleWithDateData.up_to_date_as_of || titleWithDateData.latest_issue_date || titleWithDateData.latest_amended_on;

    if (!latestDate) {
      console.log(`No date information available for title ${titleNumber}, skipping...`);
      continue;
    }

    console.log(`Fetching data for CFR Title ${titleNumber} on ${latestDate} (used by ${dbEntries.length} agencies: ${dbEntries.map(e => e.agency.name).join(', ')})...`);

    try {
      const structure = await fetchStructure(titleNumber.toString(), latestDate);
      const content = await fetchContent(titleNumber.toString(), latestDate);

      // Parse sections once for this CFR title
      const sections = parseSections(content);

      // Create versions for all agency title entries that reference this CFR title
      for (const { dbId } of dbEntries) {
        const version = await prisma.version.upsert({
          where: {
            titleId_date: {
              titleId: dbId,
              date: new Date(latestDate),
            },
          },
          update: {
            structureJson: structure,
            contentXml: content,
          },
          create: {
            titleId: dbId,
            date: new Date(latestDate),
            structureJson: structure,
            contentXml: content,
          },
        });

        // Create sections for each agency's version
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
      }
    } catch (error) {
      console.error(`Error fetching data for title ${titleNumber}:`, error);
    }
  }

  console.log('Ingestion complete.');
}

// Parse command line arguments
const args = process.argv.slice(2);
const maxAgenciesArg = args.find(arg => arg.startsWith('--max-agencies='));
const maxAgencies = maxAgenciesArg ? parseInt(maxAgenciesArg.split('=')[1]) : undefined;

// Show usage if help is requested
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Usage: npm run ingest [options]

Options:
  --max-agencies=N    Limit ingestion to N agencies (for testing)
  --help, -h          Show this help message

Examples:
  npm run ingest                    # Ingest all agencies
  npm run ingest -- --max-agencies=2    # Ingest only 2 agencies for testing
  `);
  process.exit(0);
}

if (maxAgencies) {
  console.log(`Running in test mode with maximum ${maxAgencies} agencies`);
} else {
  console.log('Running full ingestion for all agencies');
}

ingestData(maxAgencies).catch(console.error);
