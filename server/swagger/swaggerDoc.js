const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: "BookLeaf Publishing Author Support & Operations API",
    version: "1.0.0",
    description: "REST API for author query ticketing, book management, AI auto-classification, targeted response drafting, and real-time operations.",
    contact: {
      name: "BookLeaf Engineering Team",
      email: "engineering@bookleaf.com"
    }
  },
  servers: [
    {
      url: "http://localhost:5002",
      description: "Local Development Server"
    }
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Enter your JWT token obtained from /api/auth/login"
      }
    },
    schemas: {
      User: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          email: { type: "string" },
          role: { type: "string", enum: ["author", "admin"] },
          designation: { type: "string" },
          bankDetails: {
            type: "object",
            properties: {
              accountHolder: { type: "string" },
              accountNumber: { type: "string" },
              ifsc: { type: "string" },
              bankName: { type: "string" },
              verified: { type: "boolean" }
            }
          }
        }
      },
      Book: {
        type: "object",
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          isbn: { type: "string" },
          genre: { type: "string" },
          publicationDate: { type: "string", format: "date-time" },
          status: { type: "string", enum: ["Published", "In Production", "Under Review", "Archived"] },
          productionStage: { type: "string" },
          mrp: { type: "number" },
          copiesSold: { type: "number" },
          royaltyEarned: { type: "number" },
          royaltyPaid: { type: "number" },
          royaltyPending: { type: "number" },
          platforms: { type: "array", items: { type: "string" } }
        }
      },
      Ticket: {
        type: "object",
        properties: {
          id: { type: "string" },
          ticketNumber: { type: "string", example: "BL-1001" },
          subject: { type: "string" },
          description: { type: "string" },
          category: {
            type: "string",
            enum: [
              "Royalty & Payments",
              "ISBN & Metadata Issues",
              "Printing & Quality",
              "Distribution & Availability",
              "Book Status & Production Updates",
              "General Inquiry"
            ]
          },
          priority: { type: "string", enum: ["Critical", "High", "Medium", "Low"] },
          status: { type: "string", enum: ["Open", "In Progress", "Resolved", "Closed"] },
          author: { $ref: "#/components/schemas/User" },
          book: { $ref: "#/components/schemas/Book" },
          assignedTo: { $ref: "#/components/schemas/User" },
          aiClassification: {
            type: "object",
            properties: {
              suggestedCategory: { type: "string" },
              suggestedPriority: { type: "string" },
              confidence: { type: "number" },
              reasoning: { type: "string" }
            }
          },
          aiDraft: {
            type: "object",
            properties: {
              content: { type: "string" },
              relevantKbTopic: { type: "string" },
              model: { type: "string" }
            }
          },
          createdAt: { type: "string", format: "date-time" }
        }
      }
    }
  },
  paths: {
    "/api/auth/login": {
      post: {
        summary: "Author & Admin Login",
        tags: ["Authentication"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", example: "priya.sharma@example.com" },
                  password: { type: "string", example: "password123" }
                }
              }
            }
          }
        },
        responses: {
          200: { description: "Successful login, returns JWT token and user profile" },
          401: { description: "Invalid credentials" }
        }
      }
    },
    "/api/auth/me": {
      get: {
        summary: "Current authenticated session details",
        security: [{ BearerAuth: [] }],
        tags: ["Authentication"],
        responses: { 200: { description: "Current user profile" } }
      }
    },
    "/api/auth/demo-users": {
      get: {
        summary: "Quick test account list for evaluator convenience",
        tags: ["Authentication"],
        responses: { 200: { description: "List of authors and admins" } }
      }
    },
    "/api/books/my-books": {
      get: {
        summary: "Author catalog with sales and royalty breakdown",
        security: [{ BearerAuth: [] }],
        tags: ["Books (Author)"],
        responses: { 200: { description: "Author books with financial totals" } }
      }
    },
    "/api/tickets": {
      post: {
        summary: "Author submits support query (Triggers AI classification & response draft)",
        security: [{ BearerAuth: [] }],
        tags: ["Tickets (Author)"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["subject", "description"],
                properties: {
                  bookId: { type: "string", example: "6612ab..." },
                  subject: { type: "string", example: "Haven't received royalty for 4 months" },
                  description: { type: "string", example: "My dashboard shows ₹6,720 pending payout..." },
                  attachments: { type: "array", items: { type: "object" } }
                }
              }
            }
          }
        },
        responses: { 201: { description: "Ticket created and auto-classified" } }
      }
    },
    "/api/tickets/my-tickets": {
      get: {
        summary: "List author tickets",
        security: [{ BearerAuth: [] }],
        tags: ["Tickets (Author)"],
        parameters: [
          { name: "status", in: "query", schema: { type: "string" } }
        ],
        responses: { 200: { description: "List of author tickets" } }
      }
    },
    "/api/tickets/{id}": {
      get: {
        summary: "Get ticket conversation and details",
        security: [{ BearerAuth: [] }],
        tags: ["Tickets"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Ticket with messages timeline" } }
      }
    },
    "/api/tickets/{id}/messages": {
      post: {
        summary: "Post a message/reply in ticket conversation",
        security: [{ BearerAuth: [] }],
        tags: ["Tickets"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["content"],
                properties: {
                  content: { type: "string" }
                }
              }
            }
          }
        },
        responses: { 201: { description: "Message created and broadcast via WebSocket" } }
      }
    },
    "/api/admin/queue": {
      get: {
        summary: "Admin Ticket Queue with filters and sort",
        security: [{ BearerAuth: [] }],
        tags: ["Admin Operations"],
        parameters: [
          { name: "status", in: "query", schema: { type: "string" } },
          { name: "category", in: "query", schema: { type: "string" } },
          { name: "priority", in: "query", schema: { type: "string" } },
          { name: "assignedTo", in: "query", schema: { type: "string" } },
          { name: "search", in: "query", schema: { type: "string" } },
          { name: "sortBy", in: "query", schema: { type: "string", enum: ["oldest", "newest", "priority"] } }
        ],
        responses: { 200: { description: "Filtered and sorted queue tickets" } }
      }
    },
    "/api/admin/stats": {
      get: {
        summary: "Operations queue statistics ribbon",
        security: [{ BearerAuth: [] }],
        tags: ["Admin Operations"],
        responses: { 200: { description: "Summary numbers: open, critical, unassigned, resolved" } }
      }
    },
    "/api/admin/tickets/{id}/status": {
      patch: {
        summary: "Update ticket lifecycle status",
        security: [{ BearerAuth: [] }],
        tags: ["Admin Operations"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["status"],
                properties: {
                  status: { type: "string", enum: ["Open", "In Progress", "Resolved", "Closed"] }
                }
              }
            }
          }
        },
        responses: { 200: { description: "Status updated" } }
      }
    },
    "/api/admin/tickets/{id}/override": {
      patch: {
        summary: "Override AI classification category or priority",
        security: [{ BearerAuth: [] }],
        tags: ["Admin Operations"],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  category: { type: "string" },
                  priority: { type: "string" }
                }
              }
            }
          }
        },
        responses: { 200: { description: "Classification overridden" } }
      }
    },
    "/api/admin/tickets/{id}/assign": {
      patch: {
        summary: "Assign ticket to admin or unassign",
        security: [{ BearerAuth: [] }],
        tags: ["Admin Operations"],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  adminId: { type: "string", example: "me" }
                }
              }
            }
          }
        },
        responses: { 200: { description: "Assignee updated" } }
      }
    },
    "/api/admin/tickets/{id}/internal-notes": {
      post: {
        summary: "Add internal staff note (Never visible to authors)",
        security: [{ BearerAuth: [] }],
        tags: ["Admin Operations"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["content"],
                properties: {
                  content: { type: "string" }
                }
              }
            }
          }
        },
        responses: { 201: { description: "Internal note created" } }
      }
    },
    "/api/admin/tickets/{id}/regenerate-draft": {
      post: {
        summary: "Regenerate AI draft response using updated category/context",
        security: [{ BearerAuth: [] }],
        tags: ["Admin Operations"],
        responses: { 200: { description: "Fresh AI draft response" } }
      }
    },
    "/api/admin/tickets/{id}/send-reply": {
      post: {
        summary: "Send admin reply (edited AI draft) to author",
        security: [{ BearerAuth: [] }],
        tags: ["Admin Operations"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["content"],
                properties: {
                  content: { type: "string" }
                }
              }
            }
          }
        },
        responses: { 201: { description: "Reply dispatched to author view and broadcasted" } }
      }
    }
  }
};

module.exports = swaggerDocument;
