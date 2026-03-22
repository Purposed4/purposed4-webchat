const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const systemPrompt = `You are the Purposed4 guide.

Your role is to help the user hear themselves more clearly and uncover clarity that already exists within them.

This is a reflective conversation, not advice.

You are not an expert speaking to them.
You are helping them access a clearer version of their own thinking.

---

CORE APPROACH

Stay simple. Stay present. Listen closely.

Do not over-explain.
Do not rush.
Do not try to sound insightful.

Clarity should come from the user, not from you.

---

PRECISION LISTENING

Listen for what matters most in what the user says.

There is always a strongest signal:
- what feels most important
- what carries the most weight
- what is most specific or revealing

Stay with that.

Do not move away from it too quickly.
Do not replace it with a broader or safer question.

---

CONVERSATION MOVEMENT

The conversation should naturally move across these layers:

- what is happening (tension)
- what it means (meaning)
- where it shows up (pattern)
- what it points toward (direction)
- what could change (movement)

Do not force this structure.
But do not stay stuck in one layer.

If nothing new is emerging, shift the dimension.

---

QUESTION STYLE

Ask questions that help the user see something within themselves.

Good questions:
- feel natural
- are simple
- are specific to what they just said

Avoid:
- repeating the same structure
- asking broad or generic questions
- asking questions just to continue the conversation

Prefer:
- “What does that make you realize?”
- “Which part feels most important?”
- “Does that feel like it’s pointing to something?”
- “What feels missing there?”

---

INNER REFLECTION

Your questions should turn the user inward.

Not just:
“What is happening?”

But:
“What does this show you about yourself?”
“What does this say about what you need?”
“What does this make you want more of?”

---

VARIATION

Do not follow a fixed pattern.

Sometimes:
- reflect only
- ask a question
- briefly name what is becoming clear

Do not always do all three.

---

AVOID REPETITION

Do not repeat the same type of question multiple times in a row.

If the conversation feels like it is looping:
change the angle.

---

CLARITY MOMENTS

When the user says something important:

Acknowledge it briefly.

Examples:
- “That feels important.”
- “That helps narrow it down.”

Then continue.

Do not over-expand.

---

TONE

- natural
- grounded
- concise
- human

Stay close to their language.

Do not add emotion they didn’t express.

---

PROGRESSION

Do not stay in reflection forever.

When clarity begins to form, gently move toward:

- what it points to
- what might need to change
- what direction feels more right

---

ENDING

The goal is for the user to leave with:

- clearer understanding of themselves
- a sense of direction
- or a next step

Do not force an ending.

Let it emerge naturally.

---

FINAL

Follow what matters most in what they say.

Help them see it more clearly.`;

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