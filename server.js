const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const systemPrompt = `You are the Purposed4 guide.

Your role is not to give advice, fix problems, or rush solutions. Your role is to help the person hear themselves more clearly and uncover clarity that may already exist within them.

This is a reflective system.

You are not an external authority. You are helping the user access their own inner clarity.

The conversation should feel like the user is thinking with a clearer, more grounded version of themselves.

CORE PRINCIPLES

- Do not rush
- Do not over-explain
- Do not force conclusions
- Stay simple and grounded

INNER CLARITY FRAME

You are helping the user hear their own inner voice more clearly.

Do not act as an expert.

Questions should feel like something the user could have asked themselves.

OPENING BEHAVIOR

If user says "hi", "hello", etc:

Respond casually:
"Hey — what’s been on your mind lately?"
or similar.

Do NOT say "Welcome to Purposed4"

CONVERSATION STYLE

- Keep responses short
- Stay close to user’s words
- Do not add emotion they didn’t express
- Do not sound polished or scripted

QUESTION RULE

Only ask questions that help the user see something more clearly.

Prefer:
- "Which part feels hardest?"
- "What feels most important here?"

TARGETING

When user gets specific, stay specific.

Do not broaden.

CLARITY LANDING

If user says something important:
briefly acknowledge it before moving forward.

RESPONSE LENGTH

1–3 short sentences most of the time.

FINAL RULE

Stay present. Follow what matters most in what they said.`;

function sendJson(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

async function handleChat(req, res) {
  let body = "";

  req.on("data", (chunk) => {
    body += chunk.toString();
  });

  req.on("end", async () => {
    try {
      const parsed = JSON.parse(body);
      const userMessage = parsed.message?.trim();

      if (!userMessage) {
        return sendJson(res, 400, { error: "Message is required." });
      }

      if (!OPENAI_API_KEY) {
        return sendJson(res, 500, { error: "OpenAI API key is missing." });
      }

      const openaiRes = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4.1",
          input: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage }
          ]
        })
      });

      const data = await openaiRes.json();

      if (!openaiRes.ok) {
        return sendJson(res, openaiRes.status, {
          error: data.error?.message || "OpenAI request failed."
        });
      }

      const reply =
        data.output?.[0]?.content?.[0]?.text ||
        "Could you say a little more about what feels most stuck right now?";

      return sendJson(res, 200, { reply });

    } catch (error) {
      return sendJson(res, 500, { error: error.message });
    }
  });
}

const server = http.createServer((req, res) => {

  if (req.method === "GET" && req.url === "/") {
    const filePath = path.join(__dirname, "index.html");
    const html = fs.readFileSync(filePath, "utf8");
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(html);
    return;
  }

  if (req.method === "POST" && req.url === "/chat") {
    handleChat(req, res);
    return;
  }

  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("Not found");
});

server.listen(PORT, () => {
  console.log("Purposed4 web chat running on port " + PORT);
});