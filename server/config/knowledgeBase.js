/**
 * BookLeaf Publishing - Knowledge Base
 * 
 * Fed to the AI service with category-targeted slicing to optimize
 * context window and token costs.
 */

const KNOWLEDGE_BASE = {
  company: {
    title: "Company & Packages",
    keywords: ["package", "standard free", "bestseller", "delhi", "warehouse", "repro", "epitome"],
    content: `
BookLeaf Publishing is a leading self-publishing house operating across India and the US.
Packages:
- Standard Free: Core publishing package covering basic formatting, standard cover design, and distribution.
- Bestseller Breakthrough: Paid premium tier with enhanced marketing, premium cover design, and priority distribution add-ons.
Operations:
- BookLeaf handles cover design, typesetting, ISBN assignment, printing, multi-platform distribution, and royalties.
- Printing facility and primary central warehouse are situated in Delhi.
- Official commercial print partners are Repro India and Epitome Books.
`
  },

  royalties: {
    title: "Royalties & Payments",
    keywords: ["royalty", "payment", "net profit", "quarterly", "payout", "threshold", "bank", "split", "percentage"],
    content: `
Royalty Structure & Calculations:
- Net Profit Split: 80% to the author, 20% to BookLeaf Publishing.
- Net Profit Formula: Net Profit = MRP - Printing Cost - Platform Commission (Amazon / Flipkart / Retailer fee) - Shipping / Delivery.
- Payout Schedule: Royalties are calculated on a calendar quarterly cycle and disbursed within 45 days after the quarter ends.
  - Q1 (Jan - Mar): Paid by May 15
  - Q2 (Apr - Jun): Paid by Aug 15
  - Q3 (Jul - Sep): Paid by Nov 15
  - Q4 (Oct - Dec): Paid by Feb 15
- Minimum Payout Threshold: ₹1,000. If earnings in a given quarter are below ₹1,000, the balance rolls over to the subsequent quarter.
- Mode of Disbursement: Direct NEFT/IMPS bank transfer to the verified bank account linked in the Author Dashboard.
- Dashboard Visibility: The Author Dashboard shows a live per-platform breakdown of copies sold, royalties accrued, paid amounts, and rollover balances.
`
  },

  isbn: {
    title: "ISBN & Metadata Issues",
    keywords: ["isbn", "imprint", "barcode", "metadata", "title", "blurb", "bio", "amazon listing", "flipkart listing", "page count"],
    content: `
ISBN Guidelines & Policies:
- Imprint: BookLeaf assigns a complimentary unique ISBN under its registered BookLeaf imprint.
- Custom Imprint: Authors wishing to publish under their own imprint must procure and provide their own registered ISBN.
- Error Handling: ISBN mismatches, duplicate listings, wrong editions, or incorrect metadata on Amazon/Flipkart are classified as Critical / High Priority.
- Escalation: ISBN issues are escalated immediately to the Cataloging and Production teams.
- Propagation Time: Metadata revisions (author bio, book blurb, categories) submitted to retail partners take 3 to 5 business days to index and reflect on live store pages.
`
  },

  printing: {
    title: "Printing & Physical Quality",
    keywords: ["print", "defect", "misprint", "binding", "cover", "spine", "color", "reprint", "paper quality", "warehouse"],
    content: `
Printing Turnaround & Quality Assurance:
- Production Turnaround: Standard print turnaround for author copies or inventory replenishment is 5 to 7 business days from Delhi facility.
- Manufacturing Defects: For misprints, binding issues, inverted pages, cutting errors, or cover smudges, BookLeaf provides a 100% free reprint.
- Defect Verification: The author is asked to provide 2-3 clear photographs showing the defect and packaging barcode.
- Dispatch of Replacements: Once photographic proof is confirmed, replacement copies are prioritized and dispatched within 5 to 7 business days with expedited tracking.
`
  },

  distribution: {
    title: "Distribution & Retail Availability",
    keywords: ["distribution", "available", "unavailable", "out of stock", "amazon", "flipkart", "amazon us", "amazon uk", "store"],
    content: `
Retail Channels & Availability:
- Distribution Channels: Books are listed on Amazon India, Flipkart, BookLeaf Online Store, Amazon US, and Amazon UK.
- Go-Live Timeline: Newly published titles go live across digital catalog feeds within 7 to 10 business days of final file approval.
- "Currently Unavailable" Status: Under Print-on-Demand (POD), "Currently Unavailable" on Amazon or Flipkart almost always indicates an automated inventory stock sync delay between the retailer's catalog API and BookLeaf's Delhi fulfillment node.
- Resolution: A catalog inventory re-sync is initiated via Amazon Seller Central / Flipkart portal, which restores active purchase availability within 24 to 48 hours.
`
  },

  production: {
    title: "Book Status & Production Updates",
    keywords: ["status", "stage", "manuscript", "editing", "cover design", "typesetting", "proofreading", "delay", "timeline"],
    content: `
Production Milestones & Stages:
Stage Sequence:
1. Manuscript Received: Initial file intake and formatting check.
2. Editing (Optional / Add-on): Developmental or copy editing.
3. Cover Design: Custom or template cover concept creation.
4. Typesetting: Interior page formatting, font styling, running headers, table of contents.
5. Proofreading: Author review and revision rounds.
6. ISBN Assignment: Barcode generation and imprint registration.
7. Printing: Test proof copy and inventory run at Delhi plant.
8. Distribution Setup: Metadata ingestion across Amazon, Flipkart, and global channels.
9. Published & Live: Commercial availability for readers worldwide.

Common Bottlenecks & Delays:
- Delays most frequently occur at Cover Design (awaiting author review/feedback iterations) and Proofreading (author revision cycles).
- Tone Rule: Explain delays transparently, collaboratively, and factually without shifting blame to the author. Provide revised concrete turnaround dates.
`
  }
};

