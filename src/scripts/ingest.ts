import { prisma } from '../lib/prisma';
import * as crypto from 'crypto';
import * as xml2js from 'xml2js';

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

interface XMLElement {
  [key: string]: unknown;
  TYPE?: string;
  N?: string;
  HEAD?: string | { _: string };
  P?: unknown | unknown[];
  _?: string;
}

function parseSections(xml: string): SectionData[] {
  const sections: SectionData[] = [];

  try {
    // Use xml2js parser for proper XML parsing
    const parser = new xml2js.Parser({
      explicitArray: false,
      ignoreAttrs: false,
      mergeAttrs: true
    });

    parser.parseString(xml, (err: Error | null, result: XMLElement) => {
      if (err) {
        console.error('Error parsing XML with xml2js:', err);
        return;
      }

      // Navigate the XML structure to find sections
      // The structure may vary, but typically sections are in DIV8 elements
      const findSections = (obj: unknown, path: string = '') => {
        if (!obj || typeof obj !== 'object') return;

        const element = obj as XMLElement;

        // Check if this is a section element (DIV8 with TYPE="SECTION")
        if (element.TYPE === 'SECTION' && element.N) {
          const identifier = element.N;

          // Extract the section label from HEAD element
          let label = '';
          if (element.HEAD) {
            label = typeof element.HEAD === 'string' ? element.HEAD : (element.HEAD as { _: string })?._ || '';
            label = label.replace(/^§\s*/, '').trim();
          }

          // Extract text content from all P elements
          let textContent = '';
          const extractText = (el: unknown): string => {
            if (typeof el === 'string') {
              return el;
            }
            if (Array.isArray(el)) {
              return el.map(extractText).join(' ');
            }
            if (el && typeof el === 'object') {
              const elObj = el as XMLElement;
              if (elObj._) {
                return elObj._;
              }
              return Object.values(elObj).map(extractText).join(' ');
            }
            return '';
          };

          if (element.P) {
            if (Array.isArray(element.P)) {
              textContent = element.P.map(extractText).join(' ');
            } else {
              textContent = extractText(element.P);
            }
          } else {
            // If no P elements, extract all text content
            textContent = extractText(element);
          }

          // Clean up the text
          textContent = textContent
            .replace(/\s+/g, ' ')
            .trim()
            .replace(/\n/g, ' ')
            .replace(/\t/g, ' ');

          if (textContent && identifier) {
            sections.push({
              identifier,
              label,
              text: textContent
            });
          }
        }

        // Recursively search for more sections
        if (Array.isArray(obj)) {
          obj.forEach((item, index) => findSections(item, `${path}[${index}]`));
        } else if (typeof obj === 'object') {
          Object.entries(obj as Record<string, unknown>).forEach(([key, value]) => {
            findSections(value, path ? `${path}.${key}` : key);
          });
        }
      };

      findSections(result);
    });

  } catch (error) {
    console.error('Error parsing XML:', error);
    // Fallback to regex parsing if xml2js fails
    console.log('Falling back to regex parsing...');
    return parseSectionsRegex(xml);
  }

  return sections;
}

// Keep the original regex parsing as a fallback
function parseSectionsRegex(xml: string): SectionData[] {
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
    console.error('Error parsing XML with regex:', error);
  }

  return sections;
}

