import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import ollama from "ollama";
const server = new McpServer({
    name: "collabspace-mcp",
    version: "1.0.0",
});
const sampleMessages = [
    {
        user: "Rahul",
        text: "We need to finish the dashboard before Friday.",
    },
    {
        user: "Priya",
        text: "I can handle the frontend components.",
    },
    {
        user: "Amit",
        text: "I'll work on the API integration.",
    },
    {
        user: "Rahul",
        text: "Great. We should also add authentication.",
    },
    {
        user: "Priya",
        text: "Firebase Authentication should work for this.",
    },
    {
        user: "Amit",
        text: "I'll create the Firebase configuration today.",
    },
    {
        user: "Rahul",
        text: "Let's have a testing session on Thursday.",
    },
    {
        user: "Priya",
        text: "I'll prepare the frontend for testing.",
    },
    {
        user: "Amit",
        text: "I'll make sure the API is ready by Wednesday.",
    },
    {
        user: "Rahul",
        text: "Perfect. Let's review everything Thursday afternoon.",
    },
];
server.registerTool("summarize_messages", {
    description: "Summarize CollabSpace chat messages using Llama 3.2 through Ollama.",
    inputSchema: {
        messages: z
            .array(z.object({
            user: z.string(),
            text: z.string(),
        }))
            .optional(),
    },
}, async ({ messages }) => {
    const messagesToSummarize = (messages && messages.length > 0) ? messages : sampleMessages;
    const conversation = messagesToSummarize
        .map((message) => `${message.user}: ${message.text}`)
        .join("\n");
    try {
        const response = await ollama.chat({
            model: "llama3.2",
            messages: [
                {
                    role: "system",
                    content: `You are a helpful team collaboration assistant for CollabSpace.
Summarize the conversation clearly.

Include:
1. Main topic
2. Important decisions
3. Action items and who is responsible
4. Deadlines
5. Any unresolved issues

Keep the summary concise and nicely formatted.`,
                },
                {
                    role: "user",
                    content: `Here are the chat messages:\n\n${conversation}`,
                },
            ],
        });
        return {
            content: [
                {
                    type: "text",
                    text: response.message.content,
                },
            ],
        };
    }
    catch (err) {
        console.error("Ollama summary generation error:", err);
        return {
            isError: true,
            content: [
                {
                    type: "text",
                    text: `Failed to generate summary via Ollama (llama3.2). Ensure Ollama is running ('ollama run llama3.2'). Error details: ${err.message || String(err)}`,
                },
            ],
        };
    }
});
console.error("CollabSpace MCP server starting...");
const transport = new StdioServerTransport();
await server.connect(transport);
console.error("CollabSpace MCP server connected.");
