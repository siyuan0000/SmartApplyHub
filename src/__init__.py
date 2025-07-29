# -*- coding: utf-8 -*-
"""
EmailSender Package
-------------------------------------------------------------
AI-powered email sending system with personalized cover letter generation
-------------------------------------------------------------
"""

__version__ = "2.0.0"
__author__ = "LIU Siyuan"
__description__ = "AI-powered email sending system with personalized cover letter generation"

# 只导入必要的函数，避免自动执行
from .mailSender import send_emails_to_matched_companies, find_matched_companies_file
from .companyMatch import run_company_match, process_employee
from .coverLetterGenerator import generate_cover_letter_and_subject, get_company_info 