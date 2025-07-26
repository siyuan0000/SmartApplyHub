import { NextRequest, NextResponse } from "next/server";
import { EmailGeneratorService } from "@/lib/ai/email-generator";
// import { getAuthenticatedUserAndClientWithResponse } from "@/lib/supabase/api-utils";
import { ResumeContent } from "@/lib/resume/parser";

interface GenerateEmailRequest {
  jobPosting: {
    id: string;
    title: string;
    company_name: string;
    description: string;
    requirements?: string;
    location?: string;
    salary_range?: string;
  };
  resumeContent: ResumeContent;
  options?: {
    tone?: "professional" | "friendly" | "formal";
    includeAttachments?: boolean;
    customInstructions?: string;
  };
  stream?: boolean;
}

interface EnhanceEmailRequest {
  jobPosting: {
    id: string;
    title: string;
    company_name: string;
    description: string;
    requirements?: string;
    location?: string;
    salary_range?: string;
  };
  resumeContent: ResumeContent;
  existingEmail: string;
  feedback: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      jobPosting,
      resumeContent,
      options,
      existingEmail,
      feedback,
      stream = false,
    }: GenerateEmailRequest & EnhanceEmailRequest = body;

    if (!jobPosting || !resumeContent) {
      return NextResponse.json(
        {
          error: "Job posting and resume content are required",
        },
        { status: 400 }
      );
    }

    // // Authenticate user and get client with proper response handling
    // const { user, supabase, response } =
    //   await getAuthenticatedUserAndClientWithResponse(request);

    // If streaming is requested, return a streaming response
    if (stream && !existingEmail) {
      const encoder = new TextEncoder();

      const readableStream = new ReadableStream({
        async start(controller) {
          try {
            const emailStream =
              EmailGeneratorService.generateApplicationEmailStream(
                jobPosting,
                resumeContent,
                options
              );

            for await (const chunk of emailStream) {
              const data = `data: ${JSON.stringify({ content: chunk })}\n\n`;
              controller.enqueue(encoder.encode(data));
            }

            // Send completion signal
            const doneData = `data: ${JSON.stringify({ done: true })}\n\n`;
            controller.enqueue(encoder.encode(doneData));
            controller.close();
          } catch (error) {
            const errorData = `data: ${JSON.stringify({
              error:
                error instanceof Error ? error.message : "Generation failed",
            })}\n\n`;
            controller.enqueue(encoder.encode(errorData));
            controller.close();
          }
        },
      });

      return new Response(readableStream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    // Non-streaming response for backwards compatibility
    let generatedEmail;

    // Determine if this is enhancement or generation
    if (existingEmail && feedback) {
      generatedEmail = await EmailGeneratorService.enhanceEmailContent(
        existingEmail,
        jobPosting,
        resumeContent,
        feedback
      );
    } else {
      generatedEmail = await EmailGeneratorService.generateApplicationEmail(
        jobPosting,
        resumeContent,
        options
      );
    }

    // // Optional: Save generated email to database for future reference
    // try {
    //   await supabase.from("ai_reviews").insert({
    //     user_id: user.id,
    //     resume_id: null, // We don't have resume ID anymore, just content
    //     review_type: "optimization",
    //     feedback: {
    //       type: "email_generation",
    //       jobPostingId: jobPosting.id,
    //       generatedEmail,
    //       options: options || {},
    //     },
    //     score: null,
    //   });
    // } catch (saveError) {
    //   console.error("Failed to save email generation record:", saveError);
    //   // Don't fail the request if we can't save to DB
    // }

    return NextResponse.json({
      email: generatedEmail,
      jobPosting: {
        id: jobPosting.id,
        description: jobPosting.description,
      },
      resumeContent: resumeContent,
    });
  } catch (error) {
    console.error("Email generation failed:", error);
    return NextResponse.json(
      {
        error: "Email generation failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
