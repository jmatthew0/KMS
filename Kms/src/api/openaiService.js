export const askAI = async (userMessage) => {
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "You are KMS Assistant. Answer concisely and clearly." },
            { role: "user", content: userMessage },
          ],
        }),
      });
  
      const data = await response.json();
      return data.choices?.[0]?.message?.content || "No response.";
    } catch (error) {
      console.error("AI ERROR:", error);
      return "Error connecting to AI.";
    }
  };
  