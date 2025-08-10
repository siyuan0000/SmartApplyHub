import { BaseOpenAIService } from "./base-service";
import { ResumeContent } from "../resume/parser";

interface JobPosting {
  id: string;
  title: string;
  company_name: string;
  description: string;
  requirements?: string;
  location?: string;
  salary_range?: string;
}

// Generated email result interface
export interface AIGeneratedEmail {
  subject: string;
  body: string;
  keypoints: string[];
  tone: "professional" | "friendly" | "formal";
}

// Email generator service - creates personalized application emails
export class EmailGeneratorService extends BaseOpenAIService {
  static async generateApplicationEmail(
    jobPosting: JobPosting,
    resumeContent: ResumeContent,
    options?: {
      tone?: "professional" | "friendly" | "formal";
      includeAttachments?: boolean;
      customInstructions?: string;
      language?: "english" | "chinese";
    }
  ): Promise<AIGeneratedEmail> {
    const language = options?.language || "english";

    const prompt =
      language === "chinese"
        ? `
      请帮我写一份专业的求职申请邮件（cover letter）。请仔细分析职位要求和公司特点，从我的简历中挑选最相关的经历和技能，突出匹配度。

      ## 职位信息分析：
      职位标题：${jobPosting.title}
      公司名称：${jobPosting.company_name}
      职位描述：${jobPosting.description}
      职位要求：${jobPosting.requirements || "未提供具体要求"}
      工作地点：${jobPosting.location || "未指定"}
      薪资范围：${jobPosting.salary_range || "面议"}

      ## 我的简历信息：
      姓名：${resumeContent.contact.name || "求职者"}
      邮箱：${resumeContent.contact.email || ""}
      电话：${resumeContent.contact.phone || ""}
      技能：${resumeContent.skills.join(", ") || "待补充"}
      
      工作经历：
      ${resumeContent.experience
        .map(
          (exp) =>
            `- ${exp.title} | ${exp.company} (${exp.startDate || ""} - ${
              exp.endDate || "至今"
            })
         主要职责：${exp.description || ""}
         关键成就：${exp.achievements?.join("；") || ""}`
        )
        .join("\n")}
      
      教育背景：
      ${resumeContent.education
        .map(
          (edu) =>
            `- ${edu.degree} | ${edu.school} (${edu.graduationDate || ""})
         GPA：${edu.gpa || ""}
         荣誉：${edu.honors?.join("；") || ""}`
        )
        .join("\n")}
      
      项目经历：
      ${
        resumeContent.projects
          ?.map(
            (proj) =>
              `- ${proj.name}：${proj.description}
         技术栈：${proj.technologies?.join("、") || ""}
         项目详情：${proj.details?.join("；") || ""}`
          )
          .join("\n") || "暂无项目经历"
      }

      ## 写作要求：
      1. 邮件要体现出对公司和职位的深入了解和浓厚兴趣
      2. 突出我的经历与职位要求的匹配程度
      3. 展现专业素养和沟通能力
      4. 语言简洁有力，逻辑清晰
      5. 体现出对公司文化和价值观的认同
      6. 表达加入团队的强烈意愿
      
      ## 邮件结构：
      - 开头：简洁的自我介绍和申请意图
      - 主体：结合职位要求分析自己的匹配优势（2-3个核心亮点）
      - 结尾：表达期待和后续行动
      - 署名：专业的结束语

      请返回JSON格式，包含以下字段：
      - subject: 简洁明确的邮件主题
      - body: 完整的求职邮件正文（纯文本格式，包含适当的换行）
      - keypoints: 邮件中突出的3个核心卖点

      ${
        options?.customInstructions
          ? `\n额外要求：${options.customInstructions}`
          : ""
      }
      请选用和职位描述相同的语言，按照一般的邮件格式书写。避免使用强调等符号。不要使用表情。
      使用中文。
    `
        : `
      Write a professional job application email (cover letter). Analyze the job requirements and company characteristics carefully, select the most relevant experiences and skills from my resume to highlight the match.

      ## Job Analysis:
      Position Title: ${jobPosting.title}
      Company Name: ${jobPosting.company_name}
      Job Description: ${jobPosting.description}
      Requirements: ${
        jobPosting.requirements || "No specific requirements provided"
      }
      Location: ${jobPosting.location || "Not specified"}
      Salary Range: ${jobPosting.salary_range || "Negotiable"}

      ## My Resume Information:
      Name: ${resumeContent.contact.name || "Applicant"}
      Email: ${resumeContent.contact.email || ""}
      Phone: ${resumeContent.contact.phone || ""}
      Skills: ${resumeContent.skills.join(", ") || "To be added"}
      
      Work Experience:
      ${resumeContent.experience
        .map(
          (exp) =>
            `- ${exp.title} | ${exp.company} (${exp.startDate || ""} - ${
              exp.endDate || "Present"
            })
         Key Responsibilities: ${exp.description || ""}
         Achievements: ${exp.achievements?.join("; ") || ""}`
        )
        .join("\n")}
      
      Education:
      ${resumeContent.education
        .map(
          (edu) =>
            `- ${edu.degree} | ${edu.school} (${edu.graduationDate || ""})
         GPA: ${edu.gpa || ""}
         Honors: ${edu.honors?.join("; ") || ""}`
        )
        .join("\n")}
      
      Projects:
      ${
        resumeContent.projects
          ?.map(
            (proj) =>
              `- ${proj.name}: ${proj.description}
         Technologies: ${proj.technologies?.join(", ") || ""}
         Details: ${proj.details?.join("; ") || ""}`
          )
          .join("\n") || "No projects listed"
      }

      ## Writing Requirements:
      1. Demonstrate deep understanding and strong interest in the company and position
      2. Highlight how my experience matches the job requirements
      3. Show professional expertise and communication skills
      4. Use concise, powerful language with clear logic
      5. Reflect alignment with company culture and values
      6. Express strong desire to join the team
      
      ## Email Structure:
      - Opening: Brief self-introduction and application intent
      - Body: Analyze matching advantages based on job requirements (2-3 core highlights)
      - Closing: Express expectations and next steps
      - Signature: Professional closing

      Please return JSON format with the following fields:
      - subject: Clear and concise email subject line
      - body: Complete job application email body (plain text format with appropriate line breaks)
      - keypoints: 3 core selling points highlighted in the email

      ${
        options?.customInstructions
          ? `\nAdditional requirements: ${options.customInstructions}`
          : ""
      }
      Write in English. Do not use ** or - symbols. Follow standard email format.
    `;

    const messages = [
      {
        role: "system" as const,
        content:
          language === "chinese"
            ? "你是一位专业的职业教练和求职邮件写作专家，专门研究中国就业市场。创建个性化、有说服力的求职申请邮件，突出候选人的优势并将其与职位要求相匹配。仔细分析公司文化和职位要求。返回结构化的JSON格式，包含适当的求职信格式，包括问候语、结构化内容和专业结尾。重点展示对公司和职位的真诚兴趣。"
            : "You are an expert career coach and professional email writer. Create personalized, compelling job application emails that highlight the candidate's strengths and match them to the job requirements. Analyze company culture and position requirements carefully. Return structured JSON with proper cover letter format including greetings, structured content, and professional closing. Focus on demonstrating genuine interest in the company and role.",
      },
      {
        role: "user" as const,
        content: prompt,
      },
    ];

    // Use optimized settings for generation task
    const maxTokens = this.getOptimalTokens(2000);
    const temperature = this.getOptimalTemperature("generation");

    const parsed = await this.makeStructuredRequest<{
      subject?: string;
      body?: string;
      keypoints?: string[];
    }>(messages, maxTokens, temperature);
    return {
      subject: parsed.subject || "Job Application",
      body: parsed.body || "",
      keypoints: parsed.keypoints || [],
      tone: options?.tone || "professional",
    };
  }

