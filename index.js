import express from "express";
import { Client } from "@notionhq/client";

const app = express();
app.use(express.json());

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

app.get("/", (req, res) => {
  res.json({
    name: "notion-mcp",
    status: "ok",
  });
});

app.post("/search", async (req, res) => {
  const { query } = req.body;

  const result = await notion.search({
    query,
  });

  res.json(result);
});

const port = process.env.PORT || 3333;
app.listen(port, () => {
  console.log(`Notion MCP listening on ${port}`);
});
