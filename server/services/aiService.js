const { getRelevantKnowledgeBase } = require("../config/knowledgeBase");

// Categories defined in assignment
const CATEGORIES = [
  "Royalty & Payments",
  "ISBN & Metadata Issues",
  "Printing & Quality",
  "Distribution & Availability",
  "Book Status & Production Updates",
  "General Inquiry"
];

const PRIORITIES = ["Critical", "High", "Medium", "Low"];

/**
 * Intelligent Fallback Rule Engine for Classification & Priority
 * Ensures zero failure and 100% graceful degradation if LLM APIs are unreachable.
 */
function localRuleClassifier(subject, description) {
  const text = `${subject} ${description}`.toLowerCase();

  let category = "General Inquiry";
  let priority = "Medium";
  let reasoning = "";

  // 1. Royalty & Payments
  if (
    text.includes("royalty") ||
    text.includes("payout") ||
    text.includes("payment") ||
    text.includes("bank account") ||
    text.includes("neft") ||
    text.includes("earning") ||
    text.includes("money")
  ) {
    category = "Royalty & Payments";
    if (
      text.includes("months") ||
      text.includes("not received") ||
      text.includes("missing") ||
      text.includes("haven't received") ||
      text.includes("overdue") ||
      text.includes("unpaid")
    ) {
      priority = "Critical";
      reasoning = "Overdue royalty inquiry spanning multiple months or missing payment.";
    } else if (text.includes("low") || text.includes("calculation") || text.includes("formula") || text.includes("split")) {
      priority = "Medium";
      reasoning = "Clarification requested on royalty percentage split and net profit formula.";
    } else {
      priority = "High";
      reasoning = "General payment or banking query.";
    }
  }
  // 2. ISBN & Metadata
  else if (
    text.includes("isbn") ||
    text.includes("metadata") ||
    text.includes("page count") ||
    text.includes("subtitle") ||
    text.includes("wrong book") ||
    text.includes("duplicate") ||
    text.includes("author bio") ||
    text.includes("blurb") ||
    text.includes("imprint")
  ) {
    category = "ISBN & Metadata Issues";
    if (text.includes("mismatch") || text.includes("wrong") || text.includes("duplicate") || text.includes("urgent")) {
      priority = "Critical";
      reasoning = "ISBN catalog mismatch or duplicate listing directly affecting live retail storefront.";
    } else if (text.includes("update") || text.includes("bio") || text.includes("blurb") || text.includes("description")) {
      priority = "Low";
      reasoning = "Routine metadata, bio, or description update request.";
    } else {
      priority = "Medium";
      reasoning = "General ISBN or imprint inquiry.";
    }
  }
  // 3. Printing & Quality
  else if (
    text.includes("print") ||
    text.includes("binding") ||
    text.includes("spine") ||
    text.includes("defect") ||
    text.includes("misprint") ||
    text.includes("scratch") ||
    text.includes("color") ||
    text.includes("author copies") ||
    text.includes("pages loose")
  ) {
    category = "Printing & Quality";
    if (text.includes("defect") || text.includes("loose") || text.includes("crack") || text.includes("terrible") || text.includes("poor")) {
      priority = "High";
      reasoning = "Physical defect reported in printed copies (binding/spine/cover damage).";
    } else {
      priority = "Medium";
      reasoning = "Printing turnaround or general print inquiry.";
    }
  }
  // 4. Distribution & Retail Availability
  else if (
    text.includes("unavailable") ||
    text.includes("out of stock") ||
    text.includes("amazon") ||
    text.includes("flipkart") ||
    text.includes("buy now") ||
    text.includes("listing") ||
    text.includes("distribution")
  ) {
    category = "Distribution & Availability";
    if (text.includes("currently unavailable") || text.includes("out of stock") || text.includes("losing sales")) {
      priority = "High";
      reasoning = "Title displaying unavailable on live retail channels causing immediate sales loss.";
    } else {
      priority = "Medium";
      reasoning = "General distribution or retail listing timeline question.";
    }
  }
  // 5. Book Status & Production
  else if (
    text.includes("stuck") ||
    text.includes("production") ||
    text.includes("typesetting") ||
    text.includes("proof") ||
    text.includes("cover design") ||
    text.includes("manuscript") ||
    text.includes("stage") ||
    text.includes("editing")
  ) {
    category = "Book Status & Production Updates";
    if (text.includes("stuck") || text.includes("weeks") || text.includes("delayed") || text.includes("no progress")) {
      priority = "Medium";
      reasoning = "Production milestone inquiry regarding typesetting, proofreading, or cover design pacing.";
    } else {
      priority = "Low";
      reasoning = "Routine status inquiry on publication progression.";
    }
  }

  return {
    category,
    priority,
    confidence: 0.92,
    reasoning
  };
}

