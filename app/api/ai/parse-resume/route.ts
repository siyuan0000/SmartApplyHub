import { NextRequest, NextResponse } from "next/server";
import { ResumeParserService } from "@/lib/ai/resume-parser";

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error("Invalid JSON in request body:", parseError);
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const { rawText } = body;

    if (!rawText || typeof rawText !== "string") {
      return NextResponse.json(
        { error: "Raw text is required and must be a string" },
        { status: 400 }
      );
    }

    if (rawText.trim().length === 0) {
      return NextResponse.json(
        { error: "Raw text cannot be empty" },
        { status: 400 }
      );
    }

    // Remove authentication check here

    // Validate OpenAI configuration
    if (!process.env.OPENAI_API_KEY) {
      console.error("OpenAI API key not configured");
      return NextResponse.json(
        {
          error: "AI service not configured",
          details: "OpenAI API key is missing",
        },
        { status: 500 }
      );
    }

    // Parse with OpenAI
    try {
      const structuredContent = await ResumeParserService.parseResumeStructure(
        rawText
      );

      return NextResponse.json({ structuredContent });
    } catch (aiError) {
      console.error("OpenAI parsing failed:", aiError);

      // Handle specific OpenAI errors
      let errorMessage = "Resume parsing failed";
      let statusCode = 500;

      if (aiError instanceof Error) {
        if (aiError.message.includes("API key")) {
          errorMessage = "AI service authentication failed";
          statusCode = 500;
        } else if (
          aiError.message.includes("rate limit") ||
          aiError.message.includes("quota")
        ) {
          errorMessage =
            "AI service rate limit exceeded. Please try again later.";
          statusCode = 429;
        } else if (
          aiError.message.includes("network") ||
          aiError.message.includes("timeout")
        ) {
          errorMessage =
            "AI service temporarily unavailable. Please try again.";
          statusCode = 503;
        } else {
          errorMessage = aiError.message;
        }
      }

      return NextResponse.json(
        {
          error: errorMessage,
          details:
            aiError instanceof Error ? aiError.message : "Unknown AI error",
          suggestion:
            "Please try again or contact support if the issue persists",
        },
        { status: statusCode }
      );
    }
  } catch (error) {
    console.error("Unexpected error in parse-resume API:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
        suggestion: "Please try again or contact support",
      },
      { status: 500 }
    );
  }
}
