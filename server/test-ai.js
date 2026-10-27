const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, ".env") });

const { classifyAndPrioritizeTicket, generateDraftResponse } = require("./services/aiService");

async function runTest() {
  console.log("==================================================");
  console.log(" 🔍 BookLeaf AI API Connectivity & Triage Test");
  console.log("==================================================");

  const hasGroq = !!process.env.GROQ_API_KEY;
  const hasGemini = !!process.env.GEMINI_API_KEY;
  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;
  const hasOpenAI = !!process.env.OPENAI_API_KEY;

  if (hasGroq) {
    const keyPreview = process.env.GROQ_API_KEY.slice(0, 8) + "..." + process.env.GROQ_API_KEY.slice(-4);
    console.log(`[Config] Provider: Groq (100% Free Tier, No Card)`);
    console.log(`[Config] Model:    ${process.env.GROQ_MODEL || "llama-3.1-8b-instant"}`);
    console.log(`[Config] Key:      ${keyPreview}`);
  } else if (hasGemini) {
    const keyPreview = process.env.GEMINI_API_KEY.slice(0, 8) + "..." + process.env.GEMINI_API_KEY.slice(-4);
    console.log(`[Config] Provider: Google Gemini (100% Free Tier, No Card)`);
    console.log(`[Config] Model:    ${process.env.GEMINI_MODEL || "gemini-1.5-flash"}`);
    console.log(`[Config] Key:      ${keyPreview}`);
  } else if (hasAnthropic) {
    const keyPreview = process.env.ANTHROPIC_API_KEY.slice(0, 10) + "..." + process.env.ANTHROPIC_API_KEY.slice(-4);
    console.log(`[Config] Provider: Anthropic Claude`);
    console.log(`[Config] Model:    ${process.env.ANTHROPIC_MODEL || "claude-3-haiku-20240307"}`);
    console.log(`[Config] Key:      ${keyPreview}`);
  } else if (hasOpenAI) {
    const keyPreview = process.env.OPENAI_API_KEY.slice(0, 7) + "..." + process.env.OPENAI_API_KEY.slice(-4);
    console.log(`[Config] Provider: OpenAI`);
    console.log(`[Config] Model:    ${process.env.OPENAI_MODEL || "gpt-4o-mini"}`);
    console.log(`[Config] Key:      ${keyPreview}`);
  } else {
    console.log("[Config] Provider: Local Knowledge-Base Grounded Engine (No external API key set in server/.env)");
  }

  const sampleTicket = {
    subject: "Haven't received any royalty for 5 months",
    description: "I published my book 'Whispers of the Ganges' and have not received any payment. Over ₹3,500 is showing as pending in my dashboard. Please explain the delay.",
    authorName: "Priya Sharma",
    bookTitle: "Whispers of the Ganges"
  };

  console.log("\n--- Test 1: Single-Call AI Triage (Classification & Priority) ---");
  const startTime = Date.now();
  const triageResult = await classifyAndPrioritizeTicket(sampleTicket);
  const triageDuration = Date.now() - startTime;

  console.log(`⏱️ Response Time: ${triageDuration}ms`);
  console.log(`🏷️ Category:     ${triageResult.suggestedCategory}`);
  console.log(`🚨 Priority:     ${triageResult.suggestedPriority}`);
  console.log(`🧠 Reasoning:    ${triageResult.reasoning}`);
  console.log(`🤖 Engine/Model: ${triageResult.model}`);

  console.log("\n--- Test 2: Targeted Response Draft Generation ---");
  const draftStartTime = Date.now();
  const draftResult = await generateDraftResponse({
    ticket: {
      subject: sampleTicket.subject,
      description: sampleTicket.description,
      category: triageResult.suggestedCategory
    },
    author: { name: sampleTicket.authorName },
    book: { title: sampleTicket.bookTitle, royaltyPending: 3570, status: "Published & Live" }
  });
  const draftDuration = Date.now() - draftStartTime;

  console.log(`⏱️ Response Time: ${draftDuration}ms`);
  console.log(`🤖 Engine/Model: ${draftResult.model}`);
  console.log(`📄 Relevant KB:  ${draftResult.relevantKbTopic}`);
  console.log("\n[Generated Draft Preview]:");
  console.log("--------------------------------------------------");
  console.log(draftResult.content);
  console.log("--------------------------------------------------");

  console.log("\n✅ AI Test Complete!\n");
  process.exit(0);
}

runTest();
