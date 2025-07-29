#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
mailSender.py
-------------------------------------------------------------
Reads matched_companies.csv and sends the resume PDF to each
company's HR e-mail via Outlook SMTP.  Credentials are taken
from .env (OUTLOOK_EMAIL / OUTLOOK_PASSWORD) or prompted.
Uses Qwen2.5 model to generate personalized cover letters and subjects.
Supports caching and HR email from Excel file.
-------------------------------------------------------------
"""

import os, smtplib, pandas as pd, glob
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication
from getpass import getpass
# from dotenv import load_dotenv
from .coverLetterGenerator import generate_cover_letter_and_subject, get_company_info

# ---------- Paths & SMTP ----------
PDF_PATH   = r"CV/CV_LIU Siyuan_25_1.pdf"
MATCHED_DIR = r"matched_companies"
SMTP_HOST  = "smtp-mail.outlook.com"
SMTP_PORT  = 587

# Cover letter settings
APPLICANT_NAME = "LIU Siyuan"
CV_FILENAME = "CV_LIU Siyuan_25_1.pdf"
COVER_LETTER_MODE = "professional"  # professional or enthusiastic
FORCE_REGENERATE = False  # 是否强制重新生成cover letter

# Load .env from input directory
    # load_dotenv("input/.env")

def find_matched_companies_file():
    """查找匹配结果文件"""
    if not os.path.exists(MATCHED_DIR):
        return None
    
    # 查找所有CSV文件
    csv_files = glob.glob(os.path.join(MATCHED_DIR, "*.csv"))
    if not csv_files:
        return None
    
    # 优先选择包含当前申请人姓名的文件
    for csv_file in csv_files:
        if APPLICANT_NAME.replace(" ", "_") in os.path.basename(csv_file):
            return csv_file
    
    # 如果没有找到特定文件，返回第一个
    return csv_files[0]

def send_single_email(to_email, company_name, cover_letter, subject, employee_name, progress_callback=None):
    """发送单封邮件
    
    Args:
        to_email: 收件人邮箱
        company_name: 公司名称
        cover_letter: Cover Letter内容
        subject: 邮件主题
        employee_name: 员工姓名
        progress_callback: 进度回调函数
    
    Returns:
        bool: 是否发送成功
    """
    try:
        if progress_callback:
            progress_callback("正在配置邮件设置...", "初始化SMTP连接")
        
        # 获取邮件配置
        sender = os.getenv("OUTLOOK_EMAIL") or input("Outlook e-mail: ").strip()
        password = os.getenv("OUTLOOK_PASSWORD") or getpass("Outlook password: ")
        
        if progress_callback:
            progress_callback("正在连接邮件服务器...", "连接到Outlook SMTP服务器")
        
        # 连接SMTP
        smtp = smtplib.SMTP(SMTP_HOST, SMTP_PORT)
        smtp.starttls()
        smtp.login(sender, password)
        
        if progress_callback:
            progress_callback("正在准备邮件内容...", "创建邮件和附件")
        
        # 加载简历PDF
        with open(PDF_PATH, "rb") as f:
            pdf_bytes = f.read()
        
        # 创建邮件
        msg = MIMEMultipart()
        msg["From"] = sender
        msg["To"] = to_email
        msg["Subject"] = subject
        
        # 添加邮件正文
        msg.attach(MIMEText(cover_letter, "plain"))
        
        # 添加简历附件
        attach = MIMEApplication(pdf_bytes, Name=os.path.basename(PDF_PATH))
        attach["Content-Disposition"] = f'attachment; filename="{os.path.basename(PDF_PATH)}"'
        msg.attach(attach)
        
        if progress_callback:
            progress_callback("正在发送邮件...", f"发送到 {company_name}")
        
        # 发送邮件
        smtp.sendmail(sender, to_email, msg.as_string())
        smtp.quit()
        
        if progress_callback:
            progress_callback("邮件发送完成", f"成功发送到 {company_name}")
        
        print(f"✓ 成功发送邮件到 {company_name} ({to_email})")
        return True
        
    except Exception as e:
        print(f"✗ 发送邮件到 {company_name} 失败: {e}")
        return False

def send_emails_to_matched_companies():
    """发送邮件给匹配的公司"""
    # ---------- 1. Load matched companies ----------
    csv_file = find_matched_companies_file()
    if not csv_file:
        print(f"⚠️  在 {MATCHED_DIR} 目录中未找到匹配结果文件。请先运行公司匹配。")
        print("可用的匹配结果文件:")
        if os.path.exists(MATCHED_DIR):
            for f in os.listdir(MATCHED_DIR):
                if f.endswith('.csv'):
                    print(f"  - {f}")
        return

    print(f"📋 使用匹配结果文件: {csv_file}")

    df = pd.read_csv(csv_file)
    if df.empty:
        print("⚠️  匹配结果文件为空。")
        return

    # ---------- 2. Outlook credentials ----------
    sender   = os.getenv("OUTLOOK_EMAIL")    or input("Outlook e-mail: ").strip()
    password = os.getenv("OUTLOOK_PASSWORD") or getpass("Outlook password: ")

    # ---------- 3. Connect SMTP ----------
    try:
        smtp = smtplib.SMTP(SMTP_HOST, SMTP_PORT)
        smtp.starttls()
        smtp.login(sender, password)
        print("✓ SMTP连接成功")
    except Exception as e:
        print("SMTP login error:", e)
        return

    # ---------- 4. Load resume once ----------
    with open(PDF_PATH, "rb") as f:
        pdf_bytes = f.read()

    # ---------- 5. Send to each HR ----------
    print(f"\n🚀 开始发送邮件，使用 {COVER_LETTER_MODE} 模式的cover letter和AI生成的邮件主题...")
    if FORCE_REGENERATE:
        print("⚠️  强制重新生成模式已启用")
    print("="*60)

    success_count = 0
    skip_count = 0

    for idx, row in df.iterrows():
        company = row.iloc[0]        # first column is company name
        
        # 获取公司信息（包括hr邮箱）
        company_info = get_company_info(company)
        company_description = company_info.get("description", "")
        company_requirements = company_info.get("requirements", "")
        hr_mail = company_info.get("hr_email", "")
        
        # 如果没有hr邮箱，尝试从CSV的第二列获取
        if not hr_mail and len(row) > 1:
            hr_mail = str(row.iloc[1]).strip()
        
        if not hr_mail:
            print(f"⚠️  {company} 没有HR邮箱，跳过")
            skip_count += 1
            continue
        
        print(f"\n📧 处理第 {idx+1}/{len(df)} 家公司: {company}")
        print(f"   HR邮箱: {hr_mail}")
        
        # 生成个性化的cover letter和邮件主题
        print(f"▶ 为 {company} 生成cover letter和邮件主题...")
        cover_letter, subject = generate_cover_letter_and_subject(
            applicant_name=APPLICANT_NAME,
            cv_filename=CV_FILENAME,
            company_name=company,
            company_description=company_description,
            company_requirements=company_requirements,
            mode=COVER_LETTER_MODE,
            force_regenerate=FORCE_REGENERATE
        )
        
        if not cover_letter:
            print(f"⚠️  无法为 {company} 生成cover letter，使用默认模板")
            # 根据公司语言选择默认模板
            if any('\u4e00' <= char <= '\u9fff' for char in company):
                # 中文公司
                cover_letter = (f"尊敬的{company} HR：\n\n"
                               "请查收附件中的简历，申请贵公司的实习项目。\n\n"
                               "此致\n敬礼\nLIU Siyuan")
            else:
                # 英文公司
                cover_letter = (f"Dear {company} HR,\n\n"
                               "Please find my resume attached for your internship program.\n\n"
                               "Best regards,\nLIU Siyuan")
            subject = f"Internship Application – {company}"
        
        # 创建邮件
        msg = MIMEMultipart()
        msg["From"], msg["To"] = sender, hr_mail
        msg["Subject"] = subject

        msg.attach(MIMEText(cover_letter, "plain"))

        attach = MIMEApplication(pdf_bytes, Name=os.path.basename(PDF_PATH))
        attach["Content-Disposition"] = f'attachment; filename="{os.path.basename(PDF_PATH)}"'
        msg.attach(attach)

        try:
            smtp.sendmail(sender, hr_mail, msg.as_string())
            print(f"✓ 成功发送到 {company} ({hr_mail})")
            print(f"  邮件主题: {subject}")
            print(f"  Cover letter长度: {len(cover_letter)} 字符")
            success_count += 1
        except Exception as e:
            print(f"✗ 发送到 {company} 失败: {e}")

    smtp.quit()
    print(f"\n{'='*60}")
    print("🎉 所有邮件处理完成！")
    print(f"总计处理: {len(df)} 家公司")
    print(f"成功发送: {success_count} 封邮件")
    print(f"跳过: {skip_count} 家公司（无HR邮箱）")
    print(f"Cover letter模式: {COVER_LETTER_MODE}")
    print(f"强制重新生成: {'是' if FORCE_REGENERATE else '否'}")
    print(f"邮件主题: AI生成")
    print(f"HR邮箱来源: Excel文件优先")
    print(f"{'='*60}")

# 只有在直接运行此文件时才执行邮件发送
if __name__ == "__main__":
    send_emails_to_matched_companies() 