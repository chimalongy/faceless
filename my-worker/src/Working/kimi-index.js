export default {
    async fetch(request, env) {

        if (request.method !== "POST") {
            return new Response(
                JSON.stringify({
                    usage: "POST { messages: [{role, content}], system?: string }",
                    example: {
                        system: "You are a helpful assistant.",
                        messages: [{ role: "user", content: "Hello!" }],
                    },
                }),
                { status: 405, headers: { "Content-Type": "application/json" } }
            );
        }

        try {
            const body = await request.json();
            const { messages, system } = body;

            if (!messages || !Array.isArray(messages) || messages.length === 0) {
                return new Response(
                    JSON.stringify({ error: "messages is required and must be a non-empty array." }),
                    { status: 400, headers: { "Content-Type": "application/json" } }
                );
            }

            // Build the messages array — prepend system message if provided
            const fullMessages = [
                {
                    role: "system",
                    content: system || "You are a helpful assistant.",
                },
                ...messages,
            ];

            const result = await env.AI.run("@cf/moonshotai/kimi-k2.6", {
                messages: fullMessages,
            });

            // Kimi returns OpenAI-style response
            const reply = result.choices?.[0]?.message?.content ?? result.response ?? result;

            return new Response(
                JSON.stringify({
                    reply,
                    usage: result.usage ?? null,
                }),
                { headers: { "Content-Type": "application/json" } }
            );

        } catch (err) {
            return new Response(
                JSON.stringify({ error: err.message }),
                { status: 500, headers: { "Content-Type": "application/json" } }
            );
        }
    },
};