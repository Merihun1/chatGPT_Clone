import db from '../../../../db/db.config.js'


import {GoogleGenAI} from '@google/genai';

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";


const geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });



export const getRecentConversationRows = async (limit = 5) => {
    const normalizedLimit = Number.parseInt(limit, 10);
    const safeLimit = Number.isNaN(normalizedLimit) || normalizedLimit <= 0 
    ?20
    : normalizedLimit;

    const [rows] = await db.execute(
      `SELECT id, role, content, created_at 
        FROM conversations
        ORDER BY id DESC
        LIMIT ${safeLimit}`,
    );
    return rows.reverse();

};

const generateAssistantAnswer = async ({ historyRows, question }) => {
  const formattedHistory = historyRows.map((row) => ({
    role: row.role === "assistant" ? "model" : "user",
    parts: [{ text: row.content }],
  }));

  const chat = geminiClient.chats.create({
    model: GEMINI_MODEL,
    config: {
      temperature: 0.7,
      maxOutputTokens: 500,
    },
    history: formattedHistory,
  });

  const result = await chat.sendMessage({ message: question });
  
  // Extract text safely (handling either string property or SDK method)
  const responseText =
    typeof result.text === "function" ? result.text() : result.text || "";

  // Fallback totalTokens to 0 or null if usage metadata is missing
  const totalTokens = result.usageMetadata?.totalTokenCount ?? 0;

  return {
    text: responseText,
    totalTokens: totalTokens,
  };
};;;

const getMessageById = async messageId => {
    const [rows] = await db.execute(
        'SELECT id, role, content, token_count, created_at FROM conversations WHERE id = ? LIMIT 1',
        [messageId],
    );

    if(!rows) return null;
    return {
      id: rows[0].id,
      role: rows[0].role,
      content: rows[0].content,
      tokenCount: Number(rows[0].token_count || 0),
      createdAt: rows[0].created_at,
    };
};



export async function createConversationService(question) {
  try {
    // validation 
    if(!question.trim()){
        const error = new Error('Question is required');
        error.status = 400;
        throw error;
    }
// get recent conversations
    const historyRows = await getRecentConversationRows(5);

// insert new conversations

const [result] = await db.execute(
    `INSERT INTO conversations (content, role) VALUES (?, 'user')`,
    [question],
);
    const {text, totalTokens}  = await generateAssistantAnswer({
        historyRows, 
        question,
    });

    const [assistantResult] = await db.execute(
      "INSERT INTO conversations (role, content, token_count) VALUES (?, ?, ?)",
      ["assistant", text ?? "", totalTokens ?? 0],
    );

    const userConversation = await getMessageById(result.insertId);
   const assistantConversation = await getMessageById(assistantResult.insertId);

    return {
      userConversation,
      assistantConversation,
    };
  } catch (error) {
    throw error;
  }
};

