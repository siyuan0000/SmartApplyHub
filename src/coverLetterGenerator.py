#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
coverLetterGenerator.py
-------------------------------------------------------------
使用Qwen2.5模型生成个性化的cover letter和邮件主题
参考LSE CV指南的最佳实践
支持JSON存储和查询功能
-------------------------------------------------------------
"""

import os
import json
import torch
import pdfplumber
import pandas as pd
import re
from datetime import datetime
from transformers import AutoTokenizer, AutoModelForCausalLM

# ---------- 常量 ----------
MODEL_DIR = r"Qwen2.5-1.5B-Instruct"
CONFIG_PATH = r"input/cover_letter_config.json"
CV_DIR = r"CV"
EXCEL_PATH = r"input/companyInfo.xlsx"
COVER_LETTER_CACHE_DIR = r"cover_letters_cache"

def ensure_cache_directory():
    """确保缓存目录存在"""
    if not os.path.exists(COVER_LETTER_CACHE_DIR):
        os.makedirs(COVER_LETTER_CACHE_DIR)
        print(f"✓ 创建缓存目录: {COVER_LETTER_CACHE_DIR}")

def get_cache_file_path(applicant_name: str) -> str:
    """获取缓存文件路径"""
    ensure_cache_directory()
    safe_name = re.sub(r'[^\w\s-]', '_', applicant_name)
    return os.path.join(COVER_LETTER_CACHE_DIR, f"{safe_name}_cover_letters.json")

def load_cached_cover_letters(applicant_name: str) -> dict:
    """加载缓存的cover letters"""
    cache_file = get_cache_file_path(applicant_name)
    if os.path.exists(cache_file):
        try:
            with open(cache_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            print(f"✓ 加载缓存文件: {cache_file}")
            return data
        except Exception as e:
            print(f"⚠️  加载缓存文件失败: {e}")
    return {}

def save_cover_letter_to_cache(applicant_name: str, company_name: str, cover_letter: str, 
                              subject: str, mode: str, cv_filename: str):
    """保存cover letter到缓存"""
    cache_file = get_cache_file_path(applicant_name)
    
    # 加载现有缓存
    cache_data = load_cached_cover_letters(applicant_name)
    
    # 创建新的cover letter记录
    cover_letter_record = {
        "company_name": company_name,
        "cover_letter": cover_letter,
        "subject": subject,
        "mode": mode,
        "cv_filename": cv_filename,
        "generated_at": datetime.now().isoformat(),
        "language": detect_company_language(company_name)
    }
    
    # 更新缓存
    cache_data[company_name] = cover_letter_record
    
    # 保存到文件
    try:
        with open(cache_file, 'w', encoding='utf-8') as f:
            json.dump(cache_data, f, ensure_ascii=False, indent=2)
        print(f"✓ 保存cover letter到缓存: {company_name}")
    except Exception as e:
        print(f"❌ 保存缓存失败: {e}")

def get_cached_cover_letter(applicant_name: str, company_name: str) -> tuple:
    """
    获取缓存的cover letter
    
    Returns:
        tuple: (cover_letter, subject, mode, cv_filename) 或 (None, None, None, None)
    """
    cache_data = load_cached_cover_letters(applicant_name)
    
    if company_name in cache_data:
        record = cache_data[company_name]
        print(f"✓ 找到缓存的cover letter: {company_name}")
        print(f"  生成时间: {record['generated_at']}")
        print(f"  模式: {record['mode']}")
        return (
            record["cover_letter"],
            record["subject"],
            record["mode"],
            record["cv_filename"]
        )
    
    return None, None, None, None

def detect_company_language(company_name: str) -> str:
    """
    根据公司名字检测应该使用的语言
    
    Args:
        company_name: 公司名称
    
    Returns:
        str: 'chinese' 或 'english'
    """
    # 检查是否包含中文字符
    if re.search(r'[\u4e00-\u9fff]', company_name):
        return 'chinese'
    else:
        return 'english'

def get_language_specific_prompt(company_name: str, mode: str) -> dict:
    """
    根据公司语言和模式获取相应的prompt配置
    
    Args:
        company_name: 公司名称
        mode: 模式 (professional/enthusiastic)
    
    Returns:
        dict: 包含system_prompt, user_prompt_template, subject_prompt_template的配置
    """
    language = detect_company_language(company_name)
    
    if language == 'chinese':
        if mode == 'professional':
            return {
                "system_prompt": "你是一位专业的求职顾问，擅长撰写高质量的cover letter。你需要根据候选人的简历和公司信息，生成个性化的求职信。请参考LSE CV指南的最佳实践，确保信件专业、有针对性且突出候选人的优势。生成的内容应该是简洁的邮件正文，不要包含地址、日期等格式信息。",
                "user_prompt_template": "候选人简历内容：\n{resume_content}\n\n目标公司：{company_name}\n公司简介：{company_description}\n公司要求：{company_requirements}\n\n请为{applicant_name}生成一封专业的cover letter邮件正文。要求：\n1. 开头要个性化，提到公司名称\n2. 突出候选人与公司要求的匹配点\n3. 语言专业、简洁、有说服力\n4. 结尾要表达对机会的期待\n5. 控制在200-300字左右\n6. 不要包含地址、日期等格式信息，直接输出邮件正文内容\n7. 使用中文撰写\n\n请直接输出cover letter内容，不要包含任何说明文字。",
                "subject_prompt_template": "候选人简历内容：\n{resume_content}\n\n目标公司：{company_name}\n公司简介：{company_description}\n公司要求：{company_requirements}\n\n请为{applicant_name}生成一个专业的邮件主题行。要求：\n1. 简洁明了，不超过50个字符\n2. 包含公司名称\n3. 体现求职意向\n4. 专业正式\n5. 不要包含特殊字符\n6. 使用中文\n\n请直接输出主题行，不要包含任何说明文字。"
            }
        else:  # enthusiastic
            return {
                "system_prompt": "你是一位充满激情的求职顾问，擅长撰写富有感染力的cover letter。你需要根据候选人的简历和公司信息，生成个性化的求职信。请参考LSE CV指南，同时让语言更加积极、热情，展现候选人的学习热情和成长潜力。生成的内容应该是简洁的邮件正文，不要包含地址、日期等格式信息。",
                "user_prompt_template": "候选人简历内容：\n{resume_content}\n\n目标公司：{company_name}\n公司简介：{company_description}\n公司要求：{company_requirements}\n\n请为{applicant_name}生成一封热情积极的cover letter邮件正文。要求：\n1. 展现对公司的热情和兴趣\n2. 突出候选人的学习能力和成长潜力\n3. 语言积极、有感染力\n4. 表达对实习机会的强烈期待\n5. 控制在200-300字左右\n6. 不要包含地址、日期等格式信息，直接输出邮件正文内容\n7. 使用中文撰写\n\n请直接输出cover letter内容，不要包含任何说明文字。",
                "subject_prompt_template": "候选人简历内容：\n{resume_content}\n\n目标公司：{company_name}\n公司简介：{company_description}\n公司要求：{company_requirements}\n\n请为{applicant_name}生成一个热情积极的邮件主题行。要求：\n1. 简洁明了，不超过50个字符\n2. 包含公司名称\n3. 体现热情和期待\n4. 积极正面\n5. 不要包含特殊字符\n6. 使用中文\n\n请直接输出主题行，不要包含任何说明文字。"
            }
    else:  # english
        if mode == 'professional':
            return {
                "system_prompt": "You are a professional career advisor, skilled in writing high-quality cover letters. You need to generate personalized cover letters based on the candidate's resume and company information. Please refer to LSE CV guidelines best practices to ensure the letter is professional, targeted, and highlights the candidate's strengths. The generated content should be concise email body text, without address, date, or other formatting information.",
                "user_prompt_template": "Candidate Resume Content:\n{resume_content}\n\nTarget Company: {company_name}\nCompany Description: {company_description}\nCompany Requirements: {company_requirements}\n\nPlease generate a professional cover letter email body for {applicant_name}. Requirements:\n1. Start with personalization, mentioning the company name\n2. Highlight the match between candidate and company requirements\n3. Professional, concise, and persuasive language\n4. End with expression of interest in the opportunity\n5. Keep within 200-300 words\n6. Do not include address, date, or other formatting information\n7. Write in English\n\nPlease output the cover letter content directly, without any explanatory text.",
                "subject_prompt_template": "Candidate Resume Content:\n{resume_content}\n\nTarget Company: {company_name}\nCompany Description: {company_description}\nCompany Requirements: {company_requirements}\n\nPlease generate a professional email subject line for {applicant_name}. Requirements:\n1. Concise and clear, no more than 50 characters\n2. Include company name\n3. Reflect job application intent\n4. Professional and formal\n5. No special characters\n6. Write in English\n\nPlease output the subject line directly, without any explanatory text."
            }
        else:  # enthusiastic
            return {
                "system_prompt": "You are an enthusiastic career advisor, skilled in writing compelling cover letters. You need to generate personalized cover letters based on the candidate's resume and company information. Please refer to LSE CV guidelines while making the language more positive and enthusiastic, showcasing the candidate's learning enthusiasm and growth potential. The generated content should be concise email body text, without address, date, or other formatting information.",
                "user_prompt_template": "Candidate Resume Content:\n{resume_content}\n\nTarget Company: {company_name}\nCompany Description: {company_description}\nCompany Requirements: {company_requirements}\n\nPlease generate an enthusiastic and positive cover letter email body for {applicant_name}. Requirements:\n1. Show enthusiasm and interest in the company\n2. Highlight the candidate's learning ability and growth potential\n3. Positive and engaging language\n4. Express strong anticipation for the internship opportunity\n5. Keep within 200-300 words\n6. Do not include address, date, or other formatting information\n7. Write in English\n\nPlease output the cover letter content directly, without any explanatory text.",
                "subject_prompt_template": "Candidate Resume Content:\n{resume_content}\n\nTarget Company: {company_name}\nCompany Description: {company_description}\nCompany Requirements: {company_requirements}\n\nPlease generate an enthusiastic and positive email subject line for {applicant_name}. Requirements:\n1. Concise and clear, no more than 50 characters\n2. Include company name\n3. Reflect enthusiasm and anticipation\n4. Positive and upbeat\n5. No special characters\n6. Write in English\n\nPlease output the subject line directly, without any explanatory text."
            }

def clean_cover_letter_content(content: str) -> str:
    """
    清理cover letter内容，移除Subject行和其他不需要的内容
    
    Args:
        content: 原始cover letter内容
    
    Returns:
        str: 清理后的内容
    """
    if not content:
        return content
    
    lines = content.split('\n')
    cleaned_lines = []
    
    for line in lines:
        # 跳过Subject行（各种可能的格式）
        if re.match(r'^[Ss]ubject\s*:', line.strip()):
            continue
        if re.match(r'^主题\s*:', line.strip()):
            continue
        if re.match(r'^邮件主题\s*:', line.strip()):
            continue
        
        # 跳过空行（如果前面已经有内容）
        if not line.strip() and cleaned_lines:
            continue
            
        cleaned_lines.append(line)
    
    # 重新组合并清理
    cleaned_content = '\n'.join(cleaned_lines).strip()
    
    # 移除开头和结尾的多余空行
    cleaned_content = re.sub(r'^\s*\n+', '', cleaned_content)
    cleaned_content = re.sub(r'\n+\s*$', '', cleaned_content)
    
    return cleaned_content

def load_cover_letter_config():
    """加载cover letter配置文件"""
    try:
        with open(CONFIG_PATH, 'r', encoding='utf-8') as f:
            config = json.load(f)
        print(f"✓ 加载cover letter配置: {CONFIG_PATH}")
        return config
    except FileNotFoundError:
        print(f"⚠️  配置文件不存在: {CONFIG_PATH}")
        return None
    except json.JSONDecodeError as e:
        print(f"❌ 配置文件格式错误: {e}")
        return None

def get_cover_letter_mode(config, mode_name=None):
    """获取cover letter模式配置"""
    if not config:
        # 默认配置
        return {
            "name": "默认模式",
            "system_prompt": "你是一位专业的求职顾问，擅长撰写高质量的cover letter。",
            "user_prompt_template": "候选人简历内容：\n{resume_content}\n\n目标公司：{company_name}\n公司简介：{company_description}\n公司要求：{company_requirements}\n\n请为{applicant_name}生成一封专业的cover letter。",
            "subject_prompt_template": "候选人简历内容：\n{resume_content}\n\n目标公司：{company_name}\n公司简介：{company_description}\n公司要求：{company_requirements}\n\n请为{applicant_name}生成一个专业的邮件主题行。"
        }
    
    if mode_name and mode_name in config["cover_letter_modes"]:
        return config["cover_letter_modes"][mode_name]
    else:
        default_mode = config.get("default_mode", "professional")
        return config["cover_letter_modes"][default_mode]

def extract_pdf_text(path: str) -> str:
    """提取PDF文本"""
    text = []
    try:
        with pdfplumber.open(path) as pdf:
            for p in pdf.pages:
                t = p.extract_text() or ""
                text.append(t)
        return "\n".join(text)
    except Exception as e:
        print(f"⚠️  提取PDF文本失败: {e}")
        return ""

def chat(model, tok, messages, max_new=512):
    """Qwen模型对话包装器"""
    prompt = tok.apply_chat_template(messages, tokenize=False,
                                     add_generation_prompt=True)
    inputs = tok([prompt], return_tensors="pt").to(model.device)
    with torch.no_grad():
        ids = model.generate(**inputs, max_new_tokens=max_new)
    reply_ids = ids[0][inputs.input_ids.shape[1]:]
    return tok.decode(reply_ids, skip_special_tokens=True).strip()

def parse_subject_output(raw_output: str) -> str:
    """
    解析和处理模型生成的subject输出
    
    Args:
        raw_output: 模型原始输出
    
    Returns:
        str: 处理后的subject
    """
    if not raw_output:
        return "Internship Application"
    
    # 清理输出
    subject = raw_output.strip()
    
    # 移除可能的引号
    subject = re.sub(r'^["\']|["\']$', '', subject)
    
    # 移除可能的"Subject:"前缀
    subject = re.sub(r'^[Ss]ubject\s*:\s*', '', subject)
    
    # 移除换行符和多余空格
    subject = re.sub(r'\s+', ' ', subject)
    
    # 限制长度（邮件主题通常不超过50个字符）
    if len(subject) > 50:
        subject = subject[:47] + "..."
    
    # 移除特殊字符（保留中文、英文、数字、空格、连字符、括号）
    subject = re.sub(r'[^\w\s\-\(\)（）\u4e00-\u9fff]', '', subject)
    
    # 确保不为空
    if not subject.strip():
        return "Internship Application"
    
    return subject.strip()

def generate_email_subject(applicant_name, cv_filename, company_name, company_description, company_requirements, mode="professional", model=None, tok=None):
    """
    生成个性化的邮件主题
    
    Args:
        applicant_name: 申请人姓名
        cv_filename: CV文件名
        company_name: 公司名称
        company_description: 公司简介
        company_requirements: 公司要求
        mode: 模式 (professional/enthusiastic)
        model: 已加载的模型（可选）
        tok: 已加载的tokenizer（可选）
    
    Returns:
        str: 生成的邮件主题
    """
    print(f"📝 为 {applicant_name} 生成 {company_name} 的邮件主题...")
    
    # 获取语言特定的prompt配置
    prompt_config = get_language_specific_prompt(company_name, mode)
    
    # 检查是否有subject模板
    if "subject_prompt_template" not in prompt_config:
        print("⚠️  配置中缺少subject模板，使用默认主题")
        return f"Internship Application – {company_name}"
    
    # 提取简历内容
    cv_path = os.path.join(CV_DIR, cv_filename)
    if not os.path.exists(cv_path):
        print(f"⚠️  CV文件不存在: {cv_path}")
        return f"Internship Application – {company_name}"
    
    resume_content = extract_pdf_text(cv_path)
    if not resume_content:
        print("⚠️  无法提取简历内容")
        return f"Internship Application – {company_name}"
    
    # 加载模型（如果未提供）
    should_load_model = model is None or tok is None
    if should_load_model:
        print("▶ 加载Qwen模型...")
        try:
            tok = AutoTokenizer.from_pretrained(
                MODEL_DIR, trust_remote_code=True, local_files_only=True)
            model = AutoModelForCausalLM.from_pretrained(
                MODEL_DIR, trust_remote_code=True, local_files_only=True,
                device_map="auto", torch_dtype="auto").eval()
        except Exception as e:
            print(f"❌ 模型加载失败: {e}")
            return f"Internship Application – {company_name}"
    
    # 生成subject
    print("▶ 生成邮件主题...")
    sys_msg = {"role": "system", "content": prompt_config["system_prompt"]}
    
    # 使用模板生成用户消息
    user_content = prompt_config["subject_prompt_template"].format(
        resume_content=resume_content,
        company_name=company_name,
        company_description=company_description,
        company_requirements=company_requirements,
        applicant_name=applicant_name
    )
    usr_msg = {"role": "user", "content": user_content}
    
    try:
        raw_subject = chat(model, tok, [sys_msg, usr_msg], max_new=128)
        subject = parse_subject_output(raw_subject)
        print(f"✓ 邮件主题生成完成: {subject}")
        return subject
    except Exception as e:
        print(f"❌ 邮件主题生成失败: {e}")
        return f"Internship Application – {company_name}"

def generate_cover_letter(applicant_name, cv_filename, company_name, company_description, company_requirements, mode="professional"):
    """
    生成个性化的cover letter
    
    Args:
        applicant_name: 申请人姓名
        cv_filename: CV文件名
        company_name: 公司名称
        company_description: 公司简介
        company_requirements: 公司要求
        mode: cover letter模式 (professional/enthusiastic)
    
    Returns:
        str: 生成的cover letter内容
    """
    print(f"🎯 为 {applicant_name} 生成 {company_name} 的cover letter...")
    
    # 获取语言特定的prompt配置
    prompt_config = get_language_specific_prompt(company_name, mode)
    
    # 提取简历内容
    cv_path = os.path.join(CV_DIR, cv_filename)
    if not os.path.exists(cv_path):
        print(f"⚠️  CV文件不存在: {cv_path}")
        return None
    
    resume_content = extract_pdf_text(cv_path)
    if not resume_content:
        print("⚠️  无法提取简历内容")
        return None
    
    # 加载模型
    print("▶ 加载Qwen模型...")
    try:
        tok = AutoTokenizer.from_pretrained(
            MODEL_DIR, trust_remote_code=True, local_files_only=True)
        model = AutoModelForCausalLM.from_pretrained(
            MODEL_DIR, trust_remote_code=True, local_files_only=True,
            device_map="auto", torch_dtype="auto").eval()
    except Exception as e:
        print(f"❌ 模型加载失败: {e}")
        return None
    
    # 生成cover letter
    print("▶ 生成cover letter...")
    sys_msg = {"role": "system", "content": prompt_config["system_prompt"]}
    
    # 使用模板生成用户消息
    user_content = prompt_config["user_prompt_template"].format(
        resume_content=resume_content,
        company_name=company_name,
        company_description=company_description,
        company_requirements=company_requirements,
        applicant_name=applicant_name
    )
    usr_msg = {"role": "user", "content": user_content}
    
    try:
        raw_cover_letter = chat(model, tok, [sys_msg, usr_msg], max_new=512)
        # 清理cover letter内容
        cover_letter = clean_cover_letter_content(raw_cover_letter)
        print(f"✓ Cover letter生成完成")
        return cover_letter
    except Exception as e:
        print(f"❌ Cover letter生成失败: {e}")
        return None

def generate_cover_letter_and_subject(applicant_name, cv_filename, company_name, company_description, company_requirements, mode="professional", force_regenerate=False):
    """
    同时生成cover letter和邮件主题（支持缓存和重新生成）
    
    Args:
        applicant_name: 申请人姓名
        cv_filename: CV文件名
        company_name: 公司名称
        company_description: 公司简介
        company_requirements: 公司要求
        mode: 模式 (professional/enthusiastic)
        force_regenerate: 是否强制重新生成（忽略缓存）
    
    Returns:
        tuple: (cover_letter, subject)
    """
    print(f"🎯 为 {applicant_name} 处理 {company_name} 的cover letter和邮件主题...")
    
    # 检查缓存（除非强制重新生成）
    if not force_regenerate:
        cached_letter, cached_subject, cached_mode, cached_cv = get_cached_cover_letter(applicant_name, company_name)
        
        # 如果缓存存在且CV文件相同，直接返回缓存结果
        if cached_letter and cached_cv == cv_filename:
            print(f"✓ 使用缓存的cover letter (模式: {cached_mode})")
            return cached_letter, cached_subject
    
    # 需要重新生成
    print(f"▶ 重新生成cover letter (模式: {mode})...")
    
    # 获取语言特定的prompt配置
    prompt_config = get_language_specific_prompt(company_name, mode)
    
    # 提取简历内容
    cv_path = os.path.join(CV_DIR, cv_filename)
    if not os.path.exists(cv_path):
        print(f"⚠️  CV文件不存在: {cv_path}")
        return None, f"Internship Application – {company_name}"
    
    resume_content = extract_pdf_text(cv_path)
    if not resume_content:
        print("⚠️  无法提取简历内容")
        return None, f"Internship Application – {company_name}"
    
    # 加载模型（只加载一次）
    print("▶ 加载Qwen模型...")
    try:
        tok = AutoTokenizer.from_pretrained(
            MODEL_DIR, trust_remote_code=True, local_files_only=True)
        model = AutoModelForCausalLM.from_pretrained(
            MODEL_DIR, trust_remote_code=True, local_files_only=True,
            device_map="auto", torch_dtype="auto").eval()
    except Exception as e:
        print(f"❌ 模型加载失败: {e}")
        return None, f"Internship Application – {company_name}"
    
    # 生成cover letter
    print("▶ 生成cover letter...")
    sys_msg = {"role": "system", "content": prompt_config["system_prompt"]}
    
    user_content = prompt_config["user_prompt_template"].format(
        resume_content=resume_content,
        company_name=company_name,
        company_description=company_description,
        company_requirements=company_requirements,
        applicant_name=applicant_name
    )
    usr_msg = {"role": "user", "content": user_content}
    
    try:
        raw_cover_letter = chat(model, tok, [sys_msg, usr_msg], max_new=512)
        # 清理cover letter内容
        cover_letter = clean_cover_letter_content(raw_cover_letter)
        print(f"✓ Cover letter生成完成")
    except Exception as e:
        print(f"❌ Cover letter生成失败: {e}")
        cover_letter = None
    
    # 生成subject
    subject = generate_email_subject(
        applicant_name, cv_filename, company_name, company_description, 
        company_requirements, mode, model, tok
    )
    
    # 保存到缓存
    if cover_letter:
        save_cover_letter_to_cache(applicant_name, company_name, cover_letter, subject, mode, cv_filename)
    
    return cover_letter, subject

def get_company_info(company_name):
    """从Excel文件获取公司信息"""
    try:
        company_df = pd.read_excel(EXCEL_PATH).fillna("")
        
        # 查找匹配的公司
        for _, row in company_df.iterrows():
            if str(row["公司名称"]).strip() == company_name.strip():
                return {
                    "description": str(row.get("简介", "")),
                    "requirements": str(row.get("要求", "")),
                    "hr_email": str(row.get("hr邮箱", ""))
                }
        
        return {"description": "", "requirements": "", "hr_email": ""}
    except Exception as e:
        print(f"⚠️  获取公司信息失败: {e}")
        return {"description": "", "requirements": "", "hr_email": ""}

def list_cached_cover_letters(applicant_name: str):
    """列出所有缓存的cover letters"""
    cache_data = load_cached_cover_letters(applicant_name)
    
    if not cache_data:
        print(f"📋 {applicant_name} 没有缓存的cover letters")
        return
    
    print(f"📋 {applicant_name} 的缓存cover letters:")
    print("="*60)
    
    for company_name, record in cache_data.items():
        print(f"🏢 公司: {company_name}")
        print(f"   模式: {record['mode']}")
        print(f"   语言: {record['language']}")
        print(f"   生成时间: {record['generated_at']}")
        print(f"   CV文件: {record['cv_filename']}")
        print(f"   邮件主题: {record['subject']}")
        print(f"   Cover letter长度: {len(record['cover_letter'])} 字符")
        print("-" * 40)

def delete_cached_cover_letter(applicant_name: str, company_name: str):
    """删除特定公司的缓存cover letter"""
    cache_file = get_cache_file_path(applicant_name)
    
    if not os.path.exists(cache_file):
        print(f"⚠️  没有找到缓存文件: {cache_file}")
        return
    
    # 加载现有缓存
    cache_data = load_cached_cover_letters(applicant_name)
    
    if company_name in cache_data:
        del cache_data[company_name]
        
        # 保存更新后的缓存
        try:
            with open(cache_file, 'w', encoding='utf-8') as f:
                json.dump(cache_data, f, ensure_ascii=False, indent=2)
            print(f"✓ 删除缓存: {company_name}")
        except Exception as e:
            print(f"❌ 删除缓存失败: {e}")
    else:
        print(f"⚠️  没有找到 {company_name} 的缓存")

def generate_cover_letter_with_custom_template(applicant_name, cv_filename, company_name, company_description, company_requirements, custom_template, force_regenerate=False):
    """
    使用自定义模板生成cover letter和邮件主题
    
    Args:
        applicant_name: 申请人姓名
        cv_filename: CV文件名
        company_name: 公司名称
        company_description: 公司简介
        company_requirements: 公司要求
        custom_template: 自定义模板内容
        force_regenerate: 是否强制重新生成（忽略缓存）
    
    Returns:
        tuple: (cover_letter, subject)
    """
    print(f"🎯 为 {applicant_name} 使用自定义模板处理 {company_name} 的cover letter...")
    
    # 检查缓存（除非强制重新生成）
    if not force_regenerate:
        cached_letter, cached_subject, cached_mode, cached_cv = get_cached_cover_letter(applicant_name, company_name)
        
        # 如果缓存存在且CV文件相同，直接返回缓存结果
        if cached_letter and cached_cv == cv_filename:
            print(f"✓ 使用缓存的cover letter")
            return cached_letter, cached_subject
    
    # 需要重新生成
    print(f"▶ 使用自定义模板生成cover letter...")
    
    # 提取简历内容
    cv_path = os.path.join(CV_DIR, cv_filename)
    if not os.path.exists(cv_path):
        print(f"⚠️  CV文件不存在: {cv_path}")
        return None, f"求职申请 - {applicant_name} - {company_name}"
    
    resume_content = extract_pdf_text(cv_path)
    if not resume_content:
        print("⚠️  无法提取简历内容")
        return None, f"求职申请 - {applicant_name} - {company_name}"
    
    # 加载模型
    print("▶ 加载Qwen模型...")
    try:
        tok = AutoTokenizer.from_pretrained(
            MODEL_DIR, trust_remote_code=True, local_files_only=True)
        model = AutoModelForCausalLM.from_pretrained(
            MODEL_DIR, trust_remote_code=True, local_files_only=True,
            device_map="auto", torch_dtype="auto").eval()
    except Exception as e:
        print(f"❌ 模型加载失败: {e}")
        return None, f"求职申请 - {applicant_name} - {company_name}"
    
    # 构建自定义模板的prompt
    language = detect_company_language(company_name)
    
    if language == 'chinese':
        system_prompt = "你是一位专业的求职顾问，擅长基于用户提供的模板生成个性化的cover letter。你需要根据候选人的简历、公司信息和用户提供的模板，生成个性化的求职信。请保持模板的基本结构和风格，同时针对具体公司进行个性化调整。"
        
        user_prompt = f"""用户提供的模板：
{custom_template}

