const express = require("express");
const app = express();

// import the Genkit and Google AI plugin libraries
const { gemini15Flash, googleAI } = require( '@genkit-ai/googleai');
const  { genkit, z } = require('genkit');

// configure a Genkit instance
const ai = genkit({
  plugins: [googleAI( {apiKey: "YOUR_KEY"}  )],
  model: gemini15Flash, // set default model
});

const PORT = 3002;

const TravelPlanSchema = z.object({
    destination: z.string(),
    duration: z.object({
      startDate: z.string(),
      endDate: z.string()
    }),
    budget: z.number(),
    activities: z.array(z.object({
      name: z.string(),
      estimatedCost: z.number(),
      duration: z.string() // e.g., "2 hours", "half day"
    })),
    accommodation: z.object({
      hotelName: z.string(),
      checkIn: z.string(),
      checkOut: z.string(),
      roomType: z.string()
    }),
    transportation: z.array(z.object({
      type: z.string(), // e.g., "flight", "train", "rental car"
      details: z.string()
    }))
  });

// Get API
app.get("/", async (req, res) => {
  const { text } = await ai.generate({
    prompt: "Create a 10-day travel plan for Bali from Ahmedabad",
    output: { schema: TravelPlanSchema },
  });

  res.send({
    success: true,
    data: text,
  });
});

// Streaming endpoint
app.get("/stream", async (req, res) => {
    try {
        // Set headers for streaming
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        // Generate streaming response
        const { stream } = await ai.generateStream({
            prompt: 'Create a 10-day travel plan for Bali from Ahmedabad',
            output: { schema: TravelPlanSchema },
        });

        // Handle the stream
        for await (const chunk of stream) {
            // Send each chunk as an SSE event
            res.write(`data: ${JSON.stringify(chunk)}\n\n`);
        }

        // End the response when stream is complete
        res.end();
    } catch (error) {
        console.error('Streaming Error:', error);
        res.status(500).json({
            success: false,
            error: 'Streaming failed'
        });
    }
});

app.listen(PORT, () => console.log("Backend is Running"));