/**
 * Returns targeted knowledge base text based on category or query keywords.
 * Minimizes LLM prompt token consumption while providing full context.
 */
function getRelevantKnowledgeBase(category, queryText = "") {
  const normCat = (category || "").toLowerCase();
  const normQuery = (queryText || "").toLowerCase();

  let relevantSections = [];

  // Direct category matching
  if (normCat.includes("royalty") || normCat.includes("payment")) {
    relevantSections.push(KNOWLEDGE_BASE.royalties);
  } else if (normCat.includes("isbn") || normCat.includes("metadata")) {
    relevantSections.push(KNOWLEDGE_BASE.isbn);
  } else if (normCat.includes("print") || normCat.includes("quality")) {
    relevantSections.push(KNOWLEDGE_BASE.printing);
  } else if (normCat.includes("distribution") || normCat.includes("availab")) {
    relevantSections.push(KNOWLEDGE_BASE.distribution);
  } else if (normCat.includes("status") || normCat.includes("production")) {
    relevantSections.push(KNOWLEDGE_BASE.production);
  } else {
    // Keyword scan
    for (const [key, section] of Object.entries(KNOWLEDGE_BASE)) {
      if (section.keywords.some(kw => normQuery.includes(kw))) {
        relevantSections.push(section);
      }
    }
  }

  // Always include company snippet if no specific matches
  if (relevantSections.length === 0) {
    relevantSections.push(KNOWLEDGE_BASE.company);
    relevantSections.push(KNOWLEDGE_BASE.royalties);
    relevantSections.push(KNOWLEDGE_BASE.production);
  } else {
    // Always attach brief company context for context
    relevantSections.unshift(KNOWLEDGE_BASE.company);
  }

  return relevantSections.map(s => `### ${s.title}\n${s.content.trim()}`).join("\n\n");
}

module.exports = {
  KNOWLEDGE_BASE,
  getRelevantKnowledgeBase
};