候选人简历内容：
{resume_content}

目标公司：{company_name}
公司简介：{company_description}
公司要求：{company_requirements}

请基于用户提供的模板，为{applicant_name}生成一封个性化的cover letter。要求：
1. 保持模板的基本结构和风格
2. 将模板中的占位符替换为具体信息
3. 针对目标公司进行个性化调整
4. 确保内容专业、有针对性
5. 控制在200-300字左右
6. 不要包含地址、日期等格式信息，直接输出邮件正文内容

请直接输出cover letter内容，不要包含任何说明文字。"""
        
        subject_prompt = f"""候选人简历内容：
{resume_content}

目标公司：{company_name}
公司简介：{company_description}
公司要求：{company_requirements}

请为{applicant_name}生成一个专业的邮件主题行。要求：
1. 简洁明了，不超过50个字符
2. 包含公司名称
3. 体现求职意向
4. 专业正式
5. 不要包含特殊字符
6. 使用中文

请直接输出主题行，不要包含任何说明文字。"""
    else:
        system_prompt = "You are a professional career advisor, skilled in generating personalized cover letters based on user-provided templates. You need to generate personalized cover letters based on the candidate's resume, company information, and user-provided template. Please maintain the basic structure and style of the template while making personalized adjustments for the specific company."
        
        user_prompt = f"""User-provided template:
{custom_template}

