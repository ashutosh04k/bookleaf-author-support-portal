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
    const seedData = JSON.parse(rawData);

    // 1. Seed Users
    console.log(`[Seed] Seeding ${seedData.users.length} users...`);
    const userMap = new Map();

    for (const u of seedData.users) {
      const userDoc = new User({
        name: u.name,
        email: u.email.toLowerCase().trim(),
        password: u.password || "password123",
        role: u.role,
        designation: u.designation || (u.role === "admin" ? "Operations Specialist" : "Author"),
        bankDetails: u.bankDetails || {
          accountHolder: u.name,
          accountNumber: "",
          ifsc: "",
          bankName: "",
          verified: false
        }
      });
      await userDoc.save();
      userMap.set(u.email.toLowerCase().trim(), userDoc);
    }

    // 2. Seed Books
    console.log(`[Seed] Seeding ${seedData.books.length} books...`);
    const bookMap = new Map();

    for (const b of seedData.books) {
      const authorUser = userMap.get(b.authorEmail.toLowerCase().trim());
      if (!authorUser) {
        console.warn(`[Seed Warning] Author email ${b.authorEmail} not found for book: ${b.title}`);
        continue;
      }

      const bookDoc = await Book.create({
        title: b.title,
        author: authorUser._id,
        isbn: b.isbn,
        genre: b.genre || "General Fiction",
        publicationDate: b.publicationDate ? new Date(b.publicationDate) : null,
        status: b.status || "In Production",
        productionStage: b.productionStage || (b.status === "Published" ? "Published & Live" : "Manuscript Received"),
        mrp: b.mrp || 399,
        copiesSold: b.copiesSold || 0,
        royaltyEarned: b.royaltyEarned || 0,
        royaltyPaid: b.royaltyPaid || 0,
        royaltyPending: b.royaltyPending || 0,
        platforms: b.platforms || []
      });
      bookMap.set(b.title.trim().toLowerCase(), bookDoc);
    }

    // 3. Seed Tickets, Messages & Notes
    console.log(`[Seed] Seeding ${seedData.tickets.length} tickets with threads and notes...`);
    for (const t of seedData.tickets) {
      const authorUser = userMap.get(t.authorEmail.toLowerCase().trim());
      if (!authorUser) continue;

      let bookDoc = null;
      if (t.bookTitle) {
        bookDoc = bookMap.get(t.bookTitle.trim().toLowerCase());
      }

      let assignedAdminDoc = null;
      if (t.assignedToEmail) {
        assignedAdminDoc = userMap.get(t.assignedToEmail.toLowerCase().trim());
      }

      const ticketDoc = await Ticket.create({
        ticketNumber: t.ticketNumber,
        author: authorUser._id,
        book: bookDoc ? bookDoc._id : null,
        subject: t.subject,
        description: t.description,
        category: t.category,
        priority: t.priority,
        status: t.status,
        assignedTo: assignedAdminDoc ? assignedAdminDoc._id : null,
        createdAt: t.createdAt ? new Date(t.createdAt) : new Date(),
        aiClassification: {
          suggestedCategory: t.aiClassification?.suggestedCategory || t.category,
          suggestedPriority: t.aiClassification?.suggestedPriority || t.priority,
          confidence: t.aiClassification?.confidence || 0.95,
          reasoning: t.aiClassification?.reasoning || "Auto-classified via BookLeaf Knowledge-Base AI Model",
          processedAt: t.createdAt ? new Date(t.createdAt) : new Date()
        },
        aiDraft: {
          content: t.aiDraft?.content || "",
          relevantKbTopic: t.aiDraft?.relevantKbTopic || t.category,
          model: t.aiDraft?.model || "gpt-4o-mini",
          generatedAt: t.createdAt ? new Date(t.createdAt) : new Date()
        }
      });

      // Seed Messages
      if (Array.isArray(t.messages)) {
        for (const m of t.messages) {
          const senderUser = userMap.get(m.senderEmail.toLowerCase().trim());
          if (!senderUser) continue;

          await Message.create({
            ticket: ticketDoc._id,
            sender: senderUser._id,
            role: m.role,
            content: m.content,
            createdAt: m.createdAt ? new Date(m.createdAt) : new Date()
          });
        }
      }

      // Seed Internal Notes
      if (Array.isArray(t.internalNotes)) {
        for (const n of t.internalNotes) {
          const noteAuthor = userMap.get(n.authorEmail.toLowerCase().trim());
          if (!noteAuthor) continue;

          await InternalNote.create({
            ticket: ticketDoc._id,
            author: noteAuthor._id,
            content: n.content,
            createdAt: n.createdAt ? new Date(n.createdAt) : new Date()
          });
        }
      }
    }

    console.log("==================================================");
    console.log(" [Seed Complete] Database seeded successfully!");
    console.log(` - Users created:    ${userMap.size} (2 admins, 10 authors)`);
    console.log(` - Books created:    ${bookMap.size} (covering all edge cases)`);
    console.log(` - Tickets created:  ${seedData.tickets.length}`);
    console.log("==================================================");

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("[Seed Error]", error);
    process.exit(1);
  }
};

seed();
