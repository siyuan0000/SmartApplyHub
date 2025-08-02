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

            let buffer = '';
            let subject = '';
            let body = '';
            let keypoints: string[] = [];
            let currentSection: 'subject' | 'body' | 'keypoints' = 'subject';
            let subjectSent = false;
            let bodySent = false;

            for await (const chunk of emailStream) {
              buffer += chunk;
              
              // Process buffer to extract sections progressively
              while (buffer.length > 0) {
                if (currentSection === 'subject') {
                  // Look for subject line
                  const subjectMatch = buffer.match(/Subject:\s*(.+?)(?:\n|===)/);
                  if (subjectMatch) {
                    subject = subjectMatch[1].trim();
                    // Send subject immediately
                    if (!subjectSent) {
                      const subjectData = `data: ${JSON.stringify({ subject })}\n\n`;
                      controller.enqueue(encoder.encode(subjectData));
                      subjectSent = true;
                    }
                    
                    // Check if we have the first separator
                    const firstSeparatorIndex = buffer.indexOf('===');
                    if (firstSeparatorIndex !== -1) {
                      buffer = buffer.substring(firstSeparatorIndex + 3).trimStart();
                      currentSection = 'body';
                    } else {
                      break; // Wait for more content
                    }
                  } else {
                    break; // Wait for more content
                  }
                }
                
                if (currentSection === 'body') {
                  // Look for the second separator
                  const secondSeparatorIndex = buffer.indexOf('===');
                  if (secondSeparatorIndex !== -1) {
                    // Extract complete body
                    const bodyContent = buffer.substring(0, secondSeparatorIndex).trim();
                    if (bodyContent && !bodySent) {
                      body = bodyContent;
                      // Send complete body
                      const bodyData = `data: ${JSON.stringify({ body })}\n\n`;
                      controller.enqueue(encoder.encode(bodyData));
                      bodySent = true;
                    }
                    
                    buffer = buffer.substring(secondSeparatorIndex + 3).trimStart();
                    currentSection = 'keypoints';
                  } else {
                    // Stream body content as it arrives
                    const partialBody = buffer.trim();
                    if (partialBody && partialBody.length > body.length) {
                      body = partialBody;
                      const bodyChunkData = `data: ${JSON.stringify({ bodyChunk: body })}\n\n`;
                      controller.enqueue(encoder.encode(bodyChunkData));
                    }
                    break; // Wait for more content
                  }
                }
                
                if (currentSection === 'keypoints') {
                  // Extract keypoints
                  const keypointsMatch = buffer.match(/Keypoints:\s*([\s\S]*)/);
                  if (keypointsMatch) {
                    const keypointsText = keypointsMatch[1];
                    const extractedKeypoints = keypointsText
                      .split('\n')
                      .filter(line => line.trim().startsWith('-'))
                      .map(line => line.replace(/^-\s*/, '').trim())
                      .filter(point => point.length > 0);
                    
                    if (extractedKeypoints.length > 0) {
                      keypoints = extractedKeypoints;
                      const keypointsData = `data: ${JSON.stringify({ keypoints })}\n\n`;
                      controller.enqueue(encoder.encode(keypointsData));
                    }
                  }
                  break; // We've processed everything
                }
              }
            }

            // Send final complete email structure
            const finalEmail = {
              subject: subject || `Application for ${jobPosting.title} at ${jobPosting.company_name}`,
              body: body || buffer, // Use buffer as fallback if parsing failed
              keypoints: keypoints,
              tone: options?.tone || "professional"
            };
            
            const emailData = `data: ${JSON.stringify({ email: finalEmail })}\n\n`;
            controller.enqueue(encoder.encode(emailData));

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