Candidate Resume Content:
{resume_content}

Target Company: {company_name}
Company Description: {company_description}
Company Requirements: {company_requirements}

Please generate a personalized cover letter for {applicant_name} based on the user-provided template. Requirements:
1. Maintain the basic structure and style of the template
2. Replace placeholders in the template with specific information
3. Make personalized adjustments for the target company
4. Ensure professional and targeted content
5. Keep within 200-300 words
6. Do not include address, date, or other formatting information

Please output the cover letter content directly, without any explanatory text."""
        
        subject_prompt = f"""Candidate Resume Content:
{resume_content}

Target Company: {company_name}
Company Description: {company_description}
Company Requirements: {company_requirements}

Please generate a professional email subject line for {applicant_name}. Requirements:
1. Concise and clear, no more than 50 characters
2. Include company name
3. Reflect job application intent
4. Professional and formal
5. No special characters
6. Write in English

Please output the subject line directly, without any explanatory text."""
    
    # 生成cover letter
    print("▶ 生成cover letter...")
    sys_msg = {"role": "system", "content": system_prompt}
    usr_msg = {"role": "user", "content": user_prompt}
    
    try:
        raw_cover_letter = chat(model, tok, [sys_msg, usr_msg], max_new=512)
        # 清理cover letter内容
        cover_letter = clean_cover_letter_content(raw_cover_letter)
        print(f"✓ Cover letter生成完成")
    except Exception as e:
        print(f"❌ Cover letter生成失败: {e}")
        cover_letter = None
    
    # 生成subject
    print("▶ 生成邮件主题...")
    sys_msg_subject = {"role": "system", "content": "You are a professional career advisor, skilled in generating email subject lines for job applications."}
    usr_msg_subject = {"role": "user", "content": subject_prompt}
    
    try:
        raw_subject = chat(model, tok, [sys_msg_subject, usr_msg_subject], max_new=100)
        subject = parse_subject_output(raw_subject)
        print(f"✓ 邮件主题生成完成: {subject}")
    except Exception as e:
        print(f"❌ 邮件主题生成失败: {e}")
        subject = f"求职申请 - {applicant_name} - {company_name}"
    
    # 保存到缓存
    if cover_letter:
        save_cover_letter_to_cache(applicant_name, company_name, cover_letter, subject, "custom", cv_filename)
    
    return cover_letter, subject

def main():
    """测试函数"""
    # 示例用法
    applicant_name = "LIU Siyuan"
    cv_filename = "CV_LIU Siyuan_25_1.pdf"
    company_name = "面壁智能"
    
    company_info = get_company_info(company_name)
    
    # 测试缓存功能
    print("🧪 测试缓存功能...")
    list_cached_cover_letters(applicant_name)
    
    # 测试生成cover letter（会保存到缓存）
    cover_letter, subject = generate_cover_letter_and_subject(
        applicant_name=applicant_name,
        cv_filename=cv_filename,
        company_name=company_name,
        company_description=company_info["description"],
        company_requirements=company_info["requirements"],
        mode="professional"
    )
    
    if cover_letter:
        print("\n" + "="*50)
        print(f"邮件主题: {subject}")
        print("生成的Cover Letter:")
        print("="*50)
        print(cover_letter)
        print("="*50)
    
    # 再次测试（应该使用缓存）
    print("\n🧪 再次测试（应该使用缓存）...")
    cover_letter2, subject2 = generate_cover_letter_and_subject(
        applicant_name=applicant_name,
        cv_filename=cv_filename,
        company_name=company_name,
        company_description=company_info["description"],
        company_requirements=company_info["requirements"],
        mode="professional"
    )
    
    # 强制重新生成
    print("\n🧪 强制重新生成...")
    cover_letter3, subject3 = generate_cover_letter_and_subject(
        applicant_name=applicant_name,
        cv_filename=cv_filename,
        company_name=company_name,
        company_description=company_info["description"],
        company_requirements=company_info["requirements"],
        mode="professional",
        force_regenerate=True
    )

if __name__ == "__main__":
    main() 