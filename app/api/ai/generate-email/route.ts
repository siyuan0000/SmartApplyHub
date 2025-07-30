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

            let fullContent = '';

            for await (const chunk of emailStream) {
              fullContent += chunk;
              
              // Send streaming content to show progress
              const data = `data: ${JSON.stringify({ content: chunk })}\n\n`;
              controller.enqueue(encoder.encode(data));
            }

            // After streaming is complete, try to parse the full JSON
            try {
              // Clean up the content - remove any non-JSON parts
              let jsonContent = fullContent.trim();
              
              // Find the JSON object in the content
              const jsonStart = jsonContent.indexOf('{');
              const jsonEnd = jsonContent.lastIndexOf('}');
              
              if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
                jsonContent = jsonContent.substring(jsonStart, jsonEnd + 1);
                const parsed = JSON.parse(jsonContent);
                
                if (parsed.subject && parsed.body) {
                  // Send the complete structured email data
                  const emailData = `data: ${JSON.stringify({ 
                    email: {
                      subject: parsed.subject,
                      body: parsed.body,
                      keypoints: parsed.keypoints || [],
                      tone: options?.tone || "professional"
                    }
                  })}\n\n`;
                  controller.enqueue(encoder.encode(emailData));
                } else {
                  throw new Error('Invalid JSON structure');
                }
              } else {
                throw new Error('No JSON found in content');
              }
            } catch (error) {
              console.log('JSON parsing failed, treating as plain text:', error);
              // If not valid JSON, treat as plain text body
              const emailData = `data: ${JSON.stringify({ 
                email: {
                  subject: `Application for ${jobPosting.title} at ${jobPosting.company_name}`,
                  body: fullContent,
                  keypoints: [],
                  tone: options?.tone || "professional"
                }
              })}\n\n`;
              controller.enqueue(encoder.encode(emailData));
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