  // Streaming version for gradual text rendering with structured data
  static async *generateApplicationEmailStream(
    jobPosting: JobPosting,
    resumeContent: ResumeContent,
    options?: {
      tone?: "professional" | "friendly" | "formal";
      includeAttachments?: boolean;
      customInstructions?: string;
      language?: "english" | "chinese";
    }
  ): AsyncGenerator<string, void, unknown> {
    const language = options?.language || "english";

    const prompt =
      language === "chinese"
        ? `
      请帮我写一份专业的求职申请邮件（cover letter）。请仔细分析职位要求和公司特点，从我的简历中挑选最相关的经历和技能，突出匹配度。

      ## 职位信息分析：
      职位标题：${jobPosting.title}
      公司名称：${jobPosting.company_name}
      职位描述：${jobPosting.description}
      职位要求：${jobPosting.requirements || "未提供具体要求"}
      工作地点：${jobPosting.location || "未指定"}
      薪资范围：${jobPosting.salary_range || "面议"}

      ## 我的简历信息：
      姓名：${resumeContent.contact.name || "求职者"}
      邮箱：${resumeContent.contact.email || ""}
      电话：${resumeContent.contact.phone || ""}
      技能：${resumeContent.skills.join(", ") || "待补充"}
      
      工作经历：
      ${resumeContent.experience
        .map(
          (exp) =>
            `- ${exp.title} | ${exp.company} (${exp.startDate || ""} - ${
              exp.endDate || "至今"
            })
         主要职责：${exp.description || ""}
         关键成就：${exp.achievements?.join("；") || ""}`
        )
        .join("\n")}
      
      教育背景：
      ${resumeContent.education
        .map(
          (edu) =>
            `- ${edu.degree} | ${edu.school} (${edu.graduationDate || ""})
         GPA：${edu.gpa || ""}
         荣誉：${edu.honors?.join("；") || ""}`
        )
        .join("\n")}
      
      项目经历：
      ${
        resumeContent.projects
          ?.map(
            (proj) =>
              `- ${proj.name}：${proj.description}
         技术栈：${proj.technologies?.join("、") || ""}
         项目详情：${proj.details?.join("；") || ""}`
          )
          .join("\n") || "暂无项目经历"
      }

      ## 写作要求：
      1. 邮件要体现出对公司和职位的深入了解和浓厚兴趣
      2. 突出我的经历与职位要求的匹配程度
      3. 展现专业素养和沟通能力
      4. 语言简洁有力，逻辑清晰
      5. 体现出对公司文化和价值观的认同
      6. 表达加入团队的强烈意愿
      
      ## 邮件结构：
      - 开头：简洁的自我介绍和申请意图
      - 主体：结合职位要求分析自己的匹配优势
      - 结尾：表达期待和后续行动
      - 署名：专业的结束语

      ## 重要：输出格式要求
      请严格按照以下格式输出（不要输出JSON），使用三个等号作为分隔符：
      
      Subject: [在这里写邮件主题]
      ===
      [在这里写完整的邮件正文，包含所有段落和格式]
      ===
      Keypoints:
      - [核心卖点1]
      - [核心卖点2]  
      - [核心卖点3]

      ${
        options?.customInstructions
          ? `\n额外要求：${options.customInstructions}`
          : ""
      }
      请使用中文。
    `
        : `
      Write a professional job application email (cover letter). Analyze the job requirements and company characteristics carefully, select the most relevant experiences and skills from my resume to highlight the match.

      ## Job Analysis:
      Position Title: ${jobPosting.title}
      Company Name: ${jobPosting.company_name}
      Job Description: ${jobPosting.description}
      Requirements: ${
        jobPosting.requirements || "No specific requirements provided"
      }
      Location: ${jobPosting.location || "Not specified"}
      Salary Range: ${jobPosting.salary_range || "Negotiable"}

      ## My Resume Information:
      Name: ${resumeContent.contact.name || "Applicant"}
      Email: ${resumeContent.contact.email || ""}
      Phone: ${resumeContent.contact.phone || ""}
      Skills: ${resumeContent.skills.join(", ") || "To be added"}
      
      Work Experience:
      ${resumeContent.experience
        .map(
          (exp) =>
            `- ${exp.title} | ${exp.company} (${exp.startDate || ""} - ${
              exp.endDate || "Present"
            })
         Key Responsibilities: ${exp.description || ""}
         Achievements: ${exp.achievements?.join("; ") || ""}`
        )
        .join("\n")}
      
      Education:
      ${resumeContent.education
        .map(
          (edu) =>
            `- ${edu.degree} | ${edu.school} (${edu.graduationDate || ""})
         GPA: ${edu.gpa || ""}
         Honors: ${edu.honors?.join("; ") || ""}`
        )
        .join("\n")}
      
      Projects:
      ${
        resumeContent.projects
          ?.map(
            (proj) =>
              `- ${proj.name}: ${proj.description}
         Technologies: ${proj.technologies?.join(", ") || ""}
         Details: ${proj.details?.join("; ") || ""}`
          )
          .join("\n") || "No projects listed"
      }

      ## Writing Requirements:
      1. Demonstrate deep understanding and strong interest in the company and position
      2. Highlight how my experience matches the job requirements
      3. Show professional expertise and communication skills
      4. Use concise, powerful language with clear logic
      5. Reflect alignment with company culture and values
      6. Express strong desire to join the team
      
      ## Email Structure:
      - Opening: Brief self-introduction and application intent
      - Body: Analyze matching advantages based on job requirements
      - Closing: Express expectations and next steps
      - Signature: Professional closing

      ## Important: Output Format Requirements
      Please strictly follow this format (do not output JSON), use three equal signs as delimiter:
      
      Subject: [Write email subject here]
      ===
      [Write complete email body here, including all paragraphs and formatting]
      ===
      Keypoints:
      - [Core selling point 1]
      - [Core selling point 2]  
      - [Core selling point 3]

      ${
        options?.customInstructions
          ? `\nAdditional requirements: ${options.customInstructions}`
          : ""
      }
      Write in English.
    `;

    const messages = [
      {
        role: "system" as const,
        content:
          language === "chinese"
            ? "You are an expert career coach and professional email writer specializing in Chinese job market. Create personalized, compelling job application emails that highlight the candidate's strengths and match them to the job requirements. Analyze company culture and position requirements carefully. Output in the exact format requested with Subject:, body content, and Keypoints: sections separated by === delimiters. The body should be a proper cover letter format with appropriate greetings, structured content, and professional closing."
            : "You are an expert career coach and professional email writer. Create personalized, compelling job application emails that highlight the candidate's strengths and match them to the job requirements. Analyze company culture and position requirements carefully. Output in the exact format requested with Subject:, body content, and Keypoints: sections separated by === delimiters. The body should be a proper cover letter format with appropriate greetings, structured content, and professional closing.",
      },
      {
        role: "user" as const,
        content: prompt,
      },
    ];

    // Use optimized settings for streaming generation
    const maxTokens = this.getOptimalTokens(2000);
    const temperature = this.getOptimalTemperature("generation");

    yield* this.makeStreamingRequest(messages, maxTokens, temperature);
  }

