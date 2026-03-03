import type { OpenAPIV3 } from "openapi-types";

const spec: OpenAPIV3.Document = {
  openapi: "3.0.3",
  info: {
    title: "Domalingo API",
    version: "1.0.0",
    description:
      "REST API powering the Domalingo language-learning app. " +
      "All protected endpoints require a Firebase ID token in the `Authorization: Bearer <token>` header.",
    contact: { name: "Domalingo" },
  },
  servers: [{ url: "/api", description: "Current host" }],

  components: {
    securitySchemes: {
      FirebaseAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "Firebase ID Token",
        description:
          "Obtain via `firebase.auth().currentUser.getIdToken()` on the client.",
      },
    },
    schemas: {
      Language: {
        type: "object",
        properties: {
          code: { type: "string", example: "de" },
          name: { type: "string", example: "German" },
          flag: { type: "string", example: "🇩🇪" },
          active: { type: "boolean", example: true },
        },
        required: ["code", "name", "flag"],
      },
      LessonItem: {
        type: "object",
        properties: {
          id: { type: "string" },
          word: { type: "string", example: "das Fenster" },
          translation: { type: "string", example: "window" },
          article: { type: "string", example: "das" },
          imageUrl: { type: "string", nullable: true },
          unsplashQuery: { type: "string", nullable: true },
          example: { type: "string", nullable: true },
          exampleTranslation: { type: "string", nullable: true },
        },
        required: ["id", "word", "translation"],
      },
      Lesson: {
        type: "object",
        properties: {
          id: { type: "string", example: "de_room_living" },
          language: { type: "string", example: "de" },
          category: { type: "string", example: "room" },
          title: { type: "string", example: "Living Room" },
          description: { type: "string" },
          emoji: { type: "string", example: "🛋️" },
          items: {
            type: "array",
            items: { $ref: "#/components/schemas/LessonItem" },
          },
        },
        required: [
          "id",
          "language",
          "category",
          "title",
          "description",
          "emoji",
          "items",
        ],
      },
      LessonSummary: {
        type: "object",
        description: "Lesson without items array (for list endpoints)",
        properties: {
          id: { type: "string" },
          language: { type: "string" },
          category: { type: "string" },
          title: { type: "string" },
          description: { type: "string" },
          emoji: { type: "string" },
          itemCount: { type: "integer", example: 8 },
        },
        required: [
          "id",
          "language",
          "category",
          "title",
          "description",
          "emoji",
          "itemCount",
        ],
      },
      UserProfile: {
        type: "object",
        properties: {
          uid: { type: "string" },
          displayName: { type: "string" },
          email: { type: "string", format: "email" },
          photoURL: { type: "string" },
          targetLanguages: {
            type: "array",
            items: { type: "string" },
            example: ["de", "fr"],
          },
          activeLanguage: { type: "string", example: "de" },
          streakCount: { type: "integer", example: 7 },
          lastSessionDate: {
            type: "string",
            nullable: true,
            example: "2026-03-03",
          },
          totalXP: { type: "integer", example: 420 },
          createdAt: { type: "integer", example: 1741000000000 },
        },
        required: [
          "uid",
          "displayName",
          "email",
          "activeLanguage",
          "streakCount",
          "totalXP",
        ],
      },
      SRSCard: {
        type: "object",
        properties: {
          id: { type: "string", example: "de_room_living_fenster" },
          uid: { type: "string" },
          language: { type: "string" },
          lessonId: { type: "string" },
          itemId: { type: "string" },
          interval: { type: "integer", example: 6 },
          easeFactor: { type: "number", example: 2.5 },
          repetitions: { type: "integer", example: 2 },
          dueDate: { type: "string", example: "2026-03-09" },
          lastReviewed: {
            type: "string",
            nullable: true,
            example: "2026-03-03",
          },
        },
        required: [
          "id",
          "uid",
          "language",
          "lessonId",
          "itemId",
          "interval",
          "easeFactor",
          "repetitions",
          "dueDate",
        ],
      },
      Exercise: {
        type: "object",
        properties: {
          type: { type: "string", enum: ["mcq", "fill", "image"] },
          item: { $ref: "#/components/schemas/LessonItem" },
          lesson: { $ref: "#/components/schemas/Lesson" },
          card: { $ref: "#/components/schemas/SRSCard" },
          distractors: {
            type: "array",
            items: { $ref: "#/components/schemas/LessonItem" },
            description: "3 wrong-answer options (only for type=mcq)",
          },
        },
        required: ["type", "item", "lesson", "card"],
      },
      SessionResult: {
        type: "object",
        properties: {
          cardId: { type: "string" },
          quality: {
            type: "integer",
            minimum: 0,
            maximum: 3,
            description: "0=again 1=hard 2=good 3=easy",
          },
          answeredAt: { type: "integer", description: "epoch ms" },
        },
        required: ["cardId", "quality", "answeredAt"],
      },
      Error: {
        type: "object",
        properties: { error: { type: "string" } },
        required: ["error"],
      },
    },
  },

  security: [{ FirebaseAuth: [] }],

  paths: {
    // ── Languages ──────────────────────────────────────────────
    "/languages": {
      get: {
        operationId: "listLanguages",
        tags: ["Languages"],
        summary: "List all supported languages",
        security: [],
        responses: {
          200: {
            description: "Array of supported languages",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Language" },
                },
              },
            },
          },
        },
      },
    },

    // ── Lessons ────────────────────────────────────────────────
    "/lessons": {
      get: {
        operationId: "listLessons",
        tags: ["Lessons"],
        summary: "List all lessons for a language (without items)",
        security: [],
        parameters: [
          {
            name: "language",
            in: "query",
            required: true,
            schema: { type: "string", example: "de" },
            description: "ISO language code",
          },
        ],
        responses: {
          200: {
            description: "Array of lesson summaries",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/LessonSummary" },
                },
              },
            },
          },
          400: {
            description: "Missing language param",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },

    "/lessons/{id}": {
      get: {
        operationId: "getLesson",
        tags: ["Lessons"],
        summary: "Get a single lesson with all its items",
        security: [],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "Lesson ID",
          },
        ],
        responses: {
          200: {
            description: "Full lesson object",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Lesson" },
              },
            },
          },
          404: {
            description: "Lesson not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },

    // ── Session ────────────────────────────────────────────────
    "/session": {
      get: {
        operationId: "getSession",
        tags: ["Session"],
        summary: "Get today's due exercises for the authenticated user",
        parameters: [
          {
            name: "language",
            in: "query",
            required: true,
            schema: { type: "string", example: "de" },
          },
          {
            name: "limit",
            in: "query",
            required: false,
            schema: { type: "integer", default: 20, maximum: 50 },
            description: "Max number of exercises to return",
          },
        ],
        responses: {
          200: {
            description: "List of exercises for the session",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    exercises: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Exercise" },
                    },
                    totalDue: { type: "integer" },
                  },
                },
              },
            },
          },
          401: {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
      post: {
        operationId: "saveSession",
        tags: ["Session"],
        summary: "Submit session results and update SRS cards",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  language: { type: "string", example: "de" },
                  results: {
                    type: "array",
                    items: { $ref: "#/components/schemas/SessionResult" },
                  },
                },
                required: ["language", "results"],
              },
            },
          },
        },
        responses: {
          200: {
            description: "Session saved, returns updated XP and streak",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    xpGained: { type: "integer" },
                    newStreak: { type: "integer" },
                    totalXP: { type: "integer" },
                    cardsUpdated: { type: "integer" },
                  },
                },
              },
            },
          },
          401: {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },

    // ── Profile ────────────────────────────────────────────────
    "/profile": {
      get: {
        operationId: "getProfile",
        tags: ["Profile"],
        summary: "Get the authenticated user's profile",
        responses: {
          200: {
            description: "User profile",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UserProfile" },
              },
            },
          },
          401: {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          404: {
            description: "Profile not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
      put: {
        operationId: "updateProfile",
        tags: ["Profile"],
        summary: "Update mutable profile fields",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  activeLanguage: { type: "string", example: "fr" },
                  targetLanguages: { type: "array", items: { type: "string" } },
                  displayName: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Updated profile",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UserProfile" },
              },
            },
          },
          401: {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },

    // ── Cards ──────────────────────────────────────────────────
    "/cards": {
      get: {
        operationId: "listCards",
        tags: ["Cards"],
        summary:
          "Get all SRS cards for the user (optionally filtered by language)",
        parameters: [
          {
            name: "language",
            in: "query",
            required: false,
            schema: { type: "string", example: "de" },
          },
          {
            name: "dueOnly",
            in: "query",
            required: false,
            schema: { type: "boolean", default: false },
            description: "If true, return only cards due today or overdue",
          },
        ],
        responses: {
          200: {
            description: "Array of SRS cards",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/SRSCard" },
                },
              },
            },
          },
          401: {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
  },
};

export default spec;