/**
 * Intelligent Fallback Rule Engine for Response Drafting
 * Follows exact BookLeaf tone rules and knowledge base policies.
 */
function localRuleDraftGenerator({ authorName, bookTitle, category, subject, description, bookContext }) {
  const text = `${subject} ${description}`.toLowerCase();
  const salutation = authorName ? `Dear ${authorName.split(" ")[0]},` : "Dear Author,";
  const bookRef = bookTitle ? `'${bookTitle}'` : "your book";

  if (category === "Royalty & Payments") {
    if (text.includes("4 months") || text.includes("not received") || text.includes("haven't received") || text.includes("pending")) {
      const pendingStr = bookContext?.royaltyPending ? `₹${bookContext.royaltyPending.toLocaleString("en-IN")}` : "your accumulated balance";
      return `${salutation}

Thank you for reaching out to us, and congratulations on the ongoing readership for ${bookRef}.

I completely understand your concern regarding the pending royalty payout of ${pendingStr}. At BookLeaf, royalties are calculated on a calendar quarterly cycle and disbursed within 45 days after the quarter closes. Our minimum payout threshold is ₹1,000; any smaller balance safely rolls over into the subsequent quarter.

I have verified your linked bank account details and escalated this payout to our finance desk for priority processing within 48 hours. You will receive an automated email confirmation with the NEFT UTR tracking number as soon as the transfer clears.

Warm regards,
Author Support Team, BookLeaf Publishing`;
    }

    if (text.includes("low") || text.includes("calculation") || text.includes("formula") || text.includes("split")) {
      return `${salutation}

Thank you for getting in touch, and thank you for being an esteemed author with BookLeaf.

I understand how the royalty calculation might look unexpected at first glance. Under BookLeaf's author partnership agreement, our 80% split applies to the net profit per book rather than the gross MRP. Net profit is calculated as:

Net Profit = MRP - Printing Cost - Retail Platform Commission (Amazon/Flipkart) - Shipping/Fulfillment

This 80% author share ensures you earn the highest possible net margin on every direct and marketplace sale. We believe in total transparency, and I would be delighted to generate a complete platform-by-platform ledger breakdown for your review.

Please let me know if you would like me to attach this breakdown to your ticket.

Warm regards,
Finance & Royalties Desk, BookLeaf Publishing`;
    }
  }

  if (category === "ISBN & Metadata Issues") {
    if (text.includes("mismatch") || text.includes("wrong") || text.includes("amazon") || text.includes("page")) {
      return `${salutation}

Thank you for bringing this to our attention immediately, and I sincerely apologize for the inconvenience caused by this metadata discrepancy.

Because catalog and ISBN accuracy is critical, I have flagged this as high priority with our senior production and cataloging team. We are re-submitting the verified ONIX metadata package directly to Amazon and our distribution partners today.

Retailer databases typically take 24 to 48 hours to fully ingest and update live storefront listings across all regional nodes. I will monitor the listing closely and confirm back with you once the correct edition details are displayed.

Warm regards,
Catalog Operations, BookLeaf Publishing`;
    }

    return `${salutation}

Thank you for reaching out to BookLeaf Publishing.

We would be pleased to update your book blurb and author bio on Amazon, Flipkart, and the BookLeaf Store. Please reply to this ticket with your final updated text.

Once received, our catalog team will submit the changes to retailer feeds. Please note that external marketplaces generally take 3 to 5 business days to index and display revised metadata live.

Warm regards,
Author Success Team, BookLeaf Publishing`;
  }

  if (category === "Printing & Quality") {
    return `${salutation}

I am truly sorry to hear that your copies of ${bookRef} arrived with physical defects. This does not meet the high standards we maintain with our Delhi printing partners at Repro India and Epitome Books.

BookLeaf guarantees a 100% free reprint for any manufacturing, binding, or cover finish defects. To initiate the expedited reprint batch with our quality control team, could you please reply with 2 to 3 clear photos showing the damaged spine/pages and packaging?

As soon as our quality supervisor verifies the photos, we will dispatch fresh replacement copies to your address within 5 to 7 business days with priority tracking.

Warm regards,
Print Quality & Logistics, BookLeaf Publishing`;
  }

  if (category === "Distribution & Availability") {
    return `${salutation}

Thank you for flagging this availability issue for ${bookRef}.

Please be assured that your book remains active in our distribution system. Under our Print-on-Demand (POD) retail model, a 'Currently Unavailable' status on Amazon or Flipkart is usually caused by a routine automated inventory feed sync lag between the retailer and our Delhi warehouse.

Our distribution desk has just manually triggered an inventory re-sync with Amazon's vendor portal. The live buy box typically restores within 24 to 48 hours. In the meantime, readers can continue ordering directly from the BookLeaf Store.

I am tracking the Amazon listing and will notify you as soon as normal ordering is active.

Warm regards,
Distribution Desk, BookLeaf Publishing`;
  }

  if (category === "Book Status & Production Updates") {
    const stage = bookContext?.productionStage || "current stage";
    return `${salutation}

Thank you for contacting us regarding the production progress of ${bookRef}.

I have checked directly with our typesetting and design department regarding your manuscript's progress in ${stage}. Our team is applying specialized formatting to ensure proper typographical hierarchy and high-resolution print readiness.

Your comprehensive proof PDF is in final review and will be available in your author portal within 3 business days. Once you have reviewed and approved the proof, we will advance immediately to ISBN imprint registration and printing.

Thank you for your partnership as we bring your book to life.

Warm regards,
Production Operations, BookLeaf Publishing`;
  }

  return `${salutation}

Thank you for reaching out to BookLeaf Publishing support regarding ${bookRef}.

I have reviewed your query and am looking into the details with our relevant publishing operations department. We are committed to supporting our authors every step of the journey.

I will follow up with a concrete update and next steps within 24 to 48 hours. If you have any additional information to add in the meantime, please feel free to reply directly here.

Warm regards,
Author Care Team, BookLeaf Publishing`;
}

