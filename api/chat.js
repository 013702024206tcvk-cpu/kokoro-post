
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "POST only"
    });
  }

  try {
    const { messages } = req.body || {};

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        error: "メッセージを入力してください"
      });
    }

    const response = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4.1-mini",
          instructions:
            "あなたは「こころちゃん」という優しい相談相手です。主に学校生活に悩む人の話を聞きます。相手の気持ちを否定せず、まず共感し、必要に応じて一つずつ質問してください。説教したり、無理に前向きにさせたりしないでください。短く自然な日本語で返答してください。あなたはAIであることを隠さないでください。深刻な危険がある場合は、信頼できる大人や専門家に相談するよう促してください。",
          input: messages.slice(-12).map(m => ({
            role: m.role === "bot" ? "assistant" : "user",
            content: m.text
          }))
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenAI error:", data);
      return res.status(502).json({
        error: "AIとの接続に失敗しました"
      });
    }

    const answer = (data.output || [])
      .flatMap(item => item.content || [])
      .filter(item => item.type === "output_text")
      .map(item => item.text)
      .join("\n");

    return res.status(200).json({
      reply: answer || "ごめんね、もう一度話しかけてくれる？"
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "サーバーでエラーが発生しました"
    });
  }
}
