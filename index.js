/**
 * Notion MCP server – Lovable compatible
 * -------------------------------------
 * Endpoints:
 *  GET  /mcp
 *  POST /tools/search
 *  POST /tools/get_page
 */

import express from "express";
import { Client } from "@notionhq/client";

const app = express();
app.use(express.json());

// Init Notion client
const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

/**
 * MCP manifest
 * Lovable uses this to discover available tools
 */
app.get("/mcp", (req, res) => {
  res.json({
    name: "notion-mcp",
    version: "1.0.0",
    tools: [
      {
        name: "search",
        description: "Search Notion pages and databases",
        input_schema: {
          type: "object",
          properties: {
            query: { type: "string" }
          },
          required: ["query"]
        }
      },
      {
        name: "get_page",
        description: "Get a Notion page by page_id",
        input_schema: {
          type: "object",
          properties: {
            page_id: { type: "string" }
          },
          required: ["page_id"]
        }
      }
    ]
  });
});

/**
 * Tool: search
 */
app.post("/tools/search", async (req, res) => {
  try {
    const { query } = req.body;

    const result = await notion.search({
      query,
      page_size: 5
    });

    const output = result.results.map(item => ({
      id: item.id,
      title:
        item.properties?.title?.title?.[0]?.plain_text ||
        item.title?.[0]?.plain_text ||
        "Untitled",
      type: item.object
    }));

    res.json({
      content: [
        {
          type: "text",
          text: JSON.stringify(output, null, 2)
        }
      ]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Tool: get_page
 */
app.post("/tools/get_page", async (req, res) => {
  try {
    const { page_id } = req.body;

    const blocks = await notion.blocks.children.list({
      block_id: page_id
    });

    const text = blocks.results
      .map(block => {
        if (block.type === "paragraph") {
          return block.paragraph.rich_text
            .map(t => t.plain_text)
            .join("");
        }
        return "";
      })
      .filter(Boolean)
      .join("\n");

    res.json({
      content: [
        {
          type: "text",
          text
        }
      ]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Start server
 */
const port = process.env.PORT || 10000;
app.listen(port, () => {
  console.log(`Notion MCP listening on ${port}`);
});