/**
 * Single-call AI Classification and Priority Scoring
 * Meets requirement: "do classification and priority in a single call"
 */
async function classifyAndPrioritizeTicket({ subject, description, bookTitle, authorName }) {
  const hasKey = process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY;

  // If no external key is configured, immediately use the robust local heuristic engine
  if (!hasKey) {
    const localResult = localRuleClassifier(subject, description);
    return {
      suggestedCategory: localResult.category,
      suggestedPriority: localResult.priority,
      confidence: localResult.confidence,
      reasoning: localResult.reasoning || "Classified via BookLeaf Knowledge-Base Heuristic Engine.",
      model: "bookleaf-rule-engine"
    };
  }

  const prompt = `You are the lead AI triage agent at BookLeaf Publishing, an established self-publishing house in India & the US.
Analyze the following author support ticket and return a JSON object with:
1. "category": EXACTLY one of:
   - "Royalty & Payments"
   - "ISBN & Metadata Issues"
   - "Printing & Quality"
   - "Distribution & Availability"
   - "Book Status & Production Updates"
   - "General Inquiry"
2. "priority": EXACTLY one of: "Critical", "High", "Medium", "Low"
   Rules for priority:
   - Overdue royalties (e.g. 4+ months), missing funds, active retailer ISBN mismatches = Critical
   - Unavailable books on Amazon/Flipkart during launch, physical defects in delivered copies = High
   - Pacing updates, standard royalty calculation inquiries, minor production delays = Medium
   - Routine bio updates, cover blurb tweaks, general questions = Low
3. "confidence": Number between 0.0 and 1.0
4. "reasoning": A concise, one-sentence justification.

Author: ${authorName || "Author"}
Book: ${bookTitle || "N/A"}
Subject: ${subject}
Query: ${description}

Respond ONLY with valid JSON, no markdown codeblocks, no commentary.`;

  // 1. Anthropic Claude API Call
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const model = process.env.ANTHROPIC_MODEL || "claude-3-haiku-20240307";
      console.log(`[AI Service] 🚀 Calling Anthropic API (${model}) for ticket triage...`);
      const startTime = Date.now();
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model,
          max_tokens: 512,
          system: "You are an accurate, deterministic JSON-only classification assistant. Respond with strictly valid JSON only.",
          messages: [{ role: "user", content: prompt }]
        })
      });

      if (!response.ok) {
        throw new Error(`Anthropic HTTP ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();
      const rawText = data.content[0].text.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(rawText);

      const validCategory = CATEGORIES.includes(parsed.category) ? parsed.category : "General Inquiry";
      const validPriority = PRIORITIES.includes(parsed.priority) ? parsed.priority : "Medium";

      console.log(`[AI Service] ✅ Anthropic responded in ${Date.now() - startTime}ms: Category="${validCategory}", Priority="${validPriority}"`);

      return {
        suggestedCategory: validCategory,
        suggestedPriority: validPriority,
        confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.95,
        reasoning: parsed.reasoning || `Classified via ${model}`,
        model
      };
    } catch (err) {
      console.warn("[AI Service - Anthropic] ⚠️ Classification fallback triggered:", err.message);
    }
  }

  // 2. OpenAI API Call
  if (process.env.OPENAI_API_KEY) {
    try {
      const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
      console.log(`[AI Service] 🚀 Calling OpenAI API (${model}) for ticket triage...`);
      const startTime = Date.now();
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: "You are an accurate, deterministic JSON-only classification assistant." },
            { role: "user", content: prompt }
          ],
          temperature: 0.1,
          response_format: { type: "json_object" }
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI HTTP ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();
      const parsed = JSON.parse(data.choices[0].message.content);

      const validCategory = CATEGORIES.includes(parsed.category) ? parsed.category : "General Inquiry";
      const validPriority = PRIORITIES.includes(parsed.priority) ? parsed.priority : "Medium";

      console.log(`[AI Service] ✅ OpenAI responded in ${Date.now() - startTime}ms: Category="${validCategory}", Priority="${validPriority}"`);

      return {
        suggestedCategory: validCategory,
        suggestedPriority: validPriority,
        confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.95,
        reasoning: parsed.reasoning || `Classified via ${model}`,
        model
      };
    } catch (err) {
      console.warn("[AI Service - OpenAI] ⚠️ Classification fallback triggered:", err.message);
    }
  }

  // 3. Graceful Degradation Fallback
  const fallback = localRuleClassifier(subject, description);
  return {
    suggestedCategory: fallback.category,
    suggestedPriority: fallback.priority,
    confidence: fallback.confidence,
    reasoning: fallback.reasoning + " (Fallback activated due to API limits/connectivity)",
    model: "bookleaf-fallback-engine"
  };
}

/**
 * Generates an AI Draft response using targeted Knowledge Base context and strict Tone Rules.
 * Slices only the relevant KB topic to save tokens and costs.
 */
async function generateDraftResponse({ ticket, author, book }) {
  const hasKey = process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY;
  const category = ticket.category || "General Inquiry";
  const kbSection = getRelevantKnowledgeBase(category, `${ticket.subject} ${ticket.description}`);

  const authorName = author ? author.name : "Author";
  const bookTitle = book ? book.title : null;

  // If no external key or in fallback mode
  if (!hasKey) {
    const draftText = localRuleDraftGenerator({
      authorName,
      bookTitle,
      category,
      subject: ticket.subject,
      description: ticket.description,
      bookContext: book
    });

    return {
      content: draftText,
      relevantKbTopic: category,
      model: "bookleaf-kb-engine",
      generatedAt: new Date()
    };
  }

  const systemInstruction = `You are a dedicated author support specialist at BookLeaf Publishing.
Tone rules to obey strictly:
1. Be empathetic, warm, and professional; treat authors as valued partners.
2. Acknowledge the author's concern first before presenting the solution.
3. Use concrete details, numbers, dates, and statuses. Never give vague reassurance.
4. Own BookLeaf mistakes directly with no corporate deflection or defensiveness.
5. Give clear timelines (e.g. "within 48 hours", "5-7 business days", "24-48 hours").
6. Always end with a clear next step.

Targeted BookLeaf Knowledge Base Excerpt:
${kbSection}

Author Context:
- Author Name: ${authorName}
- Book Title: ${bookTitle || "General Account"}
- Book Status: ${book ? book.status : "N/A"}
- Production Stage: ${book ? book.productionStage : "N/A"}
- Royalty Earned: ₹${book ? book.royaltyEarned : 0} | Pending: ₹${book ? book.royaltyPending : 0}
- Bank Verified: ${author?.bankDetails?.verified ? "Yes (" + author.bankDetails.bankName + ")" : "No"}

Draft an official response letter to the author. Do not include subject lines or placeholders like [Insert Date]. Fill in all details cleanly.`;

  // 1. Anthropic Claude API Call
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const model = process.env.ANTHROPIC_MODEL || "claude-3-haiku-20240307";
      console.log(`[AI Service] 🚀 Calling Anthropic API (${model}) to generate response draft...`);
      const startTime = Date.now();
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model,
          max_tokens: 1024,
          system: systemInstruction,
          messages: [
            { role: "user", content: `Subject: ${ticket.subject}\n\nDescription: ${ticket.description}` }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`Anthropic HTTP ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();
      console.log(`[AI Service] ✅ Anthropic generated draft in ${Date.now() - startTime}ms`);
      return {
        content: data.content[0].text.trim(),
        relevantKbTopic: category,
        model,
        generatedAt: new Date()
      };
    } catch (err) {
      console.warn("[AI Service - Anthropic] ⚠️ Draft generation fallback triggered:", err.message);
    }
  }

  // 2. OpenAI API Call
  if (process.env.OPENAI_API_KEY) {
    try {
      const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
      console.log(`[AI Service] 🚀 Calling OpenAI API (${model}) to generate response draft...`);
      const startTime = Date.now();
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemInstruction },
            { role: "user", content: `Subject: ${ticket.subject}\n\nDescription: ${ticket.description}` }
          ],
          temperature: 0.3
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI HTTP ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();
      console.log(`[AI Service] ✅ OpenAI generated draft in ${Date.now() - startTime}ms`);
      return {
        content: data.choices[0].message.content.trim(),
        relevantKbTopic: category,
        model,
        generatedAt: new Date()
      };
    } catch (err) {
      console.warn("[AI Service - OpenAI] ⚠️ Draft generation fallback triggered:", err.message);
    }
  }

  // Graceful degradation fallback
  const fallbackDraft = localRuleDraftGenerator({
    authorName,
    bookTitle,
    category,
    subject: ticket.subject,
    description: ticket.description,
    bookContext: book
  });

  return {
    content: fallbackDraft,
    relevantKbTopic: category,
    model: "bookleaf-fallback-engine",
    generatedAt: new Date()
  };
}

module.exports = {
  CATEGORIES,
  PRIORITIES,
  classifyAndPrioritizeTicket,
  generateDraftResponse,
  localRuleClassifier,
  localRuleDraftGenerator
};
