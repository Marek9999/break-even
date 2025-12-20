import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenAI } from "@google/genai";

interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
}

interface GeminiErrorResponse {
  error: string;
}

type GeminiResponse = ReceiptItem[] | GeminiErrorResponse;

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { imageData, mimeType } = body;

    if (!imageData) {
      return NextResponse.json(
        { error: "Missing image data" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GOOGLE_GEMINI_API_KEY is not configured");
      return NextResponse.json(
        { error: "Service not configured" },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    // Remove base64 prefix if present (e.g., "data:image/jpeg;base64,")
    const base64Data = imageData.includes(",")
      ? imageData.split(",")[1]
      : imageData;

    const prompt = `Analyze this receipt/invoice image and extract ALL line items including taxes, tips, and fees.
Return ONLY a valid JSON array with no additional text, markdown formatting, or code blocks.
Each item in the array must be an object with exactly these fields:
- "name": string (the item name/description)
- "quantity": number (quantity purchased, default to 1 if not specified)
- "price": number (unit price per item, NOT the total line price)

IMPORTANT RULES:
1. If the receipt shows a total line price and quantity, divide to get unit price
2. INCLUDE tax as a separate item with name "Tax" (or the specific tax name like "Sales Tax", "VAT", etc.)
3. INCLUDE tip/gratuity as a separate item with name "Tip" or "Gratuity"
4. INCLUDE service charges, delivery fees, or other fees as separate items
5. For DISCOUNTS: include them as items with NEGATIVE price values (e.g., {"name": "Discount 10%", "quantity": 1, "price": -5.00})
6. Do NOT include subtotal or grand total lines - only individual items and charges
7. If this is not a receipt/invoice or items cannot be extracted, return exactly: {"error": "NOT_A_RECEIPT"}

Example valid response:
[{"name": "Coffee", "quantity": 2, "price": 4.50}, {"name": "Sandwich", "quantity": 1, "price": 8.99}, {"name": "Promo Discount", "quantity": 1, "price": -2.00}, {"name": "Tax", "quantity": 1, "price": 1.15}, {"name": "Tip", "quantity": 1, "price": 3.00}]`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          inlineData: {
            mimeType: mimeType || "image/jpeg",
            data: base64Data,
          },
        },
        { text: prompt },
      ],
    });

    const responseText = response.text?.trim();

    if (!responseText) {
      return NextResponse.json(
        { error: "No response from AI", code: "EMPTY_RESPONSE" },
        { status: 500 }
      );
    }

    // Parse the JSON response
    let parsedResponse: GeminiResponse;
    try {
      // Clean up potential markdown code blocks
      let cleanedText = responseText;
      if (cleanedText.startsWith("```json")) {
        cleanedText = cleanedText.slice(7);
      } else if (cleanedText.startsWith("```")) {
        cleanedText = cleanedText.slice(3);
      }
      if (cleanedText.endsWith("```")) {
        cleanedText = cleanedText.slice(0, -3);
      }
      cleanedText = cleanedText.trim();

      parsedResponse = JSON.parse(cleanedText);
    } catch {
      console.error("Failed to parse Gemini response:", responseText);
      return NextResponse.json(
        {
          error: "Could not process image. Please try a clearer photo.",
          code: "PARSE_ERROR",
        },
        { status: 400 }
      );
    }

    // Check if it's an error response
    if ("error" in parsedResponse) {
      if (parsedResponse.error === "NOT_A_RECEIPT") {
        return NextResponse.json(
          {
            error:
              "This doesn't appear to be a receipt or invoice. Please try again.",
            code: "NOT_A_RECEIPT",
          },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: parsedResponse.error, code: "AI_ERROR" },
        { status: 400 }
      );
    }

    // Validate the response is an array of items
    if (!Array.isArray(parsedResponse)) {
      return NextResponse.json(
        {
          error: "Could not process image. Please try a clearer photo.",
          code: "INVALID_FORMAT",
        },
        { status: 400 }
      );
    }

    // Validate and clean each item
    const validatedItems: ReceiptItem[] = [];
    for (const item of parsedResponse) {
      if (
        typeof item.name === "string" &&
        typeof item.quantity === "number" &&
        typeof item.price === "number" &&
        item.name.trim() !== "" &&
        item.quantity > 0
        // Note: price can be negative for discounts
      ) {
        validatedItems.push({
          name: item.name.trim(),
          quantity: item.quantity,
          price: Math.round(item.price * 100) / 100, // Round to 2 decimal places
        });
      }
    }

    if (validatedItems.length === 0) {
      return NextResponse.json(
        {
          error: "No valid items found in the receipt. Please try again.",
          code: "NO_ITEMS",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      items: validatedItems,
    });
  } catch (error) {
    console.error("Error scanning receipt:", error);
    return NextResponse.json(
      {
        error: "Failed to scan receipt. You can add items manually.",
        code: "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}