  static async enhanceEmailContent(
    existingEmail: string,
    jobPosting: JobPosting,
    resumeContent: ResumeContent,
    feedback: string
  ): Promise<AIGeneratedEmail> {
    const prompt = `
      Enhance this existing job application email based on the feedback provided:
      
      CURRENT EMAIL:
      ${existingEmail}
      
      JOB POSTING:
      Title: ${jobPosting.title}
      Company: ${jobPosting.company_name}
      
      APPLICANT SKILLS:
      ${resumeContent.skills.join(", ")}
      
      FEEDBACK TO ADDRESS:
      ${feedback}
      
      Please improve the email while maintaining its structure and tone.
      Focus on addressing the feedback while keeping the email professional and concise.
      
      Return the response as a JSON object with the following structure:
      {
        "subject": "Improved email subject line",
        "body": "Enhanced email body",
        "keypoints": ["Key improvement 1", "Key improvement 2", "Key improvement 3"],
        "tone": "professional"
      }
    `;

    const messages = [
      {
        role: "system" as const,
        content:
          "You are an expert career coach. Enhance job application emails based on specific feedback while maintaining professionalism and effectiveness.",
      },
      {
        role: "user" as const,
        content: prompt,
      },
    ];

    // Use optimized settings for generation task
    const maxTokens = this.getOptimalTokens(1500);
    const temperature = this.getOptimalTemperature("generation");

    return await this.makeStructuredRequest<AIGeneratedEmail>(
      messages,
      maxTokens,
      temperature
    );
  }
}