// Alternative: Use structure JSON data combined with targeted XML fetching
async function fetchSectionsFromStructure(title: string, date: string): Promise<SectionData[]> {
  const sections: SectionData[] = [];

  try {
    const structure = await fetchStructure(title, date);

    // Navigate the structure to find sections
    const extractSectionsFromStructure = (node: unknown, path: string[] = []): void => {
      if (!node || typeof node !== 'object') return;

      const nodeObj = node as Record<string, unknown>;

      // Check if this node represents a section
      if (nodeObj.type === 'section' && nodeObj.identifier) {
        const identifier = String(nodeObj.identifier);
        const label = String(nodeObj.label || nodeObj.title || '');

        // For now, we'll still need the XML content to get the full text
        // But this gives us a more reliable way to identify sections
        sections.push({
          identifier,
          label,
          text: '' // Will be filled in by XML parsing
        });
      }

      // Recursively process children
      if (Array.isArray(nodeObj.children)) {
        nodeObj.children.forEach((child, index) => {
          extractSectionsFromStructure(child, [...path, String(index)]);
        });
      }

      // Also check other potential child properties
      Object.entries(nodeObj).forEach(([key, value]) => {
        if (key !== 'children' && Array.isArray(value)) {
          value.forEach((child, index) => {
            extractSectionsFromStructure(child, [...path, key, String(index)]);
          });
        }
      });
    };

    extractSectionsFromStructure(structure);

    // If we found sections in structure but no text, we still need to parse XML
    if (sections.length > 0 && sections.every(s => !s.text)) {
      console.log(`Found ${sections.length} sections in structure, fetching XML content...`);
      const xml = await fetchContent(title, date);
      const xmlSections = parseSections(xml);

      // Match structure sections with XML content
      sections.forEach(structSection => {
        const xmlSection = xmlSections.find(xs => xs.identifier === structSection.identifier);
        if (xmlSection) {
          structSection.text = xmlSection.text;
        }
      });
    }

  } catch (error) {
    console.error('Error fetching sections from structure:', error);
    // Fallback to XML-only parsing
    const xml = await fetchContent(title, date);
    return parseSections(xml);
  }

  return sections.filter(s => s.text); // Only return sections with content
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

  console.log(`Found ${agenciesWithCFR.length} agencies with CFR references out of ${allAgencies.length} total agencies`);

  // If maxAgencies is specified, prioritize getting complete parent-child hierarchies
  if (maxAgencies && maxAgencies > 0) {
    console.log(`\nSelecting agencies for testing with hierarchy preservation...`);

    // Find parent agencies (those with children) that also have CFR references
    const parentAgenciesWithCFR = agenciesWithCFR.filter(agency =>
      agency.children && agency.children.length > 0
    );

    console.log(`Found ${parentAgenciesWithCFR.length} parent agencies with CFR references`);

    // Sort by number of children to get the most interesting hierarchies
    parentAgenciesWithCFR.sort((a, b) => (b.children?.length || 0) - (a.children?.length || 0));

    // When maxAgencies is specified, select that many parent agencies and ALL their children
    // This ensures we get complete hierarchies for testing
    const numParentsToSelect = Math.min(maxAgencies, parentAgenciesWithCFR.length);
    const selectedParents = parentAgenciesWithCFR.slice(0, numParentsToSelect);
    console.log(`Selected ${numParentsToSelect} parent agencies (plus their children):`);
    selectedParents.forEach(parent => {
      console.log(`  ${parent.name}: ${parent.children?.length || 0} children`);
    });

    // Get all children of selected parents
    const selectedAgencies = new Set<string>();
    const childrenInfo = new Map<string, string[]>();

    // Add parents
    selectedParents.forEach(parent => {
      selectedAgencies.add(parent.slug);
      console.log(`\nProcessing parent: ${parent.name} (${parent.children?.length || 0} total children)`);

      // Debug: Show the structure of children
      if (parent.children && parent.children.length > 0) {
        console.log(`  First child structure:`, JSON.stringify(parent.children[0], null, 2));
      }

      // Add all their children (check in the full agency list, not just those with CFR references)
      const childrenSlugs: string[] = [];
      parent.children?.forEach(child => {
        console.log(`  Checking child: ${child.name} (slug: ${child.slug}) - CFR references: ${child.cfr_references?.length || 0}`);

        // The child object already contains cfr_references, so we can check directly
        if (child.cfr_references && child.cfr_references.length > 0) {
          selectedAgencies.add(child.slug);
          childrenSlugs.push(child.slug);
          console.log(`    ✓ Added ${child.name} (has CFR references)`);
        } else {
          console.log(`    ✗ Skipped ${child.name} (no CFR references)`);
        }
      });

      if (childrenSlugs.length > 0) {
        childrenInfo.set(parent.slug, childrenSlugs);
      }
    });

    // Filter to include selected agencies (both parents and their children)
    // Build a complete list from selected parents and their children
    const selectedAgencyObjects: RawAgency[] = [];

    selectedParents.forEach(parent => {
      // Add the parent
      selectedAgencyObjects.push(parent);

      // Add children that have CFR references
      const childrenWithCFR = childrenInfo.get(parent.slug) || [];
      childrenWithCFR.forEach(childSlug => {
        const child = parent.children?.find(c => c.slug === childSlug);
        if (child) {
          selectedAgencyObjects.push(child);
        }
      });
    });

    agenciesWithCFR = selectedAgencyObjects;

    console.log(`\nSelected ${agenciesWithCFR.length} agencies total (${selectedParents.length} parents + their children with CFR references)`);
    console.log(`Hierarchy breakdown:`);
    selectedParents.forEach(parent => {
      const childrenWithCFR = childrenInfo.get(parent.slug) || [];
      console.log(`  ${parent.name}: ${childrenWithCFR.length} children with CFR references`);
      childrenWithCFR.forEach(childSlug => {
        const child = agenciesWithCFR.find(a => a.slug === childSlug);
        if (child) {
          console.log(`    └─ ${child.name}`);
        }
      });
    });
  } else {
    console.log('Running full ingestion for all agencies');
    console.log('🔍 DEBUGGING: Starting full ingestion hierarchy processing...');

    // For full ingestion, we need to include both:
    // 1. Agencies with direct CFR references
    // 2. Child agencies whose parents have CFR references (even if the children don't)

    // First, build the hierarchy map from ALL agencies (before filtering)
    const hierarchyMap = new Map<string, string[]>();

    for (const agency of allAgencies) {
      if (agency.children && agency.children.length > 0) {
        const childSlugs = agency.children.map(child => child.slug);
        hierarchyMap.set(agency.slug, childSlugs);
        console.log(`Found hierarchy: ${agency.name} has ${childSlugs.length} children: ${agency.children.map(c => c.name).join(', ')}`);
      }
    }

    console.log(`🔍 DEBUGGING: Built hierarchy map with ${hierarchyMap.size} parent agencies`);

    // Find agencies with direct CFR references
    const agenciesWithDirectCFR = allAgencies.filter(agency =>
      agency.cfr_references && agency.cfr_references.length > 0
    );

    console.log(`🔍 DEBUGGING: Found ${agenciesWithDirectCFR.length} agencies with direct CFR references`);

    // Start with agencies that have direct CFR references
    const agenciesToInclude = [...agenciesWithDirectCFR];
    console.log(`🔍 DEBUGGING: Starting with ${agenciesToInclude.length} agencies with direct CFR references`);

    // For each parent agency with CFR references, include its children even if they don't have CFR references
    for (const parentAgency of agenciesWithDirectCFR) {
      if (hierarchyMap.has(parentAgency.slug)) {
        const childSlugs = hierarchyMap.get(parentAgency.slug)!;
        console.log(`🔍 DEBUGGING: Looking for children of ${parentAgency.name} with slugs: ${childSlugs.join(', ')}`);

        // Instead of looking for children in allAgencies (where they don't exist as separate entities),
        // get them directly from the parent's children array
        const childAgencies = parentAgency.children || [];

        console.log(`🔍 DEBUGGING: Found ${childAgencies.length} children for ${parentAgency.name}: ${childAgencies.map(c => c.name).join(', ')}`);

        // For each child, check if it has CFR references
        const childrenWithCFR = childAgencies.filter(child =>
          child.cfr_references && child.cfr_references.length > 0
        );

        console.log(`🔍 DEBUGGING: ${childrenWithCFR.length} of ${childAgencies.length} children have CFR references for ${parentAgency.name}: ${childrenWithCFR.map(c => c.name).join(', ')}`);

        for (const child of childrenWithCFR) {
          if (!agenciesToInclude.find(a => a.slug === child.slug)) {
            console.log(`🔍 DEBUGGING: Adding child agency ${child.name} (parent: ${parentAgency.name})`);
            agenciesToInclude.push(child);
          }
        }
      }
    }

    console.log(`🔍 DEBUGGING: Total agencies to include (parents + children): ${agenciesToInclude.length}`);

    // Now restore the children relationships for agencies in our final list
    for (const agency of agenciesToInclude) {
      if (hierarchyMap.has(agency.slug)) {
        const childSlugs = hierarchyMap.get(agency.slug)!;
        // Find children that are in our final list
        agency.children = agenciesToInclude.filter(a => childSlugs.includes(a.slug));
        if (agency.children.length > 0) {
          console.log(`Restored hierarchy: ${agency.name} has ${agency.children.length} children in final set`);
        }
      }
    }

    agenciesWithCFR = agenciesToInclude;
  }

  console.log(`Found ${agenciesWithCFR.length} agencies with CFR references out of ${allAgencies.length} total agencies`);

  // Create agencies in database and get their IDs
  const createdAgencies: Array<{ id: number; name: string; slug: string; description: string | null; parentId: number | null }> = [];
  const agencyTitleMap = new Map<string, number[]>(); // Map agency slug to their CFR title numbers
  const agencyHierarchyMap = new Map<string, string[]>(); // Map parent slug to child slugs

  // First pass: Create all agencies without parent relationships
  for (const rawAgency of agenciesWithCFR) {
    const createdAgency = await prisma.agency.upsert({
      where: { slug: rawAgency.slug },
      update: {
        name: rawAgency.name,
        description: rawAgency.short_name,
        // Don't update parentId here - we'll set it in second pass
      },
      create: {
        name: rawAgency.name,
        description: rawAgency.short_name,
        slug: rawAgency.slug,
        // parentId will be null initially
      },
    });
    createdAgencies.push(createdAgency);

    // Get CFR title references for this agency
    const titleNumbers = rawAgency.cfr_references?.map((ref: { title: number; chapter: string }) => ref.title) || [];
    agencyTitleMap.set(rawAgency.slug, titleNumbers);

    // Store children information for hierarchy setup from eCFR API data
    // This works for both limited and full ingestion
    if (rawAgency.children && rawAgency.children.length > 0) {
      // Filter children to only include those that are also in our selected agencies
      const childSlugsInSystem = rawAgency.children
        .map(child => child.slug)
        .filter(childSlug => agenciesWithCFR.some(a => a.slug === childSlug));

      if (childSlugsInSystem.length > 0) {
        agencyHierarchyMap.set(rawAgency.slug, childSlugsInSystem);
        console.log(`${rawAgency.name} has ${childSlugsInSystem.length} children in system: ${rawAgency.children.filter(c => childSlugsInSystem.includes(c.slug)).map(c => c.name).join(', ')}`);
      }
    }

    console.log(`${rawAgency.name} references CFR titles: ${titleNumbers.join(', ')}`);
  }

  // Second pass: Establish parent-child relationships
  console.log('\nEstablishing agency hierarchy relationships...');
  console.log(`AgencyHierarchyMap has ${agencyHierarchyMap.size} entries`);

  for (const [parentSlug, childSlugs] of agencyHierarchyMap.entries()) {
    console.log(`Processing parent ${parentSlug} with ${childSlugs.length} children: ${childSlugs.join(', ')}`);
    const parentAgency = createdAgencies.find(a => a.slug === parentSlug);
    if (!parentAgency) {
      console.log(`  Parent agency ${parentSlug} not found in created agencies`);
      continue;
    }

    for (const childSlug of childSlugs) {
      // Check if the child agency is also in our filtered list
      const childAgency = createdAgencies.find(a => a.slug === childSlug);
      if (childAgency) {
        // Update the child to point to its parent
        await prisma.agency.update({
          where: { id: childAgency.id },
          data: { parentId: parentAgency.id },
        });
        console.log(`Set ${childAgency.name} as child of ${parentAgency.name}`);
      } else {
        console.log(`  Child agency ${childSlug} not found in created agencies`);
      }
    }
  }  console.log('Fetching titles...');
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

  // Report on agency hierarchy established
  console.log('\n=== AGENCY HIERARCHY ESTABLISHED ===');
  const hierarchyReport = [];
  for (const agency of createdAgencies) {
    if (agencyHierarchyMap.has(agency.slug)) {
      const childSlugs = agencyHierarchyMap.get(agency.slug)!;
      const childrenInSystem = childSlugs.filter(slug =>
        createdAgencies.some(a => a.slug === slug)
      );
      if (childrenInSystem.length > 0) {
        const childNames = childrenInSystem.map(slug =>
          createdAgencies.find(a => a.slug === slug)?.name || slug
        );
        hierarchyReport.push(`${agency.name}: ${childNames.join(', ')}`);
      }
    }
  }

  if (hierarchyReport.length > 0) {
    console.log('Department hierarchies established:');
    hierarchyReport.forEach(report => console.log(`  ${report}`));
  } else {
    console.log('No hierarchical relationships found in the selected agencies.');
  }
  console.log('==========================================\n');

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
    const impactLevel = agencies.length >= 4 ? 'HIGH IMPACT' :
                       agencies.length >= 3 ? 'MEDIUM IMPACT' :
                       'SINGLE AGENCY';

    console.log(`  ${impactLevel} CFR Title ${titleNum}: ${titleInfo?.name}`);
    console.log(`    └─ Affects ${agencies.length} agencies: ${agencies.join(', ')}`);
  });

  // Summary statistics
  const highImpactTitles = titlesByImpact.filter(([, agencies]) => agencies.length >= 4);
  const mediumImpactTitles = titlesByImpact.filter(([, agencies]) => agencies.length === 3);
  const singleAgencyTitles = titlesByImpact.filter(([, agencies]) => agencies.length <= 2);

  console.log('\n=== REGULATORY IMPACT SUMMARY ===');
  console.log(`Total CFR Titles Analyzed: ${titlesByImpact.length}`);
  console.log(`High Impact (4+ agencies): ${highImpactTitles.length} titles`);
  console.log(`Medium Impact (3 agencies): ${mediumImpactTitles.length} titles`);
  console.log(`Single/Low Impact (≤2 agencies): ${singleAgencyTitles.length} titles`);

  const totalTitleInstances = Array.from(titleAgencyMap.values())
    .reduce((sum, agencies) => sum + agencies.length, 0);
  console.log(`Total Title-Agency Relationships: ${totalTitleInstances}`);
  console.log(`Average Agencies per Title: ${(totalTitleInstances / titlesByImpact.length).toFixed(1)}`);
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

      // Parse sections using improved XML parsing (with xml2js)
      const sections = parseSections(content);

      console.log(`Parsed ${sections.length} sections for CFR Title ${titleNumber}`);
      if (sections.length === 0) {
        console.warn(`No sections found for CFR Title ${titleNumber}, trying alternative approach...`);
        // Could try fetchSectionsFromStructure here as an alternative
      }

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
