import { NextResponse } from "next/server";
import { Mistral } from "@mistralai/mistralai";
import { Pinecone } from "@pinecone-database/pinecone";

const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const index = pc.index("chatbot");
const mistral = new Mistral({ apiKey: process.env.MISTRAL_API_KEY });

const baseSystemPrompt = `You are Myla, a Bichon Frise–Shih Tzu mix and Lauren Ruiz's beloved dog. You speak on Lauren's behalf to visitors of her portfolio. You are friendly, enthusiastic, and a little playful — like a dog who loves meeting new people. You refer to Lauren as "my mom" or "Lauren."

You answer questions about Lauren's background, education, skills, projects, experience, and interests using the context provided. If the context doesn't cover something, say you're not sure but the visitor can reach Lauren directly. Do not make up information about Lauren as potential job recruiters will see this site.

Keep responses warm, concise, and helpful. You can occasionally use light dog-themed expressions (like excitement or tail-wagging energy) but don't overdo it — you're still informative and professional on Lauren's behalf.`;

async function getRelevantContext(query) {
  const embeddings = await pc.inference.embed({
    model: "llama-text-embed-v2",
    inputs: [query],
    parameters: { inputType: "query", truncate: "END" },
  });

  const results = await index.query({
    vector: embeddings.data[0].values,
    topK: 3,
    includeMetadata: true,
  });

  return results.matches
    .map((match) => match.metadata?.text)
    .filter(Boolean)
    .join("\n\n");
}

export async function POST(req) {
  try {
    const { messages, language = 'English' } = await req.json();

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: "Conversation history is required." },
        { status: 400 }
      );
    }

    const filtered = messages.filter(
      (msg, i) =>
        !(
          msg.role === "assistant" &&
          msg.content === "" &&
          i === messages.length - 1
        )
    );

    const lastUserMessage = [...filtered]
      .reverse()
      .find((m) => m.role === "user")?.content ?? "";

    const context = await getRelevantContext(lastUserMessage);

    const languageInstruction = language !== 'English'
      ? `\n\nIMPORTANT: You must respond entirely in ${language}, regardless of the language the user writes in.`
      : '';

    const systemPrompt = context
      ? `${baseSystemPrompt}${languageInstruction}\n\nRelevant information about Lauren:\n${context}`
      : `${baseSystemPrompt}${languageInstruction}`;

    const chatMessages = [
      { role: "system", content: systemPrompt },
      ...filtered.map((msg) => ({ role: msg.role, content: msg.content })),
    ];

    const stream = await mistral.chat.stream({
      model: "mistral-small-latest",
      messages: chatMessages,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const text = chunk.data.choices[0]?.delta?.content ?? "";
          if (text) controller.enqueue(encoder.encode(text));
        }
        controller.close();
      },
    });

    return new NextResponse(readable);
  } catch (error) {
    console.error("Error getting content:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
