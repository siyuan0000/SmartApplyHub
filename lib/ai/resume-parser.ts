import { BaseOpenAIService } from "./base-service";
import { ResumeContent } from "@/lib/resume/parser";

// Resume parser service - converts raw text to structured JSON
export class ResumeParserService extends BaseOpenAIService {
  static async parseResumeStructure(rawText: string): Promise<ResumeContent> {
    const prompt = `
CRITICAL: You are reformatting resume information ONLY. Do NOT enhance, improve, or change any content. 
Preserve all original information exactly as provided.

BULLET POINT HANDLING:
- Experience: Use "description" for brief role overview, "achievements" array for bullet points
- Projects: Use "description" for overview, "details" array for bullet points  
- Convert all bullet indicators (•, -, *, 1., 2.) into clean array elements
- Preserve exact wording from original text

Parse this resume text into structured JSON:

${rawText}

Return JSON matching this EXACT structure:
{
  "contact": {
    "name": "exact name from resume",
    "email": "exact email", 
    "phone": "formatted phone",
    "location": "exact location",
    "linkedin": "exact linkedin url",
    "github": "exact github url"
  },
  "summary": "exact summary text without changes",
  "experience": [
    {
      "title": "exact job title",
      "company": "exact company name",
      "location": "exact location if provided", 
      "startDate": "MM/YYYY format",
      "endDate": "MM/YYYY or Present",
      "description": "brief role overview if provided",
      "achievements": ["exact bullet 1", "exact bullet 2", "exact bullet 3"]
    }
  ],
  "education": [
    {
      "degree": "exact degree name",
      "school": "exact school name", 
      "graduationDate": "MM/YYYY",
      "gpa": "exact GPA if provided"
    }
  ],
  "skills": ["exact skill 1", "exact skill 2"],
  "projects": [
    {
      "name": "exact project name",
      "description": "brief project overview", 
      "details": ["exact feature 1", "exact accomplishment 2"],
      "technologies": ["tech1", "tech2"],
      "url": "exact url if provided"
    }
  ],
  "raw_text": append the inpt raw_text here.
}

Do not enhance content - only restructure existing information.`;

    const messages = [
      {
        role: "system" as const,
        content:
          "You are a resume parsing specialist. Restructure content without enhancement.",
      },
      {
        role: "user" as const,
        content: prompt,
      },
    ];

    const content = await this.makeRequest(messages, 3000, 0.1);
    return JSON.parse(content);
  }
}
