const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "../.env") });

const User = require("../models/User");
const Book = require("../models/Book");
const Ticket = require("../models/Ticket");
const Message = require("../models/Message");
const InternalNote = require("../models/InternalNote");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/bookleaf_db";

const ADMIN_USERS = [
  {
    name: "Rohan Mehra",
    email: "admin@bookleaf.com",
    password: "password123",
    role: "admin",
    designation: "Senior Publishing Operations Lead"
  },
  {
    name: "Aditi Roy",
    email: "ops@bookleaf.com",
    password: "password123",
    role: "admin",
    designation: "Author Success Specialist"
  }
];

const seed = async () => {
  try {
    console.log(`[Seed] Connecting to MongoDB: ${MONGODB_URI}`);
    await mongoose.connect(MONGODB_URI);
    console.log("[Seed] Connected successfully. Clearing previous collections...");

    await Promise.all([
      User.deleteMany({}),
      Book.deleteMany({}),
      Ticket.deleteMany({}),
      Message.deleteMany({}),
      InternalNote.deleteMany({})
    ]);

    const dataPath = path.join(__dirname, "bookleaf_sample_data.json");
    const rawData = fs.readFileSync(dataPath, "utf-8");
    const sampleData = JSON.parse(rawData);

    const userMap = new Map();
    const bookMap = new Map();

    // 1. Seed Admin Users
    console.log(`[Seed] Seeding ${ADMIN_USERS.length} admin accounts...`);
    for (const adm of ADMIN_USERS) {
      const adminDoc = new User({
        name: adm.name,
        email: adm.email.toLowerCase().trim(),
        password: adm.password,
        role: adm.role,
        designation: adm.designation,
        bankDetails: {
          accountHolder: adm.name,
          accountNumber: "",
          ifsc: "",
          bankName: "",
          verified: false
        }
      });
      await adminDoc.save();
      userMap.set(adm.email.toLowerCase().trim(), adminDoc);
    }

    // 2. Seed Authors and their Books from bookleaf_sample_data.json
    console.log(`[Seed] Seeding ${sampleData.authors.length} authors and their respective books...`);
    for (const authorData of sampleData.authors) {
      const authorEmail = authorData.email.toLowerCase().trim();

      const authorDoc = new User({
        authorId: authorData.author_id,
        name: authorData.name,
        email: authorEmail,
        password: "password123",
        role: "author",
        phone: authorData.phone || "",
        city: authorData.city || "",
        joinedDate: authorData.joined_date ? new Date(authorData.joined_date) : new Date(),
        designation: "Author",
        bankDetails: {
          accountHolder: authorData.name,
          accountNumber: `9182${Math.floor(10000000 + Math.random() * 90000000)}`,
          ifsc: "HDFC0001245",
          bankName: "HDFC Bank",
          verified: true
        }
      });
      await authorDoc.save();
      userMap.set(authorEmail, authorDoc);

      // Seed books for this author
      if (Array.isArray(authorData.books)) {
        for (const b of authorData.books) {
          const isPublished = (b.status || "").toLowerCase().includes("published");
          let productionStage = "Published & Live";
          if (!isPublished) {
            if ((b.status || "").toLowerCase().includes("cover")) productionStage = "Cover Design";
            else if ((b.status || "").toLowerCase().includes("typesetting")) productionStage = "Typesetting";
            else productionStage = "Editing";
          }

          const bookDoc = await Book.create({
            bookId: b.book_id,
            title: b.title,
            author: authorDoc._id,
            isbn: b.isbn,
            genre: b.genre || "General Fiction",
            publicationDate: b.publication_date ? new Date(b.publication_date) : null,
            status: b.status || "Published & Live",
            productionStage,
            mrp: b.mrp || 0,
            authorRoyaltyPerCopy: b.author_royalty_per_copy || 0,
            copiesSold: b.total_copies_sold || 0,
            royaltyEarned: b.total_royalty_earned || 0,
            royaltyPaid: b.royalty_paid || 0,
            royaltyPending: b.royalty_pending || 0,
            lastRoyaltyPayoutDate: b.last_royalty_payout_date ? new Date(b.last_royalty_payout_date) : null,
            printPartner: b.print_partner || "In-House",
            platforms: b.available_on || []
          });

          bookMap.set(b.book_id, bookDoc);
          bookMap.set(b.title.trim().toLowerCase(), bookDoc);
        }
      }
    }

    // 3. Seed Realistic Support Tickets Covering Expected Edge Cases
    console.log("[Seed] Seeding sample tickets, message threads, and internal staff notes...");

    const adminRohan = userMap.get("admin@bookleaf.com");
    const adminAditi = userMap.get("ops@bookleaf.com");

    const SEED_TICKETS = [
      {
        ticketNumber: "BL-1001",
        authorEmail: "priya.sharma@email.com",
        bookIdKey: "BK001",
        subject: "Haven't received royalty payout for the last 4 months",
        description: "Hello team, my book 'Whispers of the Ganges' has been selling steadily, but I have not received any royalty deposit in my bank account for over 4 months now. As per my dashboard, ₹3,570 is showing as pending. Could you please check when this will be credited?",
        category: "Royalty & Payments",
        priority: "Critical",
        status: "In Progress",
        assignedTo: adminAditi._id,
        createdAt: new Date("2026-10-21T09:30:00Z"),
        aiClassification: {
          suggestedCategory: "Royalty & Payments",
          suggestedPriority: "Critical",
          confidence: 0.96,
          reasoning: "Author is inquiring about overdue royalty exceeding 4 months with ₹3,570 pending payout."
        },
        aiDraft: {
          content: "Dear Priya,\n\nThank you for reaching out to us, and congratulations on the steady readership for 'Whispers of the Ganges'.\n\nI understand your concern regarding the pending royalty of ₹3,570. At BookLeaf, royalties are calculated on a quarterly cycle and disbursed within 45 days following the quarter's close. Since your pending balance exceeds our ₹1,000 minimum threshold, this payment is actively scheduled in our current payout cycle.\n\nI have verified your linked bank details (HDFC Bank ending in 1245) and escalated this to our finance desk to expedite the NEFT transfer within 48 hours. You will receive an email notification with the UTR number as soon as it clears.\n\nWarm regards,\nOperations Team, BookLeaf Publishing",
          relevantKbTopic: "Royalties & Payments",
          model: "gpt-4o-mini"
        },
        messages: [
          {
            senderEmail: "priya.sharma@email.com",
            role: "author",
            content: "Hello team, my book 'Whispers of the Ganges' has been selling steadily, but I have not received any royalty deposit in my bank account for over 4 months now. As per my dashboard, ₹3,570 is showing as pending. Could you please check when this will be credited?",
            createdAt: new Date("2026-10-21T09:30:00Z")
          },
          {
            senderEmail: "ops@bookleaf.com",
            role: "admin",
            content: "Dear Priya, thank you for reaching out. I am currently coordinating with our finance accounts team to trace the Q2 batch run for your HDFC account. I will share the exact transaction reference within 24 hours.",
            createdAt: new Date("2026-10-21T11:15:00Z")
          }
        ],
        internalNotes: [
          {
            authorEmail: "ops@bookleaf.com",
            content: "Checked batch #Q2-IND-44. Payout file had a temporary IFSC routing flag. Resubmitted to corporate banking gateway.",
            createdAt: new Date("2026-10-21T11:20:00Z")
          }
        ]
      },
      {
        ticketNumber: "BL-1002",
        authorEmail: "rohit.kapoor@email.com",
        bookIdKey: "BK003",
        subject: "Royalty calculation seems lower than expected for Amazon sales",
        description: "Hi, I checked my Q2 sales report for 'Code & Karma'. 876 copies were sold at MRP ₹350. The royalty earned is showing as ₹26,280, which comes out to roughly ₹30 per book. Shouldn't my royalty be 80%? Please clarify how this net amount is calculated.",
        category: "Royalty & Payments",
        priority: "Medium",
        status: "Open",
        assignedTo: null,
        createdAt: new Date("2026-10-23T14:10:00Z"),
        aiClassification: {
          suggestedCategory: "Royalty & Payments",
          suggestedPriority: "Medium",
          confidence: 0.94,
          reasoning: "Author is requesting clarification on royalty percentage formula and net profit breakdown."
        },
        aiDraft: {
          content: "Dear Rohit,\n\nThank you for reaching out, and congratulations on the tremendous success of 'Code & Karma' with 876 copies sold!\n\nI completely understand how the 80% split might seem confusing at first glance. Under BookLeaf's author agreement, the 80% royalty split applies to the net profit per book rather than the gross MRP. Net profit is calculated as:\n\nNet Profit = MRP (₹350) - Printing Cost (₹140) - Marketplace Commission & Delivery (approx. ₹172.50 for Amazon)\n\nThis leaves a net profit margin of ₹37.50 per copy, of which 80% (₹30 per book) is credited directly to you. We believe in total transparency, and I would be delighted to provide you with a comprehensive line-by-line breakdown for every platform channel.\n\nPlease let me know if you would like me to generate that detailed ledger for your dashboard.\n\nWarm regards,\nAuthor Success Team, BookLeaf Publishing",
          relevantKbTopic: "Royalties & Payments",
          model: "gpt-4o-mini"
        },
        messages: [
          {
            senderEmail: "rohit.kapoor@email.com",
            role: "author",
            content: "Hi, I checked my Q2 sales report for 'Code & Karma'. 876 copies were sold at MRP ₹350. The royalty earned is showing as ₹26,280, which comes out to roughly ₹30 per book. Shouldn't my royalty be 80%? Please clarify how this net amount is calculated.",
            createdAt: new Date("2026-10-23T14:10:00Z")
          }
        ],
        internalNotes: []
      },
      {
        ticketNumber: "BL-1003",
        authorEmail: "sneha.kulkarni@email.com",
        bookIdKey: "BK011",
        subject: "ISBN mismatch on Amazon listing - wrong page count and edition",
        description: "URGENT: Readers are reporting that on Amazon India, searching for my ISBN 978-93-5XXXX-11-0 pulls up an old subtitle and 180 pages instead of the final 260-page edition. This is impacting launch week sales. Please fix urgently.",
        category: "ISBN & Metadata Issues",
        priority: "Critical",
        status: "In Progress",
        assignedTo: adminRohan._id,
        createdAt: new Date("2026-10-24T08:15:00Z"),
        aiClassification: {
          suggestedCategory: "ISBN & Metadata Issues",
          suggestedPriority: "Critical",
          confidence: 0.98,
          reasoning: "ISBN metadata mismatch directly on live retailer listing during active sales period. High severity."
        },
        aiDraft: {
          content: "Dear Sneha,\n\nThank you for alerting us immediately, and I sincerely apologize for the distress this metadata discrepancy has caused during your launch period.\n\nBecause ISBN integrity is paramount, I have escalated this as a high-priority ticket directly to our senior production and cataloging team. We have identified the feed discrepancy and are re-pushing the verified ONIX metadata file with the correct 260-page count and subtitle to Amazon India today.\n\nRetailer feeds take 24 to 48 hours to fully sync across regional nodes. I am personally monitoring this ticket and will confirm once the live page reflects the accurate specifications.\n\nWarm regards,\nPublishing Operations, BookLeaf Publishing",
          relevantKbTopic: "ISBN & Metadata Issues",
          model: "gpt-4o-mini"
        },
        messages: [
          {
            senderEmail: "sneha.kulkarni@email.com",
            role: "author",
            content: "URGENT: Readers are reporting that on Amazon India, searching for my ISBN 978-93-5XXXX-11-0 pulls up an old subtitle and 180 pages instead of the final 260-page edition. This is impacting launch week sales. Please fix urgently.",
            createdAt: new Date("2026-10-24T08:15:00Z")
          }
        ],
        internalNotes: [
          {
            authorEmail: "admin@bookleaf.com",
            content: "Catalog team notified. ONIX XML version 3.0 re-submitted via Amazon Vendor Central ticket #IN-902184.",
            createdAt: new Date("2026-10-24T09:00:00Z")
          }
        ]
      },
      {
        ticketNumber: "BL-1004",
        authorEmail: "vikram.joshi@email.com",
        bookIdKey: "BK006",
        subject: "Author copies received with defective spine binding",
        description: "I received my batch of 10 author copies of 'Debugging Life' today from the Delhi warehouse. On 4 of the copies, the glue along the spine is cracking and the middle pages are loose. The cover matte finish is also scratched. This is disappointing print quality.",
        category: "Printing & Quality",
        priority: "High",
        status: "Open",
        assignedTo: null,
        createdAt: new Date("2026-10-24T16:20:00Z"),
        aiClassification: {
          suggestedCategory: "Printing & Quality",
          suggestedPriority: "High",
          confidence: 0.95,
          reasoning: "Author received defective print copies with spine binding issues and cover scratches from print partner."
        },
        aiDraft: {
          content: "Dear Vikram,\n\nI am truly sorry to hear that your author copies of 'Debugging Life' arrived with binding defects and scratches. This falls well short of the standards we expect from our Delhi printing facility.\n\nBookLeaf guarantees a free replacement reprint for any manufacturing or binding defect. To initiate the expedited replacement with our plant supervisor, could you please reply with 2-3 quick photos showing the cracked spine and defective covers?\n\nAs soon as we log the photos, we will initiate a fresh print run and dispatch replacement copies to your address within 5 to 7 business days at zero cost to you.\n\nWarm regards,\nQuality & Production Team, BookLeaf Publishing",
          relevantKbTopic: "Printing & Quality",
          model: "gpt-4o-mini"
        },
        messages: [
          {
            senderEmail: "vikram.joshi@email.com",
            role: "author",
            content: "I received my batch of 10 author copies of 'Debugging Life' today from the Delhi warehouse. On 4 of the copies, the glue along the spine is cracking and the middle pages are loose. The cover matte finish is also scratched. This is disappointing print quality.",
            createdAt: new Date("2026-10-24T16:20:00Z")
          }
        ],
        internalNotes: []
      },
      {
        ticketNumber: "BL-1005",
        authorEmail: "meera.nair@email.com",
        bookIdKey: "BK008",
        subject: "Book showing 'Currently Unavailable' on Amazon India",
        description: "My book 'Cardamom & Chaos' was featured in a weekend blog today, but readers are telling me that Amazon India is showing 'Currently Unavailable'. We are losing sales every hour. Can you please replenish stock?",
        category: "Distribution & Availability",
        priority: "High",
        status: "In Progress",
        assignedTo: adminAditi._id,
        createdAt: new Date("2026-10-25T10:05:00Z"),
        aiClassification: {
          suggestedCategory: "Distribution & Availability",
          suggestedPriority: "High",
          confidence: 0.92,
          reasoning: "High-demand book displaying unavailable on primary sales channel due to inventory sync delay."
        },
        aiDraft: {
          content: "Dear Meera,\n\nThank you for flagging this, and congratulations on the feature! It is wonderful to see 'Cardamom & Chaos' gaining such traction.\n\nPlease rest assured that your book is not out of print. Under our Print-on-Demand distribution model, the 'Currently Unavailable' status on Amazon India typically indicates a stock sync lag between Amazon's automated ordering system and our Delhi warehouse inventory feed.\n\nOur distribution desk has just manually triggered an inventory re-sync with Amazon's marketplace operations. These re-sync updates reflect on the live product page within 24 to 48 hours. In the interim, copies are immediately available for order on the BookLeaf Store.\n\nI will monitor the Amazon product page and confirm back with you once the 'Buy Now' button is active again.\n\nWarm regards,\nDistribution Operations, BookLeaf Publishing",
          relevantKbTopic: "Distribution & Availability",
          model: "gpt-4o-mini"
        },
        messages: [
          {
            senderEmail: "meera.nair@email.com",
            role: "author",
            content: "My book 'Cardamom & Chaos' was featured in a weekend blog today, but readers are telling me that Amazon India is showing 'Currently Unavailable'. We are losing sales every hour. Can you please replenish stock?",
            createdAt: new Date("2026-10-25T10:05:00Z")
          }
        ],
        internalNotes: [
          {
            authorEmail: "ops@bookleaf.com",
            content: "Sent API re-sync ping to Amazon Seller central at 10:20 AM. Next warehouse batch pickup is at 4 PM.",
            createdAt: new Date("2026-10-25T10:22:00Z")
          }
        ]
      },
      {
        ticketNumber: "BL-1006",
        authorEmail: "kavita.deshmukh@email.com",
        bookIdKey: "BK015",
        subject: "Production status has been stuck on Typesetting for 3 weeks",
        description: "My manuscript 'Raising Roots' was approved for typesetting on October 2nd. The dashboard still shows 'Typesetting' with no progress notes or draft preview. Could you provide a realistic timeline on when I will see the proof PDF?",
        category: "Book Status & Production Updates",
        priority: "Medium",
        status: "Open",
        assignedTo: null,
        createdAt: new Date("2026-10-25T12:45:00Z"),
        aiClassification: {
          suggestedCategory: "Book Status & Production Updates",
          suggestedPriority: "Medium",
          confidence: 0.95,
          reasoning: "Author inquiring on production milestone delay during typesetting stage."
        },
        aiDraft: {
          content: "Dear Kavita,\n\nThank you for reaching out, and thank you for your patience as we prepare 'Raising Roots' for publication.\n\nI checked directly with our typesetting team. Your manuscript contains custom infographics and parenting tables, which required special layout formatting to ensure high-resolution print reproduction. This extra care extended the typesetting process by a few days.\n\nThe typeset interior layout is now in final review. You will receive the comprehensive proof PDF via your author dashboard within 3 business days. Once you review and approve the proof, we will proceed directly to ISBN assignment and test printing.\n\nThank you for working with us to make this book exceptional.\n\nWarm regards,\nProduction Team, BookLeaf Publishing",
          relevantKbTopic: "Book Status & Production Updates",
          model: "gpt-4o-mini"
        },
        messages: [
          {
            senderEmail: "kavita.deshmukh@email.com",
            role: "author",
            content: "My manuscript 'Raising Roots' was approved for typesetting on October 2nd. The dashboard still shows 'Typesetting' with no progress notes or draft preview. Could you provide a realistic timeline on when I will see the proof PDF?",
            createdAt: new Date("2026-10-25T12:45:00Z")
          }
        ],
        internalNotes: []
      },
      {
        ticketNumber: "BL-1007",
        authorEmail: "diya.chatterjee@email.com",
        bookIdKey: "BK017",
        subject: "Need to update book description and author bio on Amazon",
        description: "Hello, I won a literary award last week! I would like to update the Amazon blurb and my author bio on the Amazon and Flipkart product pages for 'Durga’s Daughters'. Where can I submit the updated text?",
        category: "ISBN & Metadata Issues",
        priority: "Low",
        status: "Resolved",
        assignedTo: adminAditi._id,
        createdAt: new Date("2026-10-18T11:00:00Z"),
        aiClassification: {
          suggestedCategory: "ISBN & Metadata Issues",
          suggestedPriority: "Low",
          confidence: 0.91,
          reasoning: "Standard blurb and author bio metadata update on retail platforms."
        },
        aiDraft: {
          content: "Dear Diya,\n\nCongratulations on the wonderful literary recognition! We are thrilled for you and proud to have 'Durga’s Daughters' in our catalog.\n\nYou can submit your revised blurb and updated author bio by replying directly to this ticket. Once we receive your revised text, our catalog team will submit the updated metadata to Amazon India and Flipkart.\n\nPlease note that retail platforms take 3 to 5 business days to index and reflect metadata revisions on live customer pages.\n\nWe look forward to receiving your new text!\n\nWarm regards,\nAuthor Success Team, BookLeaf Publishing",
          relevantKbTopic: "ISBN & Metadata Issues",
          model: "gpt-4o-mini"
        },
        messages: [
          {
            senderEmail: "diya.chatterjee@email.com",
            role: "author",
            content: "Hello, I won a literary award last week! I would like to update the Amazon blurb and my author bio on the Amazon and Flipkart product pages for 'Durga’s Daughters'. Where can I submit the updated text?",
            createdAt: new Date("2026-10-18T11:00:00Z")
          },
          {
            senderEmail: "ops@bookleaf.com",
            role: "admin",
            content: "Dear Diya, congratulations on the award! Please reply with the new blurb text here and we will push it to Amazon and Flipkart right away.",
            createdAt: new Date("2026-10-18T13:30:00Z")
          },
          {
            senderEmail: "diya.chatterjee@email.com",
            role: "author",
            content: "Thank you! Here is the revised blurb: 'Winner of the 2024 Kolkata Literature Award, Durga’s Daughters weaves an unforgettable tale...'",
            createdAt: new Date("2026-10-18T14:15:00Z")
          },
          {
            senderEmail: "ops@bookleaf.com",
            role: "admin",
            content: "All updated on Amazon Vendor Central and Flipkart portal! Changes are now live.",
            createdAt: new Date("2026-10-19T10:00:00Z")
          }
        ],
        internalNotes: [
          {
            authorEmail: "ops@bookleaf.com",
            content: "Updated blurb on Amazon feed. Verified live page on Oct 19.",
            createdAt: new Date("2026-10-19T10:05:00Z")
          }
        ]
      }
    ];

    for (const t of SEED_TICKETS) {
      const authorUser = userMap.get(t.authorEmail.toLowerCase().trim());
      if (!authorUser) continue;

      const bookDoc = bookMap.get(t.bookIdKey);

      const ticketDoc = await Ticket.create({
        ticketNumber: t.ticketNumber,
        author: authorUser._id,
        book: bookDoc ? bookDoc._id : null,
        subject: t.subject,
        description: t.description,
        category: t.category,
        priority: t.priority,
        status: t.status,
        assignedTo: t.assignedTo,
        createdAt: t.createdAt,
        aiClassification: {
          suggestedCategory: t.aiClassification.suggestedCategory,
          suggestedPriority: t.aiClassification.suggestedPriority,
          confidence: t.aiClassification.confidence,
          reasoning: t.aiClassification.reasoning,
          processedAt: t.createdAt
        },
        aiDraft: {
          content: t.aiDraft.content,
          relevantKbTopic: t.aiDraft.relevantKbTopic,
          model: t.aiDraft.model,
          generatedAt: t.createdAt
        }
      });

      // Seed messages
      for (const m of t.messages) {
        const sender = userMap.get(m.senderEmail.toLowerCase().trim());
        if (!sender) continue;

        await Message.create({
          ticket: ticketDoc._id,
          sender: sender._id,
          role: m.role,
          content: m.content,
          createdAt: m.createdAt
        });
      }

      // Seed internal notes
      for (const n of t.internalNotes) {
        const noteAuthor = userMap.get(n.authorEmail.toLowerCase().trim());
        if (!noteAuthor) continue;

        await InternalNote.create({
          ticket: ticketDoc._id,
          author: noteAuthor._id,
          content: n.content,
          createdAt: n.createdAt
        });
      }
    }

    console.log("==================================================");
    console.log(" [Seed Complete] Database seeded with official BookLeaf sample dataset!");
    console.log(` - Users created:    ${userMap.size} (2 admins, 10 authors)`);
    console.log(` - Books created:    ${bookMap.size / 2} (18 books total)`);
    console.log(` - Tickets created:  ${SEED_TICKETS.length}`);
    console.log("==================================================");

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("[Seed Error]", error);
    process.exit(1);
  }
};

seed();
