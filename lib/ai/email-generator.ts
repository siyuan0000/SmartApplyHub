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
    }
  ): Promise<AIGeneratedEmail> {
    const prompt = `
      请帮我写一份专业的求职申请邮件（cover letter）。请仔细分析职位要求和公司特点，从我的简历中挑选最相关的经历和技能，突出匹配度。

      ## 职位信息分析：
      职位标题：${jobPosting.title}
      公司名称：${jobPosting.company_name}
      职位描述：${jobPosting.description}
      职位要求：${jobPosting.requirements || '未提供具体要求'}
      工作地点：${jobPosting.location || '未指定'}
      薪资范围：${jobPosting.salary_range || '面议'}

      ## 我的简历信息：
      姓名：${resumeContent.contact.name || '求职者'}
      邮箱：${resumeContent.contact.email || ''}
      电话：${resumeContent.contact.phone || ''}
      技能：${resumeContent.skills.join(', ') || '待补充'}
      
      工作经历：
      ${resumeContent.experience.map(exp => 
        `- ${exp.title} | ${exp.company} (${exp.startDate || ''} - ${exp.endDate || '至今'})
         主要职责：${exp.description || ''}
         关键成就：${exp.achievements?.join('；') || ''}`
      ).join('\n')}
      
      教育背景：
      ${resumeContent.education.map(edu => 
        `- ${edu.degree} | ${edu.school} (${edu.graduationDate || ''})
         GPA：${edu.gpa || ''}
         荣誉：${edu.honors?.join('；') || ''}`
      ).join('\n')}
      
      项目经历：
      ${resumeContent.projects?.map(proj => 
        `- ${proj.name}：${proj.description}
         技术栈：${proj.technologies?.join('、') || ''}
         项目详情：${proj.details?.join('；') || ''}`
      ).join('\n') || '暂无项目经历'}

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

      ${options?.customInstructions ? `\n额外要求：${options.customInstructions}` : ''}
    `;

    const messages = [
      {
        role: "system" as const,
        content:
          "You are an expert career coach and professional email writer specializing in Chinese job market. Create personalized, compelling job application emails that highlight the candidate's strengths and match them to the job requirements. Analyze company culture and position requirements carefully. Return structured JSON with proper cover letter format including greetings, structured content, and professional closing. Focus on demonstrating genuine interest in the company and role.",
      },
      {
        role: "user" as const,
        content: prompt,
      },
    ];

    // Use optimized settings for generation task
    const maxTokens = this.getOptimalTokens(2000);
    const temperature = this.getOptimalTemperature('generation');
    
    const parsed = await this.makeStructuredRequest<{
      subject?: string;
      body?: string;
      keypoints?: string[];
    }>(messages, maxTokens, temperature);
    return {
      subject: parsed.subject || "Job Application",
      body: parsed.body || "",
      keypoints: parsed.keypoints || [],
      tone: options?.tone || "professional"
    };
  }

  // Streaming version for gradual text rendering with structured data
  static async* generateApplicationEmailStream(
    jobPosting: JobPosting,
    resumeContent: ResumeContent,
    options?: {
      tone?: "professional" | "friendly" | "formal";
      includeAttachments?: boolean;
      customInstructions?: string;
    }
  ): AsyncGenerator<string, void, unknown> {
    const prompt = `
      请帮我写一份专业的求职申请邮件（cover letter）。请仔细分析职位要求和公司特点，从我的简历中挑选最相关的经历和技能，突出匹配度。

      ## 职位信息分析：
      职位标题：${jobPosting.title}
      公司名称：${jobPosting.company_name}
      职位描述：${jobPosting.description}
      职位要求：${jobPosting.requirements || '未提供具体要求'}
      工作地点：${jobPosting.location || '未指定'}
      薪资范围：${jobPosting.salary_range || '面议'}

      ## 我的简历信息：
      姓名：${resumeContent.contact.name || '求职者'}
      邮箱：${resumeContent.contact.email || ''}
      电话：${resumeContent.contact.phone || ''}
      技能：${resumeContent.skills.join(', ') || '待补充'}
      
      工作经历：
      ${resumeContent.experience.map(exp => 
        `- ${exp.title} | ${exp.company} (${exp.startDate || ''} - ${exp.endDate || '至今'})
         主要职责：${exp.description || ''}
         关键成就：${exp.achievements?.join('；') || ''}`
      ).join('\n')}
      
      教育背景：
      ${resumeContent.education.map(edu => 
        `- ${edu.degree} | ${edu.school} (${edu.graduationDate || ''})
         GPA：${edu.gpa || ''}
         荣誉：${edu.honors?.join('；') || ''}`
      ).join('\n')}
      
      项目经历：
      ${resumeContent.projects?.map(proj => 
        `- ${proj.name}：${proj.description}
         技术栈：${proj.technologies?.join('、') || ''}
         项目详情：${proj.details?.join('；') || ''}`
      ).join('\n') || '暂无项目经历'}

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
      {
        "subject": "简洁明确的邮件主题",
        "body": "完整的求职邮件正文（纯文本格式，包含适当的换行）",
        "keypoints": ["邮件中突出的3个核心卖点"]
      }

      ${options?.customInstructions ? `\n额外要求：${options.customInstructions}` : ''}
    `;

    const messages = [
      {
        role: "system" as const,
        content: "You are an expert career coach and professional email writer specializing in Chinese job market. Create personalized, compelling job application emails that highlight the candidate's strengths and match them to the job requirements. Analyze company culture and position requirements carefully. Return a JSON object with subject, body, and keypoints fields. The body should be a proper cover letter format with appropriate greetings, structured content, and professional closing.",
      },
      {
        role: "user" as const,
        content: prompt,
      },
    ];

    // Use optimized settings for streaming generation
    const maxTokens = this.getOptimalTokens(2000);
    const temperature = this.getOptimalTemperature('generation');
    
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
    const temperature = this.getOptimalTemperature('generation');
    
    return await this.makeStructuredRequest<AIGeneratedEmail>(messages, maxTokens, temperature);
  }
}