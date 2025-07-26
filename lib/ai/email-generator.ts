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
      请帮我写一份简单的投递简历邮件。从简历中挑选与一下岗位相关的过往经历，突出强调，保证语言简洁明了。根据职位要求改变语言。

      这是我想要投递的岗位信息：${jobPosting}

      这是我的简历信息：${resumeContent}
      
      案例：

      尊敬的高瓴创投招聘团队：
      您好！
      我是牛津大学物理系的准硕士研究生董子毓。得知贵机构正在招聘“创新科技方向
      实习生”后，我在仔细阅读岗位描述后撰写此信，希望凭借自身的教育背景、研究经历
      与投资实习经验，为贵团队在前沿技术领域的投资研究贡献力量。
      正如我的简历所示，在汉能投资集团担任私募股权分析师实习生期间，我系统性地
      学习并梳理了硬科技、半导体、新能源与人工智能等赛道的行业信息与痛点，对相关初
      创企业的竞争格局有了初步认知。此外，在实习中我也熟悉了项目筛选、初步尽调与专
      家访谈等流程；结合科研中积累的半导体材料、光电材料、超导材料与二维材料知识，
      以及多次科研实习锻炼出的快速学习能力， 使我能够迅速评估核心技术的可行性与潜在
      壁垒，并以量化指标和独立观点帮助团队判断技术潜力与行业趋势。
      与岗位要求的契合
       理工科背景，极强分析能力：
      在牛津物理系接受系统训练，能够高效处理与分析数据，提炼关键趋势，并熟练使
      用 Python、Matlab 等工具。
       流利外语能力：
      在求学期间曾多次撰写英文报告和进行学术演讲， 无障碍阅读英文专利和技术论文。
       好奇心、独立思考：
      主动跨越量子材料、半导体器件与光学等领域，可以持续发表独立见解和创新点并
      广受导师好评。
       深耕技术领域：
      熟悉传统半导体器件在不同领域的应用和痛点（如消费电子、新能源）与新型半导
      体器件（如铁电半导体、钙钛矿）的制造流程、应用场景与痛点。
      在大学期间，我的多次跨领域、跨机构的科研与实习经历为我提供了“科研人的开
      发者＋投资人的使用者”这一双重视角，能够让我在科研与投资之间架起桥梁。若有幸
      加入贵机构，我将继续深耕前沿技术，用专业洞察为团队创造价值，并在实践中快速成
      长。
      感谢您的审阅，期待与您进一步交流！
      顺颂商祺
      董子毓

      保证语言简洁明了。根据职位要求改变语言。
    `;

    const messages = [
      {
        role: "system" as const,
        content:
          "You are an expert career coach and professional email writer. Create personalized, compelling job application emails that highlight the candidate's strengths and match them to the job requirements. Use proper email etiquette and formatting. 保证语言简洁明了。根据职位要求改变语言。",
      },
      {
        role: "user" as const,
        content: prompt,
      },
    ];

    const content = await this.makeRequest(messages, 2000, 0.7);
    const parsed = JSON.parse(content);
    return {
      subject: parsed.subject || "Job Application",
      body: parsed.body || "",
      keypoints: parsed.keypoints || [],
      tone: options?.tone || "professional"
    };
  }

  // Streaming version for gradual text rendering
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
      请帮我写一份简单的投递简历邮件。从简历中挑选与一下岗位相关的过往经历，突出强调，保证语言简洁明了。根据职位要求改变语言。

      这是我想要投递的岗位信息：
      职位: ${jobPosting.title}
      公司: ${jobPosting.company_name}
      描述: ${jobPosting.description}
      ${jobPosting.requirements ? `要求: ${jobPosting.requirements}` : ''}

      这是我的简历信息：
      姓名: ${resumeContent.contact.name || 'N/A'}
      邮箱: ${resumeContent.contact.email || 'N/A'}
      技能: ${resumeContent.skills.join(', ')}
      工作经历: ${resumeContent.experience.map(exp => `${exp.title} at ${exp.company} - ${exp.description}`).join('; ')}
      教育背景: ${resumeContent.education.map(edu => `${edu.degree} from ${edu.school}`).join('; ')}
      
      附加指示: ${options?.customInstructions || ''}

      请直接返回邮件内容，不要JSON格式。保证语言简洁明了。根据职位要求改变语言。
    `;

    const messages = [
      {
        role: "system" as const,
        content: "You are an expert career coach and professional email writer. Create personalized, compelling job application emails that highlight the candidate's strengths and match them to the job requirements. Return the email content directly without JSON formatting. 保证语言简洁明了。根据职位要求改变语言。",
      },
      {
        role: "user" as const,
        content: prompt,
      },
    ];

    yield* this.makeStreamingRequest(messages, 2000, 0.7);
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

    const content = await this.makeRequest(messages, 1500, 0.6);
    return JSON.parse(content);
  }
}
