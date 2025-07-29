#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
集成GUI界面 - 智能邮件发送系统
-------------------------------------------------------------
管理员界面：员工管理 + Cover Letter模板管理
-------------------------------------------------------------
"""

import tkinter as tk
from tkinter import ttk, messagebox, scrolledtext, filedialog
import threading
import os
import sys
import pandas as pd
import json
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication
from datetime import datetime
import re
# from dotenv import load_dotenv

# 添加项目根目录到路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.companyMatch import run_company_match
from src.coverLetterGenerator import (
    generate_cover_letter_and_subject, 
    generate_cover_letter_with_custom_template,
    get_company_info, 
    list_cached_cover_letters,
    delete_cached_cover_letter
)
from src.company_db import company_db
from src.smart_excel_parser import smart_excel_parser

class IntegratedGUI:
    def __init__(self, root):
        self.root = root
        self.root.title("智能邮件发送系统")
        self.root.geometry("1200x800")
        
        # 初始化属性
        self.companies = []
        self.company_folders = {}  # 添加这个属性
        self.current_folder = None  # 当前选中的文件夹
        
        # 添加缺失的属性定义
        self.EMPLOYEE_FILE = "input/employee.xlsx"
        self.TEMPLATE_FILE = "input/templates.json"
        self.ADMIN_KEY = "admin123"  # 管理员密钥
        self.is_authenticated = False
        
        # 初始化数据存储
        self.employees = []
        self.templates = {}
        self.current_cover_letter = None
        self.current_company = None
        self.current_subject = None
        
        # 设置样式
        style = ttk.Style()
        style.theme_use('clam')
        
        # 创建主界面
        self.create_main_interface()
        
    def create_login_screen(self):
        """创建登录界面"""
        # 清空主窗口
        for widget in self.root.winfo_children():
            widget.destroy()
        
        # 登录框架 - 使用新的背景色
        login_frame = tk.Frame(self.root, bg='#F8F9FA')
        login_frame.pack(expand=True)
        
        # 标题 - 使用新的字体和颜色
        title_label = tk.Label(
            login_frame, 
            text="智能邮件发送系统", 
            font=('-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif', 24, 'bold'),
            bg='#F8F9FA',
            fg='#212529'
        )
        title_label.pack(pady=40)
        
        subtitle_label = tk.Label(
            login_frame, 
            text="管理员登录", 
            font=('-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif', 14),
            bg='#F8F9FA',
            fg='#6C757D'
        )
        subtitle_label.pack(pady=15)
        
        # 登录表单 - 使用新的背景色
        form_frame = tk.Frame(login_frame, bg='#F8F9FA')
        form_frame.pack(pady=40)
        
        # 管理员密钥输入 - 使用新的样式
        tk.Label(form_frame, text="管理员密钥:", 
                font=('-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif', 12), 
                bg='#F8F9FA', fg='#212529').pack(pady=8)
        self.key_var = tk.StringVar()
        key_entry = tk.Entry(form_frame, textvariable=self.key_var, show="*", 
                           font=('-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif', 12), 
                           width=35, relief='flat', bd=1, highlightthickness=1,
                           bg='#FFFFFF', fg='#212529', insertbackground='#7BAFD4',
                           highlightbackground='#DEE2E6', highlightcolor='#7BAFD4')
        key_entry.pack(pady=8)
        key_entry.focus()
        
        # 登录按钮 - 使用新的UNC蓝色
        login_button = tk.Button(
            form_frame,
            text="登录",
            command=self.authenticate,
            font=('-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif', 12, 'bold'),
            bg='#7BAFD4',
            fg='#FFFFFF',
            activebackground='#6395C0',
            activeforeground='#FFFFFF',
            relief='flat',
            bd=0,
            width=25,
            height=2,
            cursor='hand2'
        )
        login_button.pack(pady=25)
        
        # 绑定回车键
        key_entry.bind('<Return>', lambda e: self.authenticate())
        
    def authenticate(self):
        """身份验证"""
        key = self.key_var.get().strip()
        if key == self.ADMIN_KEY:
            self.is_authenticated = True
            messagebox.showinfo("成功", "身份验证成功！")
            self.create_main_interface()
        else:
            messagebox.showerror("错误", "管理员密钥错误！")
            self.key_var.set("")
    
    def create_main_interface(self):
        """创建主界面"""
        # 清空主窗口
        for widget in self.root.winfo_children():
            widget.destroy()
        
        # 主标题栏 - 使用新的颜色
        title_frame = tk.Frame(self.root, bg='#7BAFD4', height=70)
        title_frame.pack(fill='x')
        title_frame.pack_propagate(False)
        
        title_label = tk.Label(
            title_frame, 
            text="智能邮件发送系统 - 管理员界面", 
            font=('-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif', 16, 'bold'),
            bg='#7BAFD4',
            fg='#FFFFFF'
        )
        title_label.pack(side='left', padx=25, pady=20)
        
        # 退出按钮 - 使用新的样式
        logout_button = tk.Button(
            title_frame,
            text="退出登录",
            command=self.logout,
            font=('-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif', 10),
            bg='#dc3545',
            fg='#FFFFFF',
            activebackground='#c82333',
            activeforeground='#FFFFFF',
            relief='flat',
            bd=0,
            cursor='hand2'
        )
        logout_button.pack(side='right', padx=25, pady=20)
        
        # 导航栏 - 使用新的颜色
        nav_frame = tk.Frame(self.root, bg='#FFFFFF', height=60)
        nav_frame.pack(fill='x')
        nav_frame.pack_propagate(False)
        
        # 员工管理按钮 - 使用新的UNC蓝色
        self.employee_btn = tk.Button(
            nav_frame,
            text="员工管理",
            command=self.show_employee_management,
            font=('-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif', 12, 'bold'),
            bg='#7BAFD4',
            fg='#FFFFFF',
            activebackground='#6395C0',
            activeforeground='#FFFFFF',
            relief='flat',
            bd=0,
            width=18,
            height=2,
            cursor='hand2'
        )
        self.employee_btn.pack(side='left', padx=15, pady=10)
        
        # 模板管理按钮 - 使用新的样式
        self.template_btn = tk.Button(
            nav_frame,
            text="Cover Letter模板管理",
            command=self.show_template_management,
            font=('-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif', 12, 'bold'),
            bg='#6C757D',
            fg='#FFFFFF',
            activebackground='#5a6268',
            activeforeground='#FFFFFF',
            relief='flat',
            bd=0,
            width=22,
            height=2,
            cursor='hand2'
        )
        self.template_btn.pack(side='left', padx=15, pady=10)
        
        # 邮件配置管理按钮 - 使用新的样式
        self.email_config_btn = tk.Button(
            nav_frame,
            text="邮件配置管理",
            command=self.show_email_config_management,
            font=('-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif', 12, 'bold'),
            bg='#6C757D',
            fg='#FFFFFF',
            activebackground='#5a6268',
            activeforeground='#FFFFFF',
            relief='flat',
            bd=0,
            width=18,
            height=2,
            cursor='hand2'
        )
        self.email_config_btn.pack(side='left', padx=15, pady=10)
        
        # 新增：公司管理按钮 - 使用新的样式
        self.company_btn = tk.Button(
            nav_frame,
            text="公司管理",
            command=self.show_company_management,
            font=('-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif', 12, 'bold'),
            bg='#6C757D',
            fg='#FFFFFF',
            activebackground='#5a6268',
            activeforeground='#FFFFFF',
            relief='flat',
            bd=0,
            width=18,
            height=2,
            cursor='hand2'
        )
        self.company_btn.pack(side='left', padx=15, pady=10)
        
        # 主内容区域 - 使用新的背景色
        self.main_content = tk.Frame(self.root, bg='#F8F9FA')
        self.main_content.pack(fill='both', expand=True, padx=25, pady=15)
        
        # 加载数据
        self.load_data()
        
        # 默认显示员工管理
        self.show_employee_management()
        
    def load_data(self):
        """加载数据"""
        # 静默加载数据，不显示终端输出
        try:
            self.load_employees()
            self.load_templates()
        except Exception as e:
            # 只在出错时显示错误信息
            print(f"数据加载错误: {str(e)}")
    
    def load_employees(self):
        """加载员工数据"""
        try:
            if os.path.exists(self.EMPLOYEE_FILE):
                df = pd.read_excel(self.EMPLOYEE_FILE)
                
                # 转换现有格式到新格式
                self.employees = []
                for idx, row in df.iterrows():
                    employee = {
                        "姓名": row.get("Name", ""),
                        "简历文件": f"{row.get('CV', '')}.pdf",  # 添加.pdf后缀
                        "实习时长": row.get("Duration", ""),
                        "工作方式": row.get("Remote/Onsite", "")
                    }
                    self.employees.append(employee)
                
                # 静默加载，不显示终端输出
            else:
                # 如果文件不存在，创建空的员工列表
                self.employees = []
                
        except Exception as e:
            # 只在出错时显示错误信息
            print(f"员工数据加载错误: {str(e)}")
            self.employees = []
    
    def load_templates(self):
        """加载模板数据"""
        try:
            if os.path.exists(self.TEMPLATE_FILE):
                with open(self.TEMPLATE_FILE, 'r', encoding='utf-8') as f:
                    self.templates = json.load(f)
                # 静默加载，不显示终端输出
            else:
                # 如果文件不存在，创建默认模板
                self.templates = {
                    "professional": {
                        "name": "专业模板",
                        "content": "尊敬的{company_name}招聘团队：\n\n我是{applicant_name}，非常希望能够加入贵公司的团队。\n\n{company_description}\n\n我相信我的技能和经验能够满足贵公司的要求：\n{company_requirements}\n\n期待您的回复！\n\n此致\n敬礼\n{applicant_name}"
                    },
                    "enthusiastic": {
                        "name": "热情模板", 
                        "content": "亲爱的{company_name}团队：\n\n我是{applicant_name}，对贵公司充满热情！\n\n{company_description}\n\n我迫不及待想要为贵公司贡献我的技能：\n{company_requirements}\n\n让我们携手共创美好未来！\n\n此致\n敬礼\n{applicant_name}"
                    }
                }
                self.save_templates()
                # 静默创建，不显示终端输出
                
        except Exception as e:
            # 只在出错时显示错误信息
            print(f"模板数据加载错误: {str(e)}")
            self.templates = {}
    
    def save_templates(self):
        """保存模板数据"""
        try:
            with open(self.TEMPLATE_FILE, 'w', encoding='utf-8') as f:
                json.dump(self.templates, f, ensure_ascii=False, indent=2)
        except Exception as e:
            messagebox.showerror("错误", f"保存模板数据失败: {str(e)}")
    
    def show_employee_management(self):
        """显示员工管理界面"""
        # 更新按钮状态 - 使用新的颜色
        self.employee_btn.config(bg='#7BAFD4')
        self.template_btn.config(bg='#6C757D')
        self.email_config_btn.config(bg='#6C757D')
        self.company_btn.config(bg='#6C757D')
        
        # 清空主内容区域
        for widget in self.main_content.winfo_children():
            widget.destroy()
        
        # 创建员工管理界面
        self.create_employee_management_interface()
        
    def show_template_management(self):
        """显示模板管理界面"""
        # 更新按钮状态 - 使用新的颜色
        self.employee_btn.config(bg='#6C757D')
        self.template_btn.config(bg='#7BAFD4')
        self.email_config_btn.config(bg='#6C757D')
        self.company_btn.config(bg='#6C757D')
        
        # 清空主内容区域
        for widget in self.main_content.winfo_children():
            widget.destroy()
        
        # 创建模板管理界面
        self.create_template_management_interface()
    
    def show_email_config_management(self):
        """显示邮件配置管理界面"""
        # 更新按钮状态 - 使用新的颜色
        self.employee_btn.config(bg='#6C757D')
        self.template_btn.config(bg='#6C757D')
        self.email_config_btn.config(bg='#7BAFD4')
        self.company_btn.config(bg='#6C757D')
        
        # 确保主界面已经创建
        if not hasattr(self, 'main_content'):
            self.create_main_interface()
            return
        
        # 清空主内容区域
        for widget in self.main_content.winfo_children():
            widget.destroy()
        
        # 创建邮件配置管理界面
        self.create_email_config_management_interface()
    
    def create_employee_management_interface(self):
        """创建员工管理界面"""
        # 左侧员工列表
        left_frame = ttk.LabelFrame(self.main_content, text="员工列表", padding=10)
        left_frame.pack(side='left', fill='y', padx=(0, 10))
        
        # 员工列表（树形视图）
        columns = ("姓名", "简历文件", "实习时长", "工作方式")
        self.employee_tree = ttk.Treeview(left_frame, columns=columns, show="headings", height=20)
        
        self.employee_tree.heading("姓名", text="姓名")
        self.employee_tree.heading("简历文件", text="简历文件")
        self.employee_tree.heading("实习时长", text="实习时长")
        self.employee_tree.heading("工作方式", text="工作方式")
        
        self.employee_tree.column("姓名", width=120)
        self.employee_tree.column("简历文件", width=180)
        self.employee_tree.column("实习时长", width=80)
        self.employee_tree.column("工作方式", width=80)
        
        # 滚动条
        scrollbar = ttk.Scrollbar(left_frame, orient="vertical", command=self.employee_tree.yview)
        self.employee_tree.configure(yscrollcommand=scrollbar.set)
        
        self.employee_tree.pack(side='left', fill='y')
        scrollbar.pack(side='right', fill='y')
        
        # 绑定选择事件
        self.employee_tree.bind("<<TreeviewSelect>>", self.on_employee_select)
        
        # 员工操作按钮
        employee_btn_frame = tk.Frame(left_frame)
        employee_btn_frame.pack(fill='x', pady=10)
        
        add_employee_btn = tk.Button(
            employee_btn_frame,
            text="添加员工",
            command=self.add_employee,
            font=('-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif', 11),
            bg='#7BAFD4',
            fg='#FFFFFF',
            activebackground='#6395C0',
            activeforeground='#FFFFFF',
            relief='flat',
            bd=0,
            cursor='hand2'
        )
        add_employee_btn.pack(fill='x', pady=5)
        
        # 右侧员工详情
        right_frame = ttk.LabelFrame(self.main_content, text="员工详情", padding=10)
        right_frame.pack(side='right', fill='both', expand=True)
        
        # 员工信息显示区域
        self.employee_info_frame = tk.Frame(right_frame)
        self.employee_info_frame.pack(fill='both', expand=True)
        
        # 默认显示
        self.show_employee_info(None)
        
        # 刷新员工列表
        self.refresh_employee_list()
        
    def create_template_management_interface(self):
        """创建模板管理界面"""
        # 左侧模板列表
        left_frame = ttk.LabelFrame(self.main_content, text="模板列表", padding=10)
        left_frame.pack(side='left', fill='y', padx=(0, 10))
        
        # 模板列表
        self.template_listbox = tk.Listbox(left_frame, height=20, width=30)
        template_scrollbar = ttk.Scrollbar(left_frame, orient="vertical", command=self.template_listbox.yview)
        self.template_listbox.configure(yscrollcommand=template_scrollbar.set)
        
        self.template_listbox.pack(side='left', fill='y')
        template_scrollbar.pack(side='right', fill='y')
        
        # 绑定选择事件
        self.template_listbox.bind("<<ListboxSelect>>", self.on_template_select)
        
        # 模板操作按钮
        template_btn_frame = tk.Frame(left_frame)
        template_btn_frame.pack(fill='x', pady=10)
        
        add_template_btn = tk.Button(
            template_btn_frame,
            text="添加模板",
            command=self.add_template,
            font=('-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif', 11),
            bg='#7BAFD4',
            fg='#FFFFFF',
            activebackground='#6395C0',
            activeforeground='#FFFFFF',
            relief='flat',
            bd=0,
            cursor='hand2'
        )
        add_template_btn.pack(side='left', padx=5, pady=5)
        
        delete_template_btn = tk.Button(
            template_btn_frame,
            text="删除模板",
            command=self.delete_template,
            font=('-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif', 11),
            bg='#dc3545',
            fg='#FFFFFF',
            activebackground='#c82333',
            activeforeground='#FFFFFF',
            relief='flat',
            bd=0,
            cursor='hand2'
        )
        delete_template_btn.pack(side='left', padx=5, pady=5)
        
        # 右侧模板编辑区域
        right_frame = ttk.LabelFrame(self.main_content, text="模板编辑", padding=10)
        right_frame.pack(side='right', fill='both', expand=True)
        
        # 模板名称
        ttk.Label(right_frame, text="模板名称:").pack(anchor='w', pady=5)
        self.template_name_var = tk.StringVar()
        template_name_entry = ttk.Entry(right_frame, textvariable=self.template_name_var, width=50)
        template_name_entry.pack(fill='x', pady=5)
        
        # 模板内容
        ttk.Label(right_frame, text="模板内容:").pack(anchor='w', pady=5)
        self.template_content_text = scrolledtext.ScrolledText(
            right_frame,
            height=20,
            wrap='word'
        )
        self.template_content_text.pack(fill='both', expand=True, pady=5)
        
        # 保存按钮 - 使用新的样式
        save_template_btn = tk.Button(
            right_frame,
            text="保存模板",
            command=self.save_template,
            font=('-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif', 11, 'bold'),
            bg='#28a745',
            fg='#FFFFFF',
            activebackground='#218838',
            activeforeground='#FFFFFF',
            relief='flat',
            bd=0,
            cursor='hand2'
        )
        save_template_btn.pack(pady=15)
        
        # 刷新模板列表
        self.refresh_template_list()
        
    def create_email_config_management_interface(self):
        """创建邮件配置管理界面"""
        # 标题 - 使用新的字体和样式
        title_label = ttk.Label(
            self.main_content,
            text="邮件配置管理",
            font=('-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif', 16, 'bold')
        )
        title_label.pack(pady=15)
        
        # 配置框架
        config_frame = ttk.LabelFrame(self.main_content, text="邮件服务器配置", padding=10)
        config_frame.pack(fill='x', padx=10, pady=5)
        
        # SMTP服务器设置
        smtp_frame = ttk.Frame(config_frame)
        smtp_frame.pack(fill='x', pady=5)
        
        ttk.Label(smtp_frame, text="SMTP服务器:").grid(row=0, column=0, sticky='w', padx=5)
        self.smtp_host_var = tk.StringVar(value="smtp-mail.outlook.com")
        ttk.Entry(smtp_frame, textvariable=self.smtp_host_var, width=30).grid(row=0, column=1, padx=5)
        
        ttk.Label(smtp_frame, text="端口:").grid(row=0, column=2, sticky='w', padx=5)
        self.smtp_port_var = tk.StringVar(value="587")
        ttk.Entry(smtp_frame, textvariable=self.smtp_port_var, width=10).grid(row=0, column=3, padx=5)
        
        ttk.Label(smtp_frame, text="使用TLS:").grid(row=0, column=4, sticky='w', padx=5)
        self.use_tls_var = tk.BooleanVar(value=True)
        ttk.Checkbutton(smtp_frame, variable=self.use_tls_var).grid(row=0, column=5, padx=5)
        
        # 邮箱凭据设置
        cred_frame = ttk.LabelFrame(self.main_content, text="邮箱凭据", padding=10)
        cred_frame.pack(fill='x', padx=10, pady=5)
        
        ttk.Label(cred_frame, text="邮箱地址:").pack(anchor='w', pady=2)
        self.email_var = tk.StringVar()
        ttk.Entry(cred_frame, textvariable=self.email_var, width=50).pack(fill='x', pady=2)
        
        ttk.Label(cred_frame, text="应用密码:").pack(anchor='w', pady=2)
        self.password_var = tk.StringVar()
        ttk.Entry(cred_frame, textvariable=self.password_var, show="*", width=50).pack(fill='x', pady=2)
        
        ttk.Label(cred_frame, text="注意：请使用应用密码而不是登录密码，确保邮件发送安全").pack(anchor='w', pady=5)
        
        # 按钮框架
        button_frame = ttk.Frame(self.main_content)
        button_frame.pack(pady=10)
        
        # 加载配置 - 使用新的样式
        load_btn = tk.Button(
            button_frame,
            text="加载配置",
            command=self.load_email_config,
            font=('-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif', 11),
            bg='#6C757D',
            fg='#FFFFFF',
            activebackground='#5a6268',
            activeforeground='#FFFFFF',
            relief='flat',
            bd=0,
            cursor='hand2'
        )
        load_btn.pack(side='left', padx=8, pady=5)
        
        # 保存配置 - 使用新的样式
        save_btn = tk.Button(
            button_frame,
            text="保存配置",
            command=self.save_email_config,
            font=('-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif', 11),
            bg='#7BAFD4',
            fg='#FFFFFF',
            activebackground='#6395C0',
            activeforeground='#FFFFFF',
            relief='flat',
            bd=0,
            cursor='hand2'
        )
        save_btn.pack(side='left', padx=8, pady=5)
        
        # 测试连接 - 使用新的样式
        test_btn = tk.Button(
            button_frame,
            text="测试连接",
            command=self.test_email_connection,
            font=('-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif', 11),
            bg='#28a745',
            fg='#FFFFFF',
            activebackground='#218838',
            activeforeground='#FFFFFF',
            relief='flat',
            bd=0,
            cursor='hand2'
        )
        test_btn.pack(side='left', padx=8, pady=5)
        
        # 初始加载配置
        self.load_email_config()
    
    def refresh_employee_list(self):
        """刷新员工列表"""
        # 清空现有项目
        for item in self.employee_tree.get_children():
            self.employee_tree.delete(item)
        
        # 添加员工数据
        for employee in self.employees:
            self.employee_tree.insert("", "end", values=(
                employee.get("姓名", ""),
                employee.get("简历文件", ""),
                employee.get("实习时长", ""),
                employee.get("工作方式", "")
            ))
    
    def on_employee_select(self, event):
        """处理员工选择事件"""
        selection = self.employee_tree.selection()
        if selection:
            item = self.employee_tree.item(selection[0])
            employee_name = item['values'][0]
            
            # 查找员工信息
            employee = None
            for emp in self.employees:
                if emp.get("姓名") == employee_name:
                    employee = emp
                    break
            
            self.current_employee = employee
            self.show_employee_info(employee)
    
    def show_employee_info(self, employee):
        """显示员工信息"""
        # 清空信息框架
        for widget in self.employee_info_frame.winfo_children():
            widget.destroy()
        
        if not employee:
            # 显示默认信息 - 使用新的样式
            ttk.Label(
                self.employee_info_frame,
                text="请选择员工查看详情",
                font=('-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif', 12),
                foreground='#6C757D'
            ).pack(expand=True)
            return
        
        # 显示员工信息
        info_text = f"""
姓名: {employee.get('姓名', '')}
简历文件: {employee.get('简历文件', '')}
实习时长: {employee.get('实习时长', '')}
工作方式: {employee.get('工作方式', '')}
        """.strip()
        
        ttk.Label(
            self.employee_info_frame,
            text=info_text,
            font=('-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif', 11),
            justify='left'
        ).pack(anchor='w', pady=15)
        
        # 操作按钮 - 第一行
        btn_frame1 = tk.Frame(self.employee_info_frame)
        btn_frame1.pack(fill='x', pady=5)
        
        # 查看简历按钮 - 使用新的样式
        view_resume_btn = tk.Button(
            btn_frame1,
            text="查看简历",
            command=lambda: self.view_resume(employee),
            font=('-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif', 11),
            bg='#6C757D',
            fg='#FFFFFF',
            activebackground='#5a6268',
            activeforeground='#FFFFFF',
            relief='flat',
            bd=0,
            cursor='hand2'
        )
        view_resume_btn.pack(side='left', padx=5, fill='x', expand=True, pady=3)
        
        # 公司匹配按钮 - 使用新的样式
        match_btn = tk.Button(
            btn_frame1,
            text="公司匹配",
            command=lambda: self.match_companies(employee),
            font=('-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif', 11),
            bg='#7BAFD4',
            fg='#FFFFFF',
            activebackground='#6395C0',
            activeforeground='#FFFFFF',
            relief='flat',
            bd=0,
            cursor='hand2'
        )
        match_btn.pack(side='left', padx=5, fill='x', expand=True, pady=3)
        
        # 操作按钮 - 第二行
        btn_frame2 = tk.Frame(self.employee_info_frame)
        btn_frame2.pack(fill='x', pady=5)
        
        # 生成Cover Letter按钮 - 使用新的样式
        generate_btn = tk.Button(
            btn_frame2,
            text="生成Cover Letter",
            command=lambda: self.generate_cover_letter(employee),
            font=('-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif', 11),
            bg='#28a745',
            fg='#FFFFFF',
            activebackground='#218838',
            activeforeground='#FFFFFF',
            relief='flat',
            bd=0,
            cursor='hand2'
        )
        generate_btn.pack(side='left', padx=5, fill='x', expand=True, pady=3)
        
        # 发送邮件按钮 - 使用新的样式
        send_btn = tk.Button(
            btn_frame2,
            text="发送邮件",
            command=lambda: self.send_email(employee),
            font=('-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif', 11),
            bg='#7BAFD4',
            fg='#FFFFFF',
            activebackground='#6395C0',
            activeforeground='#FFFFFF',
            relief='flat',
            bd=0,
            cursor='hand2'
        )
        send_btn.pack(side='left', padx=5, fill='x', expand=True, pady=3)
        
        # 匹配公司列表区域
        companies_frame = ttk.LabelFrame(self.employee_info_frame, text="匹配公司列表", padding=10)
        companies_frame.pack(fill='both', expand=True, pady=10)
        
        # 创建Notebook用于分页显示不同岗位大类
        notebook = ttk.Notebook(companies_frame)
        notebook.pack(fill='both', expand=True)
        
        # 获取所有岗位分类（从岗位分类器获取完整的分类列表）
        from src.position_classifier import position_classifier
        all_categories = position_classifier.get_all_categories()
        
        # 获取所有公司
        all_companies = company_db.get_all_companies()
        
        # 按岗位大类分组
        companies_by_category = {}
        for company in all_companies:
            category = company.get('position_major_category', '未分类')
            if category not in companies_by_category:
                companies_by_category[category] = []
            companies_by_category[category].append(company)
        
        # 为每个岗位大类创建页面（包括没有公司的分类）
        for category in all_categories.keys():
            companies = companies_by_category.get(category, [])
            
            # 创建页面框架
            page_frame = ttk.Frame(notebook)
            notebook.add(page_frame, text=f"{category} ({len(companies)})")
            
            # 页面标题
            page_title = ttk.Label(
                page_frame,
                text=f"{category} - 共 {len(companies)} 家公司",
                font=('-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif', 12, 'bold')
            )
            page_title.pack(pady=10)
            
            # 创建树形视图
            columns = ("选择", "公司名称", "岗位子类", "公司简介", "HR邮箱")
            tree = ttk.Treeview(page_frame, columns=columns, show="headings", height=15)
            
            tree.heading("选择", text="选择")
            tree.heading("公司名称", text="公司名称")
            tree.heading("岗位子类", text="岗位子类")
            tree.heading("公司简介", text="公司简介")
            tree.heading("HR邮箱", text="HR邮箱")
            
            tree.column("选择", width=60)
            tree.column("公司名称", width=200)
            tree.column("岗位子类", width=120)
            tree.column("公司简介", width=300)
            tree.column("HR邮箱", width=150)
            
            # 滚动条
            scrollbar = ttk.Scrollbar(page_frame, orient="vertical", command=tree.yview)
            tree.configure(yscrollcommand=scrollbar.set)
            
            tree.pack(side='left', fill='both', expand=True)
            scrollbar.pack(side='right', fill='y')
            
            # 添加公司数据
            for company in companies:
                company_name = company.get('company_name', '')
                
                # 使用空白方框显示选择状态
                selection_status = "☐"
                
                # 显示公司简介
                description = company.get('description', '')
                if len(description) > 80:
                    description = description[:80] + "..."
                
                tree.insert("", "end", values=(
                    selection_status,
                    company_name,
                    company.get('position_sub_category', ''),
                    description,
                    company.get('hr_email', '')
                ))
            
            # 绑定点击事件来切换选择状态（只在选择列点击时生效）
            tree.bind('<Button-1>', lambda e, t=tree: self.toggle_company_selection_in_tree_column(e, t))
            
            # 禁用行选择高亮
            tree.tag_configure('selected', background='white', foreground='black')
        
        # 操作按钮框架
        button_frame = ttk.Frame(companies_frame)
        button_frame.pack(fill='x', pady=10)
        
        # 全选按钮
        select_all_btn = tk.Button(
            button_frame,
            text="全选",
            command=lambda: self.select_all_companies_in_notebook(notebook),
            font=('-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif', 11),
            bg='#28a745',
            fg='#FFFFFF',
            activebackground='#218838',
            activeforeground='#FFFFFF',
            relief='flat',
            bd=0,
            cursor='hand2'
        )
        select_all_btn.pack(side='left', padx=5, pady=5)
        
        # 取消全选按钮
        deselect_all_btn = tk.Button(
            button_frame,
            text="取消全选",
            command=lambda: self.deselect_all_companies_in_notebook(notebook),
            font=('-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif', 11),
            bg='#6C757D',
            fg='#FFFFFF',
            activebackground='#5a6268',
            activeforeground='#FFFFFF',
            relief='flat',
            bd=0,
            cursor='hand2'
        )
        deselect_all_btn.pack(side='left', padx=5, pady=5)
        
        # 为选中公司生成Cover Letter按钮
        generate_btn = tk.Button(
            button_frame,
            text="为选中公司生成Cover Letter",
            command=lambda: self.generate_for_selected_companies_in_notebook(employee, notebook),
            font=('-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif', 11),
            bg='#17a2b8',
            fg='#FFFFFF',
            activebackground='#138496',
            activeforeground='#FFFFFF',
            relief='flat',
            bd=0,
            cursor='hand2'
        )
        generate_btn.pack(side='left', padx=5, pady=5)
        
        # 为选中公司发送邮件按钮
        send_btn = tk.Button(
            button_frame,
            text="为选中公司发送邮件",
            command=lambda: self.send_to_selected_companies_in_notebook(employee, notebook),
            font=('-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif', 11),
            bg='#7BAFD4',
            fg='#FFFFFF',
            activebackground='#6395C0',
            activeforeground='#FFFFFF',
            relief='flat',
            bd=0,
            cursor='hand2'
        )
        send_btn.pack(side='left', padx=5, pady=5)
        
        # 保存notebook引用以便后续使用
        self.companies_notebook = notebook
        
        # 公司操作按钮框架
        company_btn_frame = tk.Frame(self.employee_info_frame)
        company_btn_frame.pack(fill='x', pady=5)
        
        # 为选中公司生成Cover Letter按钮
        generate_for_company_btn = ttk.Button(
            company_btn_frame,
            text="为选中公司生成Cover Letter",
            command=lambda: self.generate_for_selected_companies_from_positions(employee)
        )
        generate_for_company_btn.pack(side='left', padx=5, fill='x', expand=True)
        
        # 为选中公司发送邮件按钮
        send_to_company_btn = ttk.Button(
            company_btn_frame,
            text="为选中公司发送邮件",
            command=lambda: self.send_to_selected_companies_from_positions(employee)
        )
        send_to_company_btn.pack(side='left', padx=5, fill='x', expand=True)
    
    def add_employee(self):
        """添加员工"""
        # 创建添加员工窗口
        add_window = tk.Toplevel(self.root)
        add_window.title("添加员工")
        add_window.geometry("500x400")
        
        # 表单
        form_frame = ttk.Frame(add_window, padding=20)
        form_frame.pack(fill='both', expand=True)
        
        # 姓名
        ttk.Label(form_frame, text="姓名:").grid(row=0, column=0, sticky='w', pady=5)
        name_var = tk.StringVar()
        name_entry = ttk.Entry(form_frame, textvariable=name_var, width=30)
        name_entry.grid(row=0, column=1, sticky='w', padx=10, pady=5)
        
        # 简历文件
        ttk.Label(form_frame, text="简历文件:").grid(row=1, column=0, sticky='w', pady=5)
        resume_var = tk.StringVar()
        resume_entry = ttk.Entry(form_frame, textvariable=resume_var, width=30)
        resume_entry.grid(row=1, column=1, sticky='w', padx=10, pady=5)
        
        # 选择文件按钮
        def select_resume():
            filename = filedialog.askopenfilename(
                title="选择简历文件",
                filetypes=[("PDF files", "*.pdf"), ("All files", "*.*")]
            )
            if filename:
                resume_var.set(os.path.basename(filename))
        
        select_btn = ttk.Button(form_frame, text="选择文件", command=select_resume)
        select_btn.grid(row=1, column=2, padx=5, pady=5)
        
        # 实习时长
        ttk.Label(form_frame, text="实习时长:").grid(row=2, column=0, sticky='w', pady=5)
        duration_var = tk.StringVar()
        duration_combo = ttk.Combobox(
            form_frame, 
            textvariable=duration_var,
            values=["3 months", "6 months", "1 year", "其他"],
            width=27
        )
        duration_combo.grid(row=2, column=1, sticky='w', padx=10, pady=5)
        
        # 工作方式
        ttk.Label(form_frame, text="工作方式:").grid(row=3, column=0, sticky='w', pady=5)
        work_mode_var = tk.StringVar()
        work_mode_combo = ttk.Combobox(
            form_frame,
            textvariable=work_mode_var,
            values=["remote", "on site", "hybrid", "其他"],
            width=27
        )
        work_mode_combo.grid(row=3, column=1, sticky='w', padx=10, pady=5)
        
        # 按钮
        btn_frame = tk.Frame(form_frame)
        btn_frame.grid(row=4, column=0, columnspan=3, pady=20)
        
        def save_employee():
            name = name_var.get().strip()
            resume = resume_var.get().strip()
            duration = duration_var.get().strip()
            work_mode = work_mode_var.get().strip()
            
            if not name or not resume:
                messagebox.showwarning("警告", "请填写姓名和简历文件！")
                return
            
            # 添加员工
            new_employee = {
                "姓名": name,
                "简历文件": resume,
                "实习时长": duration,
                "工作方式": work_mode
            }
            
            self.employees.append(new_employee)
            
            # 保存到Excel（保持原有格式）
            self.save_employees_to_excel()
            
            # 刷新列表
            self.refresh_employee_list()
            
            add_window.destroy()
            messagebox.showinfo("成功", f"已添加员工: {name}")
        
        save_btn = ttk.Button(btn_frame, text="保存", command=save_employee)
        save_btn.pack(side='left', padx=5)
        
        cancel_btn = ttk.Button(btn_frame, text="取消", command=add_window.destroy)
        cancel_btn.pack(side='left', padx=5)
    
    def save_employees_to_excel(self):
        """保存员工数据到Excel文件（保持原有格式）"""
        try:
            # 转换为原有格式
            excel_data = []
            for emp in self.employees:
                excel_data.append({
                    "Name": emp.get("姓名", ""),
                    "Duration": emp.get("实习时长", ""),
                    "Remote/Onsite": emp.get("工作方式", ""),
                    "CV": emp.get("简历文件", "").replace(".pdf", "")  # 移除.pdf后缀
                })
            
            df = pd.DataFrame(excel_data)
            df.to_excel(self.EMPLOYEE_FILE, index=False)
            print(f"✓ 员工数据已保存到 {self.EMPLOYEE_FILE}")
            
        except Exception as e:
            print(f"✗ 保存员工数据失败: {str(e)}")
            messagebox.showerror("错误", f"保存员工数据失败: {str(e)}")
    
    def view_resume(self, employee):
        """查看简历"""
        resume_file = employee.get("简历文件", "")
        if not resume_file:
            messagebox.showwarning("警告", "该员工没有简历文件！")
            return
        
        resume_path = os.path.join("CV", resume_file)
        if not os.path.exists(resume_path):
            messagebox.showerror("错误", f"简历文件不存在: {resume_path}")
            return
        
        # 尝试打开PDF文件
        try:
            import subprocess
            import platform
            
            if platform.system() == "Darwin":  # macOS
                subprocess.run(["open", resume_path])
            elif platform.system() == "Windows":
                subprocess.run(["start", resume_path], shell=True)
            else:  # Linux
                subprocess.run(["xdg-open", resume_path])
        except Exception as e:
            messagebox.showinfo("提示", f"简历文件位置: {resume_path}\n\n请手动打开文件。")
    
    def match_companies(self, employee):
        """公司匹配 - 直接运行匹配并更新checkbox状态"""
        if not employee:
            messagebox.showwarning("警告", "请先选择员工！")
            return
        
        try:
            # 直接运行匹配（使用默认的flexible模式）
            from src.companyMatch import run_company_match
            
            # 运行匹配
            matched_companies = run_company_match(employee['姓名'], 'flexible')
            
            if matched_companies:
                # 保存匹配结果到数据库
                company_db.save_matching_results(employee['姓名'], matched_companies, 'flexible')
                
                # 更新checkbox状态
                self.update_checkbox_states(employee['姓名'], matched_companies)
                
                # 显示成功消息
                messagebox.showinfo("匹配完成", f"成功匹配到 {len(matched_companies)} 家公司！")
            else:
                messagebox.showwarning("匹配失败", "未能匹配到合适的公司。")
                
        except Exception as e:
            messagebox.showerror("匹配错误", f"匹配过程中出现错误: {str(e)}")
    
    def update_checkbox_states(self, employee_name, matched_companies):
        """更新checkbox状态 - 将推荐的公司标记为选中"""
        try:
            # 提取推荐公司名称列表
            recommended_names = [company.get('公司名称', company.get('company_name', '')) for company in matched_companies]
            
            # 检查是否有notebook
            if hasattr(self, 'companies_notebook') and self.companies_notebook:
                # 遍历所有页面
                for tab_id in self.companies_notebook.tabs():
                    page = self.companies_notebook.nametowidget(tab_id)
                    # 找到页面中的树形视图
                    for widget in page.winfo_children():
                        if isinstance(widget, ttk.Treeview):
                            tree = widget
                            for item in tree.get_children():
                                current_values = tree.item(item, 'values')
                                if current_values:
                                    company_name = current_values[1]
                                    # 检查是否是推荐的公司
                                    is_recommended = company_name in recommended_names
                                    new_selection = "☑️" if is_recommended else "☐"
                                    new_values = (new_selection,) + current_values[1:]
                                    tree.item(item, values=new_values)
                            break
            
            print(f"✓ 已更新 {employee_name} 的checkbox状态，推荐了 {len(recommended_names)} 家公司")
            
        except Exception as e:
            print(f"更新checkbox状态时出错: {e}")
    
    def show_matching_results(self, employee_name, recommended_names=None):
        """显示匹配结果"""
        try:
            # 获取员工信息
            employee = None
            for emp in self.employees:
                if emp['姓名'] == employee_name:
                    employee = emp
                    break
            
            if not employee:
                messagebox.showerror("错误", "未找到员工信息！")
                return
            
            # 如果没有提供推荐公司列表，则运行匹配获取
            if recommended_names is None:
                try:
                    from src.companyMatch import run_company_match
                    recommended_companies = run_company_match(employee_name, 'flexible')
                    recommended_names = [company.get('公司名称', company.get('company_name', '')) for company in recommended_companies]
                except:
                    recommended_names = []
            
            # 获取所有岗位分类（从岗位分类器获取完整的分类列表）
            from src.position_classifier import position_classifier
            all_categories = position_classifier.get_all_categories()
            
            # 获取所有公司
            all_companies = company_db.get_all_companies()
            
            # 按岗位大类分组
            companies_by_category = {}
            for company in all_companies:
                category = company.get('position_major_category', '未分类')
                if category not in companies_by_category:
                    companies_by_category[category] = []
                companies_by_category[category].append(company)
            
            # 创建结果窗口
            result_window = tk.Toplevel(self.root)
            result_window.title(f"匹配结果 - {employee_name}")
            result_window.geometry("1000x700")
            
            # 主框架
            main_frame = ttk.Frame(result_window, padding=10)
            main_frame.pack(fill='both', expand=True)
            
            # 标题
            title_label = ttk.Label(
                main_frame, 
                text=f"为 {employee_name} 匹配结果 - 推荐 {len(recommended_names)} 家公司",
                font=('-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif', 14, 'bold')
            )
            title_label.pack(pady=15)
            
            # 创建Notebook用于分页显示不同岗位大类
            notebook = ttk.Notebook(main_frame)
            notebook.pack(fill='both', expand=True, pady=10)
            
            # 为每个岗位大类创建页面（包括没有公司的分类）
            for category in all_categories.keys():
                companies = companies_by_category.get(category, [])
                # 创建页面框架
                page_frame = ttk.Frame(notebook)
                notebook.add(page_frame, text=f"{category} ({len(companies)})")
                
                # 页面标题
                page_title = ttk.Label(
                    page_frame,
                    text=f"{category} - 共 {len(companies)} 家公司",
                    font=('-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif', 12, 'bold')
                )
                page_title.pack(pady=10)
                
                # 创建树形视图
                columns = ("选择", "公司名称", "岗位子类", "公司简介", "HR邮箱")
                tree = ttk.Treeview(page_frame, columns=columns, show="headings", height=15)
                
                tree.heading("选择", text="选择")
                tree.heading("公司名称", text="公司名称")
                tree.heading("岗位子类", text="岗位子类")
                tree.heading("公司简介", text="公司简介")
                tree.heading("HR邮箱", text="HR邮箱")
                
                tree.column("选择", width=60)
                tree.column("公司名称", width=200)
                tree.column("岗位子类", width=120)
                tree.column("公司简介", width=300)
                tree.column("HR邮箱", width=150)
                
                # 滚动条
                scrollbar = ttk.Scrollbar(page_frame, orient="vertical", command=tree.yview)
                tree.configure(yscrollcommand=scrollbar.set)
                
                tree.pack(side='left', fill='both', expand=True)
                scrollbar.pack(side='right', fill='y')
                
                # 添加公司数据
                for company in companies:
                    company_name = company.get('company_name', '')
                    is_recommended = company_name in recommended_names
                    
                    # 使用空白方框显示选择状态
                    selection_status = "☑️" if is_recommended else "☐"
                    
                    # 显示公司简介
                    description = company.get('description', '')
                    if len(description) > 80:
                        description = description[:80] + "..."
                    
                    tree.insert("", "end", values=(
                        selection_status,
                        company_name,
                        company.get('position_sub_category', ''),
                        description,
                        company.get('hr_email', '')
                    ))
                
                # 绑定点击事件来切换选择状态（只在选择列点击时生效）
                tree.bind('<Button-1>', lambda e, t=tree: self.toggle_company_selection_in_tree_column(e, t))
                
                # 禁用行选择高亮
                tree.tag_configure('selected', background='white', foreground='black')
            
            # 操作按钮框架
            button_frame = ttk.Frame(main_frame)
            button_frame.pack(fill='x', pady=10)
            
            # 全选按钮
            select_all_btn = tk.Button(
                button_frame,
                text="全选推荐公司",
                command=lambda: self.select_all_recommended(notebook),
                font=('-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif', 11),
                bg='#28a745',
                fg='#FFFFFF',
                activebackground='#218838',
                activeforeground='#FFFFFF',
                relief='flat',
                bd=0,
                cursor='hand2'
            )
            select_all_btn.pack(side='left', padx=5, pady=5)
            
            # 取消全选按钮
            deselect_all_btn = tk.Button(
                button_frame,
                text="取消全选",
                command=lambda: self.deselect_all_companies_in_tree(notebook),
                font=('-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif', 11),
                bg='#6C757D',
                fg='#FFFFFF',
                activebackground='#5a6268',
                activeforeground='#FFFFFF',
                relief='flat',
                bd=0,
                cursor='hand2'
            )
            deselect_all_btn.pack(side='left', padx=5, pady=5)
            
            # 生成Cover Letter按钮
            generate_btn = tk.Button(
                button_frame,
                text="为选中公司生成Cover Letter",
                command=lambda: self.generate_for_selected_companies_in_tree(employee, notebook),
                font=('-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif', 11),
                bg='#17a2b8',
                fg='#FFFFFF',
                activebackground='#138496',
                activeforeground='#FFFFFF',
                relief='flat',
                bd=0,
                cursor='hand2'
            )
            generate_btn.pack(side='left', padx=5, pady=5)
            
            # 发送邮件按钮
            send_btn = tk.Button(
                button_frame,
                text="为选中公司发送邮件",
                command=lambda: self.send_to_selected_companies_in_tree(employee, notebook),
                font=('-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif', 11),
                bg='#7BAFD4',
                fg='#FFFFFF',
                activebackground='#6395C0',
                activeforeground='#FFFFFF',
                relief='flat',
                bd=0,
                cursor='hand2'
            )
            send_btn.pack(side='left', padx=5, pady=5)
            
            # 关闭按钮
            close_btn = tk.Button(
                button_frame,
                text="关闭",
                command=result_window.destroy,
                font=('-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif', 11),
                bg='#dc3545',
                fg='#FFFFFF',
                activebackground='#c82333',
                activeforeground='#FFFFFF',
                relief='flat',
                bd=0,
                cursor='hand2'
            )
            close_btn.pack(side='right', padx=5, pady=5)
            
            # 不显示成功消息，用户已经看到了匹配结果窗口
            
        except Exception as e:
            self.log_message(f"显示匹配结果失败: {str(e)}")
            messagebox.showerror("错误", f"显示匹配结果失败: {str(e)}")
    
    def generate_for_selected_company(self, employee_name, tree, parent_window):
        """为选中的公司生成Cover Letter"""
        selection = tree.selection()
        if not selection:
            messagebox.showwarning("警告", "请先选择一家公司！")
            return
        
        # 获取选中的公司
        item = tree.item(selection[0])
        company_name = item['values'][1]  # 公司名称在第二列
        
        # 获取员工信息
        employee = None
        for emp in self.employees:
            if emp['姓名'] == employee_name:
                employee = emp
                break
        
        if not employee:
            messagebox.showerror("错误", "未找到员工信息！")
            return
        
        # 关闭结果窗口
        parent_window.destroy()
        
        # 打开Cover Letter生成窗口
        self.generate_cover_letter(employee)
    
    def send_to_selected_company(self, employee_name, tree, parent_window):
        """为选中的公司发送邮件"""
        selection = tree.selection()
        if not selection:
            messagebox.showwarning("警告", "请先选择一家公司！")
            return
        
        # 获取选中的公司
        item = tree.item(selection[0])
        company_name = item['values'][1]  # 公司名称在第二列
        hr_email = item['values'][4]  # HR邮箱在第五列
        
        # 获取员工信息
        employee = None
        for emp in self.employees:
            if emp['姓名'] == employee_name:
                employee = emp
                break
        
        if not employee:
            messagebox.showerror("错误", "未找到员工信息！")
            return
        
        # 设置当前公司
        self.current_company = hr_email
        
        # 关闭结果窗口
        parent_window.destroy()
        
        # 打开邮件发送窗口
        self.send_email(employee)
    
    def export_matching_results(self, employee_name, matched_companies, parent_window):
        """导出匹配结果"""
        try:
            # 选择保存路径
            filename = filedialog.asksaveasfilename(
                defaultextension=".csv",
                filetypes=[("CSV files", "*.csv"), ("Excel files", "*.xlsx")],
                initialname=f"匹配结果_{employee_name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            )
            
            if not filename:
                return
            
            # 创建DataFrame
            df = pd.DataFrame(matched_companies)
            
            # 保存文件
            if filename.endswith('.csv'):
                df.to_csv(filename, index=False, encoding='utf-8-sig')
            else:
                df.to_excel(filename, index=False)
            
            messagebox.showinfo("成功", f"匹配结果已导出到: {filename}")
            
        except Exception as e:
            self.log_message(f"导出匹配结果失败: {str(e)}")
            messagebox.showerror("错误", f"导出匹配结果失败: {str(e)}")
    
    def generate_cover_letter(self, employee):
        """生成Cover Letter"""
        if not employee:
            messagebox.showwarning("警告", "请先选择员工！")
            return
        
        # 创建生成窗口
        generate_window = tk.Toplevel(self.root)
        generate_window.title(f"生成Cover Letter - {employee['姓名']}")
        generate_window.geometry("800x600")
        
        # 创建生成界面
        self.create_cover_letter_generation_interface(generate_window, employee)
    
    def create_cover_letter_generation_interface(self, parent, employee):
        """创建Cover Letter生成界面"""
        # 公司选择
        company_frame = ttk.LabelFrame(parent, text="选择公司", padding=10)
        company_frame.pack(fill='x', padx=10, pady=5)
        
        # 加载匹配的公司
        matched_companies = self.load_matched_companies(employee['姓名'])
        
        if not matched_companies:
            ttk.Label(company_frame, text="没有找到匹配的公司，请先运行公司匹配").pack()
            return
        
        # 公司选择下拉框
        ttk.Label(company_frame, text="选择公司:").pack(anchor='w', pady=5)
        company_var = tk.StringVar()
        company_combo = ttk.Combobox(
            company_frame,
            textvariable=company_var,
            values=[company['name'] for company in matched_companies],
            state="readonly",
            width=50
        )
        company_combo.pack(fill='x', pady=5)
        
        # 模板选择
        template_frame = ttk.LabelFrame(parent, text="选择模板", padding=10)
        template_frame.pack(fill='x', padx=10, pady=5)
        
        ttk.Label(template_frame, text="选择模板:").pack(anchor='w', pady=5)
        template_var = tk.StringVar()
        template_combo = ttk.Combobox(
            template_frame,
            textvariable=template_var,
            values=list(self.templates.keys()),
            state="readonly",
            width=50
        )
        template_combo.pack(fill='x', pady=5)
        
        # 生成按钮 - 使用新的样式
        generate_btn = tk.Button(
            template_frame,
            text="生成Cover Letter",
            command=lambda: self.generate_cover_letter_for_company(
                employee, company_var.get(), template_var.get(), parent
            ),
            font=('-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif', 11),
            bg='#28a745',
            fg='#FFFFFF',
            activebackground='#218838',
            activeforeground='#FFFFFF',
            relief='flat',
            bd=0,
            cursor='hand2'
        )
        generate_btn.pack(pady=15)
        
        # 结果显示区域
        result_frame = ttk.LabelFrame(parent, text="生成结果", padding=10)
        result_frame.pack(fill='both', expand=True, padx=10, pady=5)
        
        # 邮件主题
        ttk.Label(result_frame, text="邮件主题:").pack(anchor='w', pady=5)
        subject_text = tk.Text(result_frame, height=2, wrap='word')
        subject_text.pack(fill='x', pady=5)
        
        # Cover Letter内容
        ttk.Label(result_frame, text="Cover Letter内容:").pack(anchor='w', pady=5)
        content_text = scrolledtext.ScrolledText(result_frame, height=15, wrap='word')
        content_text.pack(fill='both', expand=True, pady=5)
        
        # 操作按钮框架
        action_frame = ttk.Frame(result_frame)
        action_frame.pack(fill='x', pady=10)
        
        def save_cover_letter():
            """保存修改后的Cover Letter"""
            # 新增：弹出确认对话框
            modified_subject = subject_text.get(1.0, tk.END).strip()
            modified_content = content_text.get(1.0, tk.END).strip()
            if not modified_subject or not modified_content:
                messagebox.showwarning("警告", "邮件主题和Cover Letter内容不能为空！")
                return
            confirm_window = tk.Toplevel(parent)
            confirm_window.title("确认保存")
            confirm_window.geometry("400x180")
            confirm_window.resizable(False, False)
            confirm_window.transient(parent)
            confirm_window.grab_set()
            confirm_frame = ttk.Frame(confirm_window, padding=20)
            confirm_frame.pack(fill='both', expand=True)
            confirm_label = ttk.Label(
                confirm_frame,
                text=f"确认要保存对 {company_var.get()} 的Cover Letter修改吗？",
                font=('-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif', 12),
                justify='center'
            )
            confirm_label.pack(pady=25)
            def do_save():
                try:
                    self.current_cover_letter = modified_content
                    self.current_subject = modified_subject
                    self.save_cover_letter_to_cache(employee['姓名'], company_var.get(), modified_content, modified_subject)
                    messagebox.showinfo("成功", "Cover Letter修改已保存！")
                    self.log_message(f"Cover Letter修改已保存: {company_var.get()}")
                except Exception as e:
                    messagebox.showerror("错误", f"保存失败: {str(e)}")
                    self.log_message(f"保存Cover Letter失败: {str(e)}")
                confirm_window.destroy()
            def cancel_save():
                confirm_window.destroy()
            btn_frame = ttk.Frame(confirm_frame)
            btn_frame.pack(pady=10)
            confirm_btn = tk.Button(
                btn_frame,
                text="确认保存",
                command=do_save,
                font=('-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif', 11),
                bg='#28a745',
                fg='#FFFFFF',
                activebackground='#218838',
                activeforeground='#FFFFFF',
                relief='flat',
                bd=0,
                cursor='hand2'
            )
            confirm_btn.pack(side='left', padx=10, pady=5)
            cancel_btn = tk.Button(
                btn_frame,
                text="取消",
                command=cancel_save,
                font=('-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif', 11),
                bg='#6C757D',
                fg='#FFFFFF',
                activebackground='#5a6268',
                activeforeground='#FFFFFF',
                relief='flat',
                bd=0,
                cursor='hand2'
            )
            cancel_btn.pack(side='left', padx=10, pady=5)
        
        def preview_cover_letter():
            """预览Cover Letter"""
            try:
                subject = subject_text.get(1.0, tk.END).strip()
                content = content_text.get(1.0, tk.END).strip()
                
                if not subject or not content:
                    messagebox.showwarning("警告", "请先生成Cover Letter！")
                    return
                
                # 创建预览窗口
                preview_window = tk.Toplevel(parent)
                preview_window.title("Cover Letter预览")
                preview_window.geometry("800x600")
                
                # 预览框架
                preview_frame = ttk.Frame(preview_window, padding=20)
                preview_frame.pack(fill='both', expand=True)
                
                # 标题
                title_label = ttk.Label(
                    preview_frame,
                    text=f"Cover Letter预览 - {company_var.get()}",
                    font=('Arial', 14, 'bold')
                )
                title_label.pack(pady=10)
                
                # 邮件主题
                subject_frame = ttk.LabelFrame(preview_frame, text="邮件主题", padding=10)
                subject_frame.pack(fill='x', pady=5)
                
                subject_preview = tk.Text(subject_frame, height=2, wrap='word')
                subject_preview.insert(1.0, subject)
                subject_preview.config(state='disabled')
                subject_preview.pack(fill='x')
                
                # Cover Letter内容
                content_frame = ttk.LabelFrame(preview_frame, text="Cover Letter内容", padding=10)
                content_frame.pack(fill='both', expand=True, pady=5)
                
                content_preview = scrolledtext.ScrolledText(content_frame, wrap='word')
                content_preview.insert(1.0, content)
                content_preview.config(state='disabled')
                content_preview.pack(fill='both', expand=True)
                
                # 关闭按钮
                close_btn = ttk.Button(
                    preview_frame,
                    text="关闭预览",
                    command=preview_window.destroy
                )
                close_btn.pack(pady=10)
                
            except Exception as e:
                messagebox.showerror("错误", f"预览失败: {str(e)}")
        
        # 保存按钮
        save_btn = ttk.Button(
            action_frame,
            text="保存修改",
            command=save_cover_letter
        )
        save_btn.pack(side='left', padx=5)
        
        # 预览按钮
        preview_btn = ttk.Button(
            action_frame,
            text="预览",
            command=preview_cover_letter
        )
        preview_btn.pack(side='left', padx=5)
        
        # 保存结果到全局变量
        self.result_subject_text = subject_text
        self.result_content_text = content_text
    
    def load_matched_companies(self, employee_name):
        """从数据库加载匹配的公司"""
        try:
            # 从数据库获取匹配结果
            matching_results = company_db.get_matching_results(employee_name)
            
            if not matching_results:
                self.log_message(f"未找到员工 {employee_name} 的匹配结果")
                return []
            
            # 转换为兼容格式
            companies = []
            for result in matching_results:
                companies.append({
                    "name": result['company_name'],
                    "hr_email": result['hr_email'],
                    "description": result['description'],
                    "requirements": "",  # 可以后续添加
                    "matching_mode": result['matching_mode'],
                    "is_recommended": result['is_recommended'],
                    "matching_score": result['matching_score']
                })
            
            self.log_message(f"从数据库加载了 {len(companies)} 个匹配结果")
            return companies
            
        except Exception as e:
            self.log_message(f"加载匹配公司失败: {str(e)}")
            return []
    
    def generate_cover_letter_for_company(self, employee, company_name, template_name, parent):
        """为指定公司生成Cover Letter"""
        try:
            # 创建进度窗口
            progress_window = tk.Toplevel(parent)
            progress_window.title("生成Cover Letter")
            progress_window.geometry("400x250")
            progress_window.transient(parent)
            progress_window.grab_set()
            
            # 居中显示
            progress_window.update_idletasks()
            x = (progress_window.winfo_screenwidth() // 2) - (400 // 2)
            y = (progress_window.winfo_screenheight() // 2) - (250 // 2)
            progress_window.geometry(f"400x250+{x}+{y}")
            
            # 进度框架
            progress_frame = tk.Frame(progress_window, padx=20, pady=20)
            progress_frame.pack(fill='both', expand=True)
            
            # 标题
            title_label = tk.Label(
                progress_frame,
                text=f"正在为 {company_name} 生成Cover Letter",
                font=('Arial', 12, 'bold')
            )
            title_label.pack(pady=10)
            
            # 进度条
            progress_bar = ttk.Progressbar(
                progress_frame,
                mode='indeterminate',
                length=300
            )
            progress_bar.pack(pady=10)
            progress_bar.start()
            
            # 状态标签
            status_label = tk.Label(
                progress_frame,
                text="正在加载AI模型...",
                font=('Arial', 10)
            )
            status_label.pack(pady=10)
            
            # 详细信息
            detail_label = tk.Label(
                progress_frame,
                text="",
                font=('Arial', 9),
                fg='gray'
            )
            detail_label.pack(pady=5)
            
            def update_progress(message, detail=""):
                """更新进度信息"""
                status_label.config(text=message)
                if detail:
                    detail_label.config(text=detail)
                progress_window.update()
            
            def generate_thread():
                """在后台线程中生成Cover Letter"""
                try:
                    # 更新进度
                    progress_window.after(0, lambda: update_progress("正在分析公司信息...", "获取公司简介和要求"))
                    
                    # 获取公司信息
                    company_info = company_db.get_company_by_name(company_name)
                    if not company_info:
                        progress_window.after(0, lambda: update_progress("正在搜索公司信息...", "从网络获取公司详情"))
                        # 从网络获取公司信息
                        from src.companyMatch import get_company_info
                        company_info = get_company_info(company_name)
                    
                    progress_window.after(0, lambda: update_progress("正在生成Cover Letter...", "使用AI模型生成个性化内容"))
                    
                    # 生成Cover Letter
                    from src.coverLetterGenerator import generate_cover_letter_and_subject
                    
                    cover_letter, subject = generate_cover_letter_and_subject(
                        applicant_name=employee['姓名'],
                        cv_filename=employee['CV'],
                        company_name=company_name,
                        company_description=company_info.get('description', ''),
                        company_requirements=company_info.get('requirements', ''),
                        mode=template_name,
                        force_regenerate=True
                    )
                    
                    progress_window.after(0, lambda: update_progress("正在保存结果...", "缓存Cover Letter内容"))
                    
                    # 保存到缓存
                    self.save_cover_letter_to_cache(employee['姓名'], company_name, cover_letter, subject)
                    
                    # 关闭进度窗口
                    progress_window.after(0, progress_window.destroy)
                    
                    # 显示结果
                    self.show_cover_letter_result(employee, company_name, cover_letter, subject, parent)
                    
                except Exception as e:
                    progress_window.after(0, progress_window.destroy)
                    messagebox.showerror("生成失败", f"生成Cover Letter时出现错误: {str(e)}")
            
            # 启动生成线程
            import threading
            generate_thread_obj = threading.Thread(target=generate_thread)
            generate_thread_obj.daemon = True
            generate_thread_obj.start()
            
        except Exception as e:
            messagebox.showerror("错误", f"启动Cover Letter生成失败: {str(e)}")
    
    def show_cover_letter_result(self, employee, company_name, cover_letter, subject, parent):
        """显示Cover Letter生成结果"""
        try:
            # 创建结果窗口
            result_window = tk.Toplevel(parent)
            result_window.title(f"Cover Letter - {company_name}")
            result_window.geometry("800x600")
            
            # 主框架
            main_frame = ttk.Frame(result_window, padding=10)
            main_frame.pack(fill='both', expand=True)
            
            # 标题
            title_label = ttk.Label(
                main_frame,
                text=f"为 {company_name} 生成的Cover Letter",
                font=('Arial', 14, 'bold')
            )
            title_label.pack(pady=10)
            
            # 邮件主题
            subject_frame = ttk.LabelFrame(main_frame, text="邮件主题", padding=10)
            subject_frame.pack(fill='x', pady=10)
            
            subject_label = ttk.Label(
                subject_frame,
                text=subject,
                font=('Arial', 11),
                wraplength=700
            )
            subject_label.pack()
            
            # Cover Letter内容
            content_frame = ttk.LabelFrame(main_frame, text="Cover Letter内容", padding=10)
            content_frame.pack(fill='both', expand=True, pady=10)
            
            # 创建文本框和滚动条
            text_frame = ttk.Frame(content_frame)
            text_frame.pack(fill='both', expand=True)
            
            text_widget = tk.Text(
                text_frame,
                wrap='word',
                font=('Arial', 10),
                height=20
            )
            text_widget.pack(side='left', fill='both', expand=True)
            
            scrollbar = ttk.Scrollbar(text_frame, orient='vertical', command=text_widget.yview)
            scrollbar.pack(side='right', fill='y')
            text_widget.configure(yscrollcommand=scrollbar.set)
            
            # 插入内容
            text_widget.insert('1.0', cover_letter)
            
            # 按钮框架
            button_frame = ttk.Frame(main_frame)
            button_frame.pack(fill='x', pady=10)
            
            # 发送邮件按钮
            send_btn = ttk.Button(
                button_frame,
                text="发送邮件",
                command=lambda: self.send_email_to_company(employee, company_name, cover_letter, subject, result_window)
            )
            send_btn.pack(side='left', padx=5)
            
            # 保存按钮
            save_btn = ttk.Button(
                button_frame,
                text="保存到文件",
                command=lambda: self.save_cover_letter_to_file(company_name, cover_letter, subject, result_window)
            )
            save_btn.pack(side='left', padx=5)
            
            # 重新生成按钮
            regenerate_btn = ttk.Button(
                button_frame,
                text="重新生成",
                command=lambda: self.regenerate_cover_letter(employee, company_name, template_name, result_window)
            )
            regenerate_btn.pack(side='left', padx=5)
            
            # 关闭按钮
            close_btn = ttk.Button(
                button_frame,
                text="关闭",
                command=result_window.destroy
            )
            close_btn.pack(side='right', padx=5)
            
        except Exception as e:
            messagebox.showerror("错误", f"显示Cover Letter结果失败: {str(e)}")
    
    def send_email_to_company(self, employee, company_name, cover_letter, subject, parent_window):
        """发送邮件到指定公司"""
        try:
            # 获取公司HR邮箱
            company_info = company_db.get_company_by_name(company_name)
            hr_email = company_info.get('hr_email', '') if company_info else ''
            
            if not hr_email:
                messagebox.showwarning("警告", f"未找到 {company_name} 的HR邮箱信息")
                return
            
            # 确认发送
            result = messagebox.askyesno(
                "确认发送",
                f"确定要发送邮件到 {company_name} 的HR邮箱 ({hr_email}) 吗？"
            )
            
            if result:
                # 创建发送进度窗口
                send_progress_window = tk.Toplevel(parent_window)
                send_progress_window.title("发送邮件")
                send_progress_window.geometry("400x200")
                send_progress_window.transient(parent_window)
                send_progress_window.grab_set()
                
                # 进度框架
                progress_frame = tk.Frame(send_progress_window, padx=20, pady=20)
                progress_frame.pack(fill='both', expand=True)
                
                # 进度标签
                progress_label = tk.Label(
                    progress_frame,
                    text="正在发送邮件...",
                    font=('Arial', 12)
                )
                progress_label.pack(pady=10)
                
                # 进度条
                send_progress_bar = ttk.Progressbar(
                    progress_frame,
                    mode='indeterminate',
                    length=300
                )
                send_progress_bar.pack(pady=10)
                send_progress_bar.start()
                
                # 详细信息标签
                detail_label = tk.Label(
                    progress_frame,
                    text="",
                    font=('Arial', 9),
                    fg='gray'
                )
                detail_label.pack(pady=5)
                
                def send_thread():
                    """在后台线程中发送邮件"""
                    try:
                        from src.mailSender import send_single_email
                        
                        # 定义进度回调函数
                        def progress_callback(message, detail=""):
                            send_progress_window.after(0, lambda: progress_label.config(text=message))
                            if detail:
                                send_progress_window.after(0, lambda: detail_label.config(text=detail))
                            send_progress_window.after(0, send_progress_window.update)
                        
                        # 发送邮件
                        success = send_single_email(
                            to_email=hr_email,
                            company_name=company_name,
                            cover_letter=cover_letter,
                            subject=subject,
                            employee_name=employee['姓名'],
                            progress_callback=progress_callback
                        )
                        
                        send_progress_window.after(0, send_progress_window.destroy)
                        
                        if success:
                            messagebox.showinfo("发送成功", f"邮件已成功发送到 {company_name}")
                            parent_window.destroy()
                        else:
                            messagebox.showerror("发送失败", f"发送邮件到 {company_name} 失败")
                            
                    except Exception as e:
                        send_progress_window.after(0, send_progress_window.destroy)
                        messagebox.showerror("发送错误", f"发送邮件时出现错误: {str(e)}")
                
                # 启动发送线程
                import threading
                send_thread_obj = threading.Thread(target=send_thread)
                send_thread_obj.daemon = True
                send_thread_obj.start()
                
        except Exception as e:
            messagebox.showerror("错误", f"发送邮件失败: {str(e)}")
    
    def save_cover_letter_to_file(self, company_name, cover_letter, subject, parent_window):
        """保存Cover Letter到文件"""
        try:
            from tkinter import filedialog
            
            # 选择保存路径
            filename = filedialog.asksaveasfilename(
                defaultextension=".txt",
                filetypes=[("文本文件", "*.txt"), ("所有文件", "*.*")],
                initialname=f"Cover_Letter_{company_name}.txt"
            )
            
            if filename:
                with open(filename, 'w', encoding='utf-8') as f:
                    f.write(f"邮件主题: {subject}\n")
                    f.write("=" * 50 + "\n\n")
                    f.write(cover_letter)
                
                messagebox.showinfo("保存成功", f"Cover Letter已保存到: {filename}")
                
        except Exception as e:
            messagebox.showerror("保存失败", f"保存文件时出现错误: {str(e)}")
    
    def regenerate_cover_letter(self, employee, company_name, template_name, parent_window):
        """重新生成Cover Letter"""
        parent_window.destroy()
        self.generate_cover_letter_for_company(employee, company_name, template_name, parent_window.master)
    
    def send_email(self, employee):
        """发送邮件"""
        if not employee:
            messagebox.showwarning("警告", "请先选择员工！")
            return
        
        if not self.current_cover_letter or not self.current_company:
            messagebox.showwarning("警告", "请先生成Cover Letter！")
            return
        
        # 获取公司的HR邮箱
        hr_email = ""
        
        # 首先尝试从员工详情界面的公司列表中获取HR邮箱
        if hasattr(self, 'companies_tree'):
            selection = self.companies_tree.selection()
            if selection:
                item = self.companies_tree.item(selection[0])
                company_name = item['values'][1]
                if company_name == self.current_company:
                    hr_email = item['values'][2]  # HR邮箱在第三列
        
        # 如果从界面获取失败，则从公司信息中获取
        if not hr_email:
            company_info = get_company_info(self.current_company)
            hr_email = company_info.get("hr_email", "")
        
        if not hr_email:
            messagebox.showerror("错误", f"无法获取 {self.current_company} 的HR邮箱！")
            return
        
        # 创建发送邮件窗口
        send_window = tk.Toplevel(self.root)
        send_window.title(f"发送邮件 - {employee['姓名']}")
        send_window.geometry("500x350")
        
        # 邮件信息显示
        info_frame = ttk.LabelFrame(send_window, text="邮件信息", padding=10)
        info_frame.pack(fill='x', padx=10, pady=5)
        
        # 从.env文件获取发件人邮箱
        # load_dotenv("input/.env")
        sender_email = os.getenv("OUTLOOK_EMAIL", "未配置")
        
        info_text = f"""
发件人: {sender_email}
收件人: {hr_email}
公司: {self.current_company}
主题: {self.current_subject}
        """.strip()
        
        ttk.Label(info_frame, text=info_text, font=('Arial', 10)).pack(anchor='w')
        
        # 确认发送
        confirm_frame = ttk.LabelFrame(send_window, text="确认发送", padding=10)
        confirm_frame.pack(fill='x', padx=10, pady=5)
        
        ttk.Label(confirm_frame, text="点击下方按钮直接发送邮件，使用.env文件中的凭据").pack(pady=5)
        
        # 发送按钮
        send_btn = ttk.Button(confirm_frame, text="发送邮件", command=lambda: send_thread())
        send_btn.pack(pady=10)
        
        def send_thread():
            try:
                self.log_message(f"开始发送邮件给 {self.current_company} ({hr_email})...")
                
                # 从.env文件加载凭据
                # load_dotenv("input/.env")
                
                sender_email = os.getenv("OUTLOOK_EMAIL")
                password = os.getenv("OUTLOOK_PASSWORD")
                
                if not sender_email or not password:
                    raise Exception("无法从.env文件获取邮件凭据，请检查input/.env文件")
                
                # 创建邮件
                msg = MIMEMultipart()
                msg["From"] = sender_email
                msg["To"] = hr_email
                msg["Subject"] = self.current_subject
                
                # 添加邮件正文
                msg.attach(MIMEText(self.current_cover_letter, "plain"))
                
                # 添加简历附件
                cv_path = os.path.join("CV", employee.get('简历文件', ''))
                if os.path.exists(cv_path):
                    with open(cv_path, "rb") as f:
                        pdf_bytes = f.read()
                    attach = MIMEApplication(pdf_bytes, Name=os.path.basename(cv_path))
                    attach["Content-Disposition"] = f'attachment; filename="{os.path.basename(cv_path)}"'
                    msg.attach(attach)
                else:
                    self.log_message(f"警告：简历文件不存在: {cv_path}")
                
                # 连接SMTP服务器并发送
                smtp_host = "smtp-mail.outlook.com"
                smtp_port = 587
                
                smtp = smtplib.SMTP(smtp_host, smtp_port)
                smtp.starttls()
                smtp.login(sender_email, password)
                
                # 发送邮件
                smtp.sendmail(sender_email, hr_email, msg.as_string())
                smtp.quit()
                
                self.log_message("邮件发送成功！")
                messagebox.showinfo("成功", f"邮件发送成功！\n收件人: {hr_email}")
                send_window.destroy()
                
            except Exception as e:
                self.log_message(f"邮件发送失败: {str(e)}")
                messagebox.showerror("错误", f"邮件发送失败:\n{str(e)}")
                send_window.destroy()
    
    def refresh_template_list(self):
        """刷新模板列表"""
        self.template_listbox.delete(0, tk.END)
        for template_id in self.templates.keys():
            template = self.templates[template_id]
            self.template_listbox.insert(tk.END, f"{template_id}: {template['name']}")
    
    def on_template_select(self, event):
        """处理模板选择事件"""
        selection = self.template_listbox.curselection()
        if selection:
            template_id = list(self.templates.keys())[selection[0]]
            template = self.templates[template_id]
            
            self.template_name_var.set(template['name'])
            self.template_content_text.delete(1.0, tk.END)
            self.template_content_text.insert(1.0, template['content'])
    
    def add_template(self):
        """添加模板"""
        template_id = f"template_{len(self.templates) + 1}"
        new_template = {
            "name": "新模板",
            "content": "尊敬的{company_name}招聘团队：\n\n我是{applicant_name}，非常希望能够加入贵公司的团队。\n\n{company_description}\n\n我相信我的技能和经验能够满足贵公司的要求：\n{company_requirements}\n\n期待您的回复！\n\n此致\n敬礼\n{applicant_name}"
        }
        
        self.templates[template_id] = new_template
        self.save_templates()
        self.refresh_template_list()
        
        # 选择新模板
        self.template_listbox.selection_set(len(self.templates) - 1)
        self.on_template_select(None)
    
    def delete_template(self):
        """删除模板"""
        selection = self.template_listbox.curselection()
        if not selection:
            messagebox.showwarning("警告", "请先选择要删除的模板！")
            return
        
        template_id = list(self.templates.keys())[selection[0]]
        template_name = self.templates[template_id]['name']
        
        result = messagebox.askyesno("确认删除", f"确定要删除模板 '{template_name}' 吗？")
        if result:
            del self.templates[template_id]
            self.save_templates()
            self.refresh_template_list()
            
            # 清空编辑区域
            self.template_name_var.set("")
            self.template_content_text.delete(1.0, tk.END)
    
    def save_template(self):
        """保存模板"""
        selection = self.template_listbox.curselection()
        if not selection:
            messagebox.showwarning("警告", "请先选择要保存的模板！")
            return
        
        template_id = list(self.templates.keys())[selection[0]]
        name = self.template_name_var.get().strip()
        content = self.template_content_text.get(1.0, tk.END).strip()
        
        if not name or not content:
            messagebox.showwarning("警告", "请填写模板名称和内容！")
            return
        
        self.templates[template_id]['name'] = name
        self.templates[template_id]['content'] = content
        self.save_templates()
        self.refresh_template_list()
        
        messagebox.showinfo("成功", "模板保存成功！")
    
    def load_email_config(self):
        """加载邮件配置"""
        try:
            config_file = "input/email_config.json"
            if os.path.exists(config_file):
                with open(config_file, 'r', encoding='utf-8') as f:
                    config = json.load(f)
                
                # 更新界面
                smtp_settings = config.get("smtp_settings", {})
                self.smtp_host_var.set(smtp_settings.get("host", "smtp-mail.outlook.com"))
                self.smtp_port_var.set(str(smtp_settings.get("port", 587)))
                self.use_tls_var.set(smtp_settings.get("use_tls", True))
                
                cred_settings = config.get("default_credentials", {})
                self.email_var.set(cred_settings.get("email", ""))
                self.password_var.set(cred_settings.get("password", ""))
                
                messagebox.showinfo("成功", "邮件配置加载成功！")
            else:
                messagebox.showinfo("提示", "邮件配置文件不存在，使用默认配置")
        except Exception as e:
            messagebox.showerror("错误", f"加载邮件配置失败: {str(e)}")
    
    def save_email_config(self):
        """保存邮件配置"""
        try:
            config = {
                "smtp_settings": {
                    "host": self.smtp_host_var.get(),
                    "port": int(self.smtp_port_var.get()),
                    "use_tls": self.use_tls_var.get()
                },
                "default_credentials": {
                    "email": self.email_var.get(),
                    "password": self.password_var.get()
                },
                "email_templates": {
                    "default_subject": "求职申请 - {company_name}",
                    "default_signature": "此致\n敬礼\n{applicant_name}"
                },
                "attachments": {
                    "resume_folder": "CV",
                    "auto_attach_resume": True
                }
            }
            
            config_file = "input/email_config.json"
            with open(config_file, 'w', encoding='utf-8') as f:
                json.dump(config, f, indent=4, ensure_ascii=False)
            
            messagebox.showinfo("成功", "邮件配置保存成功！")
        except Exception as e:
            messagebox.showerror("错误", f"保存邮件配置失败: {str(e)}")
    
    def test_email_connection(self):
        """测试邮件连接"""
        try:
            host = self.smtp_host_var.get()
            port = int(self.smtp_port_var.get())
            email = self.email_var.get()
            password = self.password_var.get()
            use_tls = self.use_tls_var.get()
            
            if not email or not password:
                messagebox.showwarning("警告", "请先填写邮箱地址和应用密码！")
                return
            
            def test_thread():
                try:
                    self.log_message("测试邮件连接...")
                    
                    smtp = smtplib.SMTP(host, port)
                    if use_tls:
                        smtp.starttls()
                    
                    smtp.login(email, password)
                    smtp.quit()
                    
                    self.log_message("邮件连接测试成功！")
                    messagebox.showinfo("成功", "邮件连接测试成功！")
                except Exception as e:
                    self.log_message(f"邮件连接测试失败: {str(e)}")
                    messagebox.showerror("错误", f"邮件连接测试失败: {str(e)}")
            
            threading.Thread(target=test_thread, daemon=True).start()
            
        except Exception as e:
            messagebox.showerror("错误", f"测试连接失败: {str(e)}")
    
    def logout(self):
        """退出登录"""
        result = messagebox.askyesno("确认退出", "确定要退出登录吗？")
        if result:
            self.is_authenticated = False
            self.create_login_screen()
    
    def log_message(self, message):
        """记录日志消息"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        log_entry = f"[{timestamp}] {message}\n"
        print(log_entry.strip())
    
    def save_cover_letter_to_cache(self, employee_name, company_name, content, subject):
        """保存Cover Letter到缓存文件"""
        try:
            import json
            import os
            from datetime import datetime
            
            # 创建缓存目录
            cache_dir = "cover_letters_cache"
            os.makedirs(cache_dir, exist_ok=True)
            
            # 缓存文件路径
            cache_file = os.path.join(cache_dir, f"{employee_name}_cover_letters.json")
            
            # 读取现有缓存
            cache_data = {}
            if os.path.exists(cache_file):
                try:
                    with open(cache_file, 'r', encoding='utf-8') as f:
                        cache_data = json.load(f)
                except:
                    cache_data = {}
            
            # 更新缓存数据
            cache_data[company_name] = {
                "content": content,
                "subject": subject,
                "generated_time": datetime.now().isoformat(),
                "mode": "professional",
                "modified": True,
                "modified_time": datetime.now().isoformat()
            }
            
            # 保存到文件
            with open(cache_file, 'w', encoding='utf-8') as f:
                json.dump(cache_data, f, ensure_ascii=False, indent=2)
            
            self.log_message(f"Cover Letter已保存到缓存: {company_name}")
            
        except Exception as e:
            self.log_message(f"保存Cover Letter到缓存失败: {str(e)}")
            raise e

    def refresh_matched_companies(self, employee_name):
        """刷新匹配公司列表"""
        try:
            # 检查companies_tree是否存在
            if not hasattr(self, 'companies_tree') or self.companies_tree is None:
                self.log_message("companies_tree未初始化，跳过刷新")
                return
            
            # 清空现有数据
            for item in self.companies_tree.get_children():
                self.companies_tree.delete(item)
            
            # 加载匹配的公司
            matched_companies = self.load_matched_companies(employee_name)
            
            if not matched_companies:
                # 显示无数据提示
                self.companies_tree.insert("", "end", values=("", "暂无匹配公司", "", "请先进行公司匹配"))
                return
            
            # 添加匹配结果
            for idx, company in enumerate(matched_companies, 1):
                # 截断简介
                description = company.get('description', '')
                if len(description) > 30:
                    description = description[:30] + "..."
                
                self.companies_tree.insert("", "end", values=(
                    idx,
                    company['name'],
                    company.get('hr_email', ''),
                    description
                ))
                
        except Exception as e:
            self.log_message(f"刷新匹配公司列表失败: {str(e)}")
            # 显示错误信息
            if hasattr(self, 'companies_tree') and self.companies_tree is not None:
                for item in self.companies_tree.get_children():
                    self.companies_tree.delete(item)
                self.companies_tree.insert("", "end", values=("", "加载失败", "", str(e)))
    
    def update_matched_companies_display(self, employee_name, matched_companies):
        """更新匹配公司显示 - 显示匹配结果窗口"""
        try:
            # 提取推荐公司名称列表
            recommended_names = [company.get('公司名称', company.get('company_name', '')) for company in matched_companies]
            
            # 显示匹配结果窗口，传递推荐公司列表
            self.show_matching_results(employee_name, recommended_names)
            self.log_message(f"已更新 {employee_name} 的匹配公司列表，共 {len(matched_companies)} 家推荐公司")
                
        except Exception as e:
            self.log_message(f"更新匹配公司显示失败: {str(e)}")
            messagebox.showerror("错误", f"更新匹配公司显示失败: {str(e)}")

    def generate_for_selected_company_in_list(self, employee):
        """为员工详情界面中选中的公司生成Cover Letter"""
        selection = self.companies_tree.selection()
        if not selection:
            messagebox.showwarning("警告", "请先选择一家公司！")
            return
        
        # 获取选中的公司
        item = self.companies_tree.item(selection[0])
        company_name = item['values'][1]  # 公司名称在第二列
        
        if company_name == "暂无匹配公司" or company_name == "加载失败":
            messagebox.showwarning("警告", "请先进行公司匹配！")
            return
        
        # 设置当前公司
        self.current_company = company_name
        
        # 打开Cover Letter生成窗口
        self.generate_cover_letter(employee)

    def send_to_selected_company_in_list(self, employee):
        """为员工详情界面中选中的公司发送邮件"""
        selection = self.companies_tree.selection()
        if not selection:
            messagebox.showwarning("警告", "请先选择一家公司！")
            return
        
        # 获取选中的公司
        item = self.companies_tree.item(selection[0])
        company_name = item['values'][1]  # 公司名称在第二列
        hr_email = item['values'][4]  # HR邮箱在第五列
        
        if company_name == "暂无匹配公司" or company_name == "加载失败":
            messagebox.showwarning("警告", "请先进行公司匹配！")
            return
        
        if not hr_email:
            messagebox.showerror("错误", f"无法获取 {company_name} 的HR邮箱！")
            return
        
        # 设置当前公司
        self.current_company = company_name
        
        # 检查是否已生成Cover Letter
        if not self.current_cover_letter:
            result = messagebox.askyesno("提示", "尚未生成Cover Letter，是否先生成？")
            if result:
                self.generate_cover_letter(employee)
                return
        
        # 打开邮件发送窗口
        self.send_email(employee)

    def view_companies(self, employee):
        """查看公司信息"""
        try:
            # 读取公司信息文件
            company_file = "input/companyInfo.xlsx"
            if not os.path.exists(company_file):
                messagebox.showwarning("警告", "公司信息文件不存在！")
                return
            
            df = pd.read_excel(company_file)
            
            # 创建公司信息窗口
            company_window = tk.Toplevel(self.root)
            company_window.title(f"公司信息 - {employee['姓名']}")
            company_window.geometry("800x600")
            
            # 创建界面
            main_frame = ttk.Frame(company_window, padding=10)
            main_frame.pack(fill='both', expand=True)
            
            # 标题
            title_label = ttk.Label(
                main_frame, 
                text=f"公司信息库 (共 {len(df)} 家公司)",
                font=('Arial', 14, 'bold')
            )
            title_label.pack(pady=10)
            
            # 公司列表（树形视图）
            columns = ("公司名称", "简介", "要求", "HR邮箱")
            company_tree = ttk.Treeview(main_frame, columns=columns, show="headings", height=20)
            
            company_tree.heading("公司名称", text="公司名称")
            company_tree.heading("简介", text="简介")
            company_tree.heading("要求", text="要求")
            company_tree.heading("HR邮箱", text="HR邮箱")
            
            company_tree.column("公司名称", width=150)
            company_tree.column("简介", width=300)
            company_tree.column("要求", width=100)
            company_tree.column("HR邮箱", width=150)
            
            # 滚动条
            scrollbar = ttk.Scrollbar(main_frame, orient="vertical", command=company_tree.yview)
            company_tree.configure(yscrollcommand=scrollbar.set)
            
            company_tree.pack(side='left', fill='both', expand=True)
            scrollbar.pack(side='right', fill='y')
            
            # 添加公司数据
            for idx, row in df.iterrows():
                company_tree.insert("", "end", values=(
                    row.get("公司名称", ""),
                    row.get("简介", "")[:50] + "..." if len(str(row.get("简介", ""))) > 50 else row.get("简介", ""),
                    row.get("要求", ""),
                    row.get("hr邮箱", "")
                ))
            
            # 统计信息
            stats_frame = ttk.LabelFrame(main_frame, text="统计信息", padding=10)
            stats_frame.pack(fill='x', pady=10)
            
            # 计算统计信息
            total_companies = len(df)
            companies_with_hr = len(df[df['hr邮箱'].notna() & (df['hr邮箱'] != '')])
            companies_with_desc = len(df[df['简介'].notna() & (df['简介'] != '')])
            
            stats_text = f"""
总公司数: {total_companies}
有HR邮箱的公司: {companies_with_hr}
有公司简介的公司: {companies_with_desc}
            """.strip()
            
            stats_label = ttk.Label(stats_frame, text=stats_text, font=('Arial', 10))
            stats_label.pack()
            
        except Exception as e:
            messagebox.showerror("错误", f"查看公司信息失败: {str(e)}")
            print(f"查看公司信息失败: {str(e)}")

    def show_company_management(self):
        """公司管理界面 - 类似macOS文件夹管理"""
        # 更新按钮状态 - 使用新的颜色
        self.employee_btn.config(bg='#6C757D')
        self.template_btn.config(bg='#6C757D')
        self.email_config_btn.config(bg='#6C757D')
        self.company_btn.config(bg='#7BAFD4')
        
        # 清空主窗口内容
        for widget in self.root.winfo_children():
            widget.destroy()
        
        # 标题栏 - 使用新的样式
        title_frame = tk.Frame(self.root, bg='#7BAFD4', height=70)
        title_frame.pack(fill='x')
        title_frame.pack_propagate(False)
        title_label = tk.Label(
            title_frame,
            text="公司管理",
            font=('-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif', 16, 'bold'),
            bg='#7BAFD4',
            fg='#FFFFFF'
        )
        title_label.pack(side='left', padx=25, pady=20)
        back_btn = tk.Button(
            title_frame,
            text="返回主界面",
            command=self.create_main_interface,
            font=('-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif', 10),
            bg='#6C757D',
            fg='#FFFFFF',
            activebackground='#5a6268',
            activeforeground='#FFFFFF',
            relief='flat',
            bd=0,
            cursor='hand2'
        )
        back_btn.pack(side='right', padx=25, pady=20)
        
        # 主内容区 - 左右布局
        main_frame = ttk.Frame(self.root, padding=10)
        main_frame.pack(fill='both', expand=True)
        
        # 左侧：文件夹列表（类似Finder侧边栏）
        left_frame = ttk.LabelFrame(main_frame, text="文件夹", padding=10)
        left_frame.pack(side='left', fill='y', padx=(0, 10))
        
        # 文件夹标题
        folder_title_frame = ttk.Frame(left_frame)
        folder_title_frame.pack(fill='x', pady=(0, 5))
        self.folder_title_label = tk.Label(
            folder_title_frame, 
            text="文件夹列表", 
            font=('-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif', 12, 'bold'),
            fg='#212529'
        )
        self.folder_title_label.pack(side='left')
        
        # 返回上级按钮
        self.back_folder_btn = ttk.Button(
            folder_title_frame, 
            text="返回上级", 
            command=self.go_back_to_folders,
            state='disabled'
        )
        self.back_folder_btn.pack(side='right')
        
        # 文件夹列表
        folder_list_frame = ttk.Frame(left_frame)
        folder_list_frame.pack(fill='both', expand=True)
        
        # 创建Treeview来显示文件夹（类似Finder）
        self.folder_tree = ttk.Treeview(folder_list_frame, show="tree", height=15)
        folder_scrollbar = ttk.Scrollbar(folder_list_frame, orient="vertical", command=self.folder_tree.yview)
        self.folder_tree.configure(yscrollcommand=folder_scrollbar.set)
        
        self.folder_tree.pack(side='left', fill='both', expand=True)
        folder_scrollbar.pack(side='right', fill='y')
        
        # 绑定双击事件
        self.folder_tree.bind('<Double-Button-1>', self.on_folder_tree_double_click)
        
        # 文件夹操作按钮 - 使用新的样式
        folder_btn_frame = ttk.Frame(left_frame)
        folder_btn_frame.pack(fill='x', pady=(5, 0))
        
        refresh_folder_btn = tk.Button(folder_btn_frame, text="刷新", 
                                     command=self.refresh_folder_tree,
                                     font=('-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif', 10),
                                     bg='#6C757D', fg='#FFFFFF', activebackground='#5a6268', activeforeground='#FFFFFF',
                                     relief='flat', bd=0, cursor='hand2')
        refresh_folder_btn.pack(side='left', padx=2, pady=2)
        
        delete_folder_btn = tk.Button(folder_btn_frame, text="删除", 
                                    command=self.delete_folder_from_tree,
                                    font=('-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif', 10),
                                    bg='#dc3545', fg='#FFFFFF', activebackground='#c82333', activeforeground='#FFFFFF',
                                    relief='flat', bd=0, cursor='hand2')
        delete_folder_btn.pack(side='left', padx=2, pady=2)
        
        # 右侧：公司列表区域
        right_frame = ttk.Frame(main_frame)
        right_frame.pack(side='right', fill='both', expand=True)
        
        # 公司列表标题
        company_title_frame = ttk.Frame(right_frame)
        company_title_frame.pack(fill='x', pady=(0, 5))
        self.company_title_label = tk.Label(
            company_title_frame, 
            text="公司列表", 
            font=('-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif', 12, 'bold'),
            fg='#212529'
        )
        self.company_title_label.pack(side='left')
        
        # 公司操作按钮 - 使用新的样式
        company_btn_frame = ttk.Frame(company_title_frame)
        company_btn_frame.pack(side='right')
        
        add_company_btn = tk.Button(company_btn_frame, text="新增", 
                                   command=self.add_company,
                                   font=('-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif', 10),
                                   bg='#28a745', fg='#FFFFFF', activebackground='#218838', activeforeground='#FFFFFF',
                                   relief='flat', bd=0, cursor='hand2')
        add_company_btn.pack(side='left', padx=2, pady=2)
        
        edit_company_btn = tk.Button(company_btn_frame, text="编辑", 
                                    command=self.edit_company,
                                    font=('-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif', 10),
                                    bg='#7BAFD4', fg='#FFFFFF', activebackground='#6395C0', activeforeground='#FFFFFF',
                                    relief='flat', bd=0, cursor='hand2')
        edit_company_btn.pack(side='left', padx=2, pady=2)
        
        delete_company_btn = tk.Button(company_btn_frame, text="删除", 
                                     command=self.delete_company,
                                     font=('-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif', 10),
                                     bg='#dc3545', fg='#FFFFFF', activebackground='#c82333', activeforeground='#FFFFFF',
                                     relief='flat', bd=0, cursor='hand2')
        delete_company_btn.pack(side='left', padx=2, pady=2)
        
        # 公司表格
        company_frame = ttk.Frame(right_frame)
        company_frame.pack(fill='both', expand=True)
        
        # 公司表格列
        columns = ("公司名称", "简介", "HR邮箱", "职位类型", "岗位大类", "岗位子类")
        self.company_tree = ttk.Treeview(company_frame, columns=columns, show="headings", height=15)
        
        # 设置列标题和宽度
        for col in columns:
            self.company_tree.heading(col, text=col)
        
        self.company_tree.column("公司名称", width=150)
        self.company_tree.column("简介", width=200)
        self.company_tree.column("HR邮箱", width=150)
        self.company_tree.column("职位类型", width=100)
        self.company_tree.column("岗位大类", width=120)
        self.company_tree.column("岗位子类", width=120)
        
        # 添加滚动条
        company_scrollbar = ttk.Scrollbar(company_frame, orient="vertical", command=self.company_tree.yview)
        self.company_tree.configure(yscrollcommand=company_scrollbar.set)
        
        self.company_tree.pack(side='left', fill='both', expand=True)
        company_scrollbar.pack(side='right', fill='y')
        
        # 绑定双击事件
        self.company_tree.bind('<Double-Button-1>', self.on_company_double_click)
        
        # 底部：批量导入区域
        bottom_frame = ttk.LabelFrame(self.root, text="批量导入", padding=10)
        bottom_frame.pack(fill='x', padx=10, pady=(0, 10))
        
        # 拖拽区域 - 使用新的样式
        self.drop_area = tk.Frame(bottom_frame, bg='#F8F9FA', relief='solid', borderwidth=1, height=80)
        self.drop_area.pack(fill='x', pady=5)
        self.drop_area.pack_propagate(False)
        
        drop_label = tk.Label(
            self.drop_area, 
            text="拖拽Excel文件到这里\n或点击选择文件", 
            font=('-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif', 10),
            bg='#F8F9FA',
            fg='#6C757D'
        )
        drop_label.pack(expand=True)
        
        # 绑定拖拽事件
        self.drop_area.bind('<Button-1>', self.select_excel_file)
        drop_label.bind('<Button-1>', self.select_excel_file)
        
        # 文件选择按钮 - 使用新的样式
        select_btn = tk.Button(bottom_frame, text="选择Excel文件", 
                              command=self.select_excel_file,
                              font=('-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif', 11),
                              bg='#7BAFD4', fg='#FFFFFF', activebackground='#6395C0', activeforeground='#FFFFFF',
                              relief='flat', bd=0, cursor='hand2')
        select_btn.pack(fill='x', pady=8)
        
        # 导入进度显示
        self.import_progress = ttk.Progressbar(bottom_frame, mode='determinate')
        self.import_progress.pack(fill='x', pady=5)
        
        # 导入状态标签 - 使用新的样式
        self.import_status = tk.Label(bottom_frame, text="", 
                                    font=('-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif', 9), 
                                    fg='#6C757D')
        self.import_status.pack()
        
        # 统计信息标签 - 使用新的样式
        self.stats_label = tk.Label(self.root, text="", 
                                   font=('-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif', 9), 
                                   fg='#6C757D')
        self.stats_label.pack(side='bottom', fill='x', padx=10, pady=5)
        
        # 初始化数据
        self.current_folder = None
        self.company_folders = {}
        self.load_companies()
        self.refresh_folder_tree()
        self.refresh_company_list()
    
    def refresh_folder_tree(self):
        """刷新文件夹树形结构"""
        try:
            # 清空文件夹树
            for item in self.folder_tree.get_children():
                self.folder_tree.delete(item)
            
            # 获取所有文件夹
            folders = company_db.get_folders()
            
            # 更新company_folders属性
            self.company_folders = {}
            
            # 添加根节点
            root_item = self.folder_tree.insert("", "end", text="所有文件夹", values=("root",), open=True)
            
            # 添加各个文件夹
            for folder in folders:
                self.company_folders[folder] = folder
                # 计算该文件夹下的公司数量
                companies = company_db.get_companies_by_folder(folder)
                count = len(companies) if companies else 0
                self.folder_tree.insert(root_item, "end", text=f"{folder} ({count})", values=(folder,))
            
            print(f"✓ 刷新文件夹树完成，共 {len(folders)} 个文件夹")
            
        except Exception as e:
            print(f"❌ 刷新文件夹树失败: {e}")
            self.company_folders = {}
    
    def on_folder_tree_double_click(self, event):
        """双击文件夹树节点"""
        selection = self.folder_tree.selection()
        if not selection:
            return
        
        item = selection[0]
        values = self.folder_tree.item(item)['values']
        if not values:
            return
        
        folder_name = values[0]
        if folder_name == "root":
            # 点击根节点，显示所有公司
            self.enter_root_folder()
        else:
            # 点击具体文件夹
            self.enter_folder(folder_name)
    
    def enter_root_folder(self):
        """进入根文件夹（显示所有公司）"""
        self.current_folder = None
        
        # 更新标题
        self.folder_title_label.config(text="所有文件夹")
        self.company_title_label.config(text="所有公司")
        
        # 启用返回按钮
        self.back_folder_btn.config(state='normal')
        
        # 刷新公司列表显示所有公司
        self.refresh_company_list()
        
        # 高亮根节点
        self.folder_tree.selection_set(self.folder_tree.get_children()[0])
    
    def enter_folder(self, folder_name):
        """进入指定文件夹"""
        self.current_folder = folder_name
        
        # 更新标题
        self.folder_title_label.config(text=f"文件夹: {folder_name}")
        self.company_title_label.config(text=f"{folder_name} 的公司")
        
        # 启用返回按钮
        self.back_folder_btn.config(state='normal')
        
        # 刷新公司列表，只显示该文件夹下的公司
        self.refresh_company_list_by_folder(folder_name)
        
        # 高亮当前文件夹
        for item in self.folder_tree.get_children():
            if self.folder_tree.item(item)['values'] and self.folder_tree.item(item)['values'][0] == folder_name:
                self.folder_tree.selection_set(item)
                break
    
    def go_back_to_folders(self):
        """返回文件夹视图"""
        self.current_folder = None
        
        # 更新标题
        self.folder_title_label.config(text="文件夹列表")
        self.company_title_label.config(text="公司列表")
        
        # 禁用返回按钮
        self.back_folder_btn.config(state='disabled')
        
        # 刷新显示所有公司
        self.refresh_company_list()
        
        # 清除选择
        self.folder_tree.selection_remove(self.folder_tree.selection())
    
    def delete_folder_from_tree(self):
        """从树形结构中删除文件夹"""
        selection = self.folder_tree.selection()
        if not selection:
            messagebox.showwarning("警告", "请先选择要删除的文件夹！")
            return
        
        item = selection[0]
        values = self.folder_tree.item(item)['values']
        if not values or values[0] == "root":
            messagebox.showwarning("警告", "不能删除根文件夹！")
            return
        
        folder_name = values[0]
        
        if not messagebox.askyesno("确认", f"确定要删除文件夹 '{folder_name}' 及其中的所有公司吗？"):
            return
        
        try:
            # 从数据库删除该文件夹下的所有公司
            companies = company_db.get_companies_by_folder(folder_name)
            for company in companies:
                company_db.delete_company(company['id'])
            
            # 刷新界面
            self.refresh_folder_tree()
            self.refresh_company_list()
            
            messagebox.showinfo("成功", f"已删除文件夹: {folder_name}")
            
        except Exception as e:
            messagebox.showerror("错误", f"删除文件夹失败: {str(e)}")
    
    def refresh_company_list(self):
        """刷新公司列表"""
        try:
            # 清空公司列表
            for item in self.company_tree.get_children():
                self.company_tree.delete(item)
            
            # 获取当前文件夹下的公司
            if self.current_folder:
                companies = company_db.get_companies_by_folder(self.current_folder)
            else:
                companies = company_db.get_all_companies()
            
            # 更新公司列表显示
            for company in companies:
                description = company.get("description", "")
                if len(description) > 50:
                    description = description[:50] + "..."
                
                self.company_tree.insert('', 'end', values=(
                    company.get("company_name", ""), 
                    description,
                    company.get("hr_email", ""),
                    company.get("position_type", ""),
                    company.get("position_major_category", ""),
                    company.get("position_sub_category", "")
                ))
            
            # 更新统计信息
            if hasattr(self, 'stats_label') and self.stats_label:
                stats_text = f"当前文件夹: {self.current_folder or '全部'} | 公司数量: {len(companies)}"
                self.stats_label.config(text=stats_text)
            
            print(f"✓ 刷新公司列表完成，共 {len(companies)} 家公司")
            
        except Exception as e:
            print(f"❌ 刷新公司列表失败: {e}")
    
    def refresh_company_list_by_folder(self, folder_name):
        """根据文件夹刷新公司列表"""
        try:
            # 清空公司列表
            for item in self.company_tree.get_children():
                self.company_tree.delete(item)
            
            # 从数据库获取该文件夹下的公司
            companies = company_db.get_companies_by_folder(folder_name)
            
            for company in companies:
                description = company.get("description", "")
                if len(description) > 50:
                    description = description[:50] + "..."
                
                self.company_tree.insert('', 'end', values=(
                    company.get("company_name", ""), 
                    description,
                    company.get("hr_email", ""),
                    company.get("position_type", ""),
                    company.get("position_major_category", ""),
                    company.get("position_sub_category", "")
                ))
            
            # 更新统计信息
            total_count = len(companies)
            with_hr = len([c for c in companies if c.get("hr_email")])
            with_desc = len([c for c in companies if c.get("description")])
            
            stats_text = f"文件夹 '{folder_name}': {total_count} 家公司 | 有HR邮箱: {with_hr} | 有简介: {with_desc}"
            if hasattr(self, 'stats_label') and self.stats_label.winfo_exists():
                self.stats_label.config(text=stats_text)
            
            print(f"✓ 显示文件夹 '{folder_name}' 下的 {total_count} 家公司")
            
        except Exception as e:
            print(f"❌ 刷新文件夹公司列表失败: {e}")

    def load_companies(self):
        """从数据库加载公司数据"""
        try:
            self.companies = company_db.get_all_companies()
            print(f"✓ 从数据库加载了 {len(self.companies)} 家公司")
        except Exception as e:
            print(f"❌ 加载公司数据失败: {e}")
            self.companies = []
    
    def add_company(self):
        """新增公司弹窗"""
        win = tk.Toplevel(self.root)
        win.title("新增公司")
        win.geometry("500x450")
        frame = ttk.Frame(win, padding=20)
        frame.pack(fill='both', expand=True)
        
        tk.Label(frame, text="公司名称:").grid(row=0, column=0, sticky='w', pady=5)
        name_var = tk.StringVar()
        name_entry = ttk.Entry(frame, textvariable=name_var, width=40)
        name_entry.grid(row=0, column=1, pady=5)
        
        tk.Label(frame, text="简介:").grid(row=1, column=0, sticky='w', pady=5)
        desc_var = tk.StringVar()
        desc_entry = ttk.Entry(frame, textvariable=desc_var, width=40)
        desc_entry.grid(row=1, column=1, pady=5)
        
        tk.Label(frame, text="实习时长要求:").grid(row=2, column=0, sticky='w', pady=5)
        duration_var = tk.StringVar()
        duration_entry = ttk.Entry(frame, textvariable=duration_var, width=40)
        duration_entry.grid(row=2, column=1, pady=5)
        
        tk.Label(frame, text="实习地点要求:").grid(row=3, column=0, sticky='w', pady=5)
        location_var = tk.StringVar()
        location_entry = ttk.Entry(frame, textvariable=location_var, width=40)
        location_entry.grid(row=3, column=1, pady=5)
        
        tk.Label(frame, text="HR邮箱:").grid(row=4, column=0, sticky='w', pady=5)
        email_var = tk.StringVar()
        email_entry = ttk.Entry(frame, textvariable=email_var, width=40)
        email_entry.grid(row=4, column=1, pady=5)
        
        tk.Label(frame, text="职位类型:").grid(row=5, column=0, sticky='w', pady=5)
        position_var = tk.StringVar()
        position_entry = ttk.Entry(frame, textvariable=position_var, width=40)
        position_entry.grid(row=5, column=1, pady=5)
        
        def do_add():
            name = name_var.get().strip()
            desc = desc_var.get().strip()
            duration = duration_var.get().strip()
            location = location_var.get().strip()
            email = email_var.get().strip()
            position = position_var.get().strip()
            
            if not name:
                messagebox.showwarning("警告", "公司名称不能为空！")
                return
            
            company_data = {
                "company_name": name,
                "description": desc,
                "duration_requirement": duration,
                "location_requirement": location,
                "hr_email": email,
                "position_type": position,
                "folder_name": self.current_folder if self.current_folder else "未分类"
            }
            
            # 智能分类岗位
            try:
                from src.position_classifier import position_classifier
                classify_result = position_classifier.classify_position(position or name, desc)
                company_data.update({
                    'position_major_category': classify_result.get('major_category', ''),
                    'position_sub_category': classify_result.get('sub_category', ''),
                    'position_classification_reason': classify_result.get('reason', ''),
                    'position_classification_confidence': classify_result.get('confidence', '')
                })
            except Exception as e:
                print(f"岗位分类失败: {e}")
                company_data.update({
                    'position_major_category': "技术类岗位 (Technical Roles)",
                    'position_sub_category': "软件工程岗位 (Software Engineering)",
                    'position_classification_reason': "默认分类",
                    'position_classification_confidence': 'low'
                })
            
            # 添加到数据库
            if company_db.add_company(company_data):
                messagebox.showinfo("成功", f"成功添加公司: {name}")
                self.refresh_company_list()
                self.refresh_folder_tree()
                win.destroy()
            else:
                messagebox.showwarning("警告", f"公司 {name} 已存在！")
            
        btn = ttk.Button(frame, text="添加", command=do_add)
        btn.grid(row=6, column=0, columnspan=2, pady=20)
    
    def edit_company(self):
        """编辑公司弹窗"""
        selected = self.company_tree.selection()
        if not selected:
            messagebox.showwarning("警告", "请先选择要编辑的公司！")
            return
        
        # 获取选中的公司名称
        company_name = self.company_tree.item(selected[0])['values'][0]
        
        # 从数据库获取公司信息
        company = company_db.get_company_by_name(company_name)
        if not company:
            messagebox.showerror("错误", "未找到该公司信息！")
            return
        
        win = tk.Toplevel(self.root)
        win.title("编辑公司")
        win.geometry("500x450")
        frame = ttk.Frame(win, padding=20)
        frame.pack(fill='both', expand=True)
        
        tk.Label(frame, text="公司名称:").grid(row=0, column=0, sticky='w', pady=5)
        name_var = tk.StringVar(value=company.get("company_name", ""))
        name_entry = ttk.Entry(frame, textvariable=name_var, width=40)
        name_entry.grid(row=0, column=1, pady=5)
        
        tk.Label(frame, text="简介:").grid(row=1, column=0, sticky='w', pady=5)
        desc_var = tk.StringVar(value=company.get("description", ""))
        desc_entry = ttk.Entry(frame, textvariable=desc_var, width=40)
        desc_entry.grid(row=1, column=1, pady=5)
        
        tk.Label(frame, text="实习时长要求:").grid(row=2, column=0, sticky='w', pady=5)
        duration_var = tk.StringVar(value=company.get("duration_requirement", ""))
        duration_entry = ttk.Entry(frame, textvariable=duration_var, width=40)
        duration_entry.grid(row=2, column=1, pady=5)
        
        tk.Label(frame, text="实习地点要求:").grid(row=3, column=0, sticky='w', pady=5)
        location_var = tk.StringVar(value=company.get("location_requirement", ""))
        location_entry = ttk.Entry(frame, textvariable=location_var, width=40)
        location_entry.grid(row=3, column=1, pady=5)
        
        tk.Label(frame, text="HR邮箱:").grid(row=4, column=0, sticky='w', pady=5)
        email_var = tk.StringVar(value=company.get("hr_email", ""))
        email_entry = ttk.Entry(frame, textvariable=email_var, width=40)
        email_entry.grid(row=4, column=1, pady=5)
        
        tk.Label(frame, text="职位类型:").grid(row=5, column=0, sticky='w', pady=5)
        position_var = tk.StringVar(value=company.get("position_type", ""))
        position_entry = ttk.Entry(frame, textvariable=position_var, width=40)
        position_entry.grid(row=5, column=1, pady=5)
        
        def do_edit():
            name = name_var.get().strip()
            desc = desc_var.get().strip()
            duration = duration_var.get().strip()
            location = location_var.get().strip()
            email = email_var.get().strip()
            position = position_var.get().strip()
            
            if not name:
                messagebox.showwarning("警告", "公司名称不能为空！")
                return
            
            # 更新公司信息
            company_data = {
                "company_name": name,
                "description": desc,
                "duration_requirement": duration,
                "location_requirement": location,
                "hr_email": email,
                "position_type": position,
                "folder_name": self.current_folder if self.current_folder else "未分类"
            }
            
            # 智能分类岗位
            try:
                from src.position_classifier import position_classifier
                classify_result = position_classifier.classify_position(position or name, desc)
                company_data.update({
                    'position_major_category': classify_result.get('major_category', ''),
                    'position_sub_category': classify_result.get('sub_category', ''),
                    'position_classification_reason': classify_result.get('reason', ''),
                    'position_classification_confidence': classify_result.get('confidence', '')
                })
            except Exception as e:
                print(f"岗位分类失败: {e}")
                company_data.update({
                    'position_major_category': "技术类岗位 (Technical Roles)",
                    'position_sub_category': "软件工程岗位 (Software Engineering)",
                    'position_classification_reason': "默认分类",
                    'position_classification_confidence': 'low'
                })
            
            # 更新数据库
            if company_db.update_company(company['id'], company_data):
                messagebox.showinfo("成功", f"成功更新公司: {name}")
                self.refresh_company_list()
                self.refresh_folder_tree()
                win.destroy()
            else:
                messagebox.showerror("错误", "更新公司信息失败！")
            
        btn = ttk.Button(frame, text="保存修改", command=do_edit)
        btn.grid(row=6, column=0, columnspan=2, pady=20)
    
    def delete_company(self):
        """删除公司"""
        selected = self.company_tree.selection()
        if not selected:
            messagebox.showwarning("警告", "请先选择要删除的公司！")
            return
        
        # 获取选中的公司名称
        company_name = self.company_tree.item(selected[0])['values'][0]
        
        if not messagebox.askyesno("确认", f"确定要删除公司：{company_name} 吗？"):
            return
        
        # 从数据库删除
        if company_db.delete_company_by_name(company_name):
            messagebox.showinfo("成功", f"成功删除公司: {company_name}")
            self.refresh_company_list()
            self.refresh_folder_tree()
        else:
            messagebox.showerror("错误", f"删除公司失败: {company_name}")
    
    def select_excel_file(self, event=None):
        """选择Excel文件进行批量导入"""
        file_path = filedialog.askopenfilename(
            title="选择Excel文件",
            filetypes=[("Excel files", "*.xlsx *.xls"), ("All files", "*.*")]
        )
        if file_path:
            self.import_excel_file(file_path)
    
    def import_excel_file(self, file_path):
        """使用智能Excel解析器导入Excel文件"""
        try:
            # 更新状态
            self.import_status.config(text="正在智能解析Excel文件...")
            self.import_progress['value'] = 10
            self.root.update()
            
            # 获取Excel文件名作为文件夹名
            excel_filename = os.path.splitext(os.path.basename(file_path))[0]
            print(f"▶ 使用Excel文件名作为文件夹名: {excel_filename}")
            
            # 导入Excel文件
            from src.smart_excel_parser import smart_excel_parser
            result = smart_excel_parser.parse_excel_to_database(file_path, excel_filename)
            
            if result['success']:
                self.import_progress['value'] = 90
                self.import_status.config(text="正在刷新界面...")
                self.root.update()
                
                # 刷新界面
                self.refresh_company_list()
                self.refresh_folder_tree()
                
                self.import_progress['value'] = 100
                self.import_status.config(text=f"成功导入 {result['total_imported']} 家公司")
                
                # 显示详细结果
                detail_msg = f"""智能导入完成！

文件夹名称: {excel_filename}
文件信息：
- 总处理: {result['total_processed']} 行
- 成功导入: {result['total_imported']} 家
- 跳过重复: {result['total_processed'] - result['total_imported']} 家

工作表处理结果:"""
                
                for sheet_name, sheet_result in result['import_results'].items():
                    detail_msg += f"\n- {sheet_name}: 导入 {sheet_result['imported_count']} 家，跳过 {sheet_result['skipped_count']} 家"
                
                detail_msg += "\n\n字段识别结果:"
                for sheet_name, analysis in result['analysis_results'].items():
                    detail_msg += f"\n- {sheet_name}:"
                    detail_msg += f"\n  置信度: {analysis.get('confidence', 'unknown')}"
                    detail_msg += f"\n  公司名称: {analysis.get('company_name_column', '未识别')}"
                    detail_msg += f"\n  公司简介: {analysis.get('description_column', '未识别')}"
                    detail_msg += f"\n  HR邮箱: {analysis.get('hr_email_column', '未识别')}"
                
                messagebox.showinfo("智能导入完成", detail_msg)
            else:
                messagebox.showerror("错误", f"智能导入失败: {result.get('error', '未知错误')}")
                self.import_status.config(text="导入失败")
            
        except Exception as e:
            self.import_status.config(text=f"导入失败: {str(e)}")
            messagebox.showerror("错误", f"智能导入Excel文件失败: {str(e)}")
        finally:
            # 重置进度条
            self.root.after(3000, lambda: self.import_progress.config(value=0))
    
    def on_company_double_click(self, event):
        """双击公司查看详细信息"""
        selection = self.company_tree.selection()
        if not selection:
            return
        
        item = selection[0]
        values = self.company_tree.item(item)['values']
        if not values:
            return
        
        company_name = values[0]
        self.show_company_details(company_name)
    
    def show_company_details(self, company_name):
        """显示公司详细信息"""
        # 从数据库获取公司详细信息
        company = company_db.get_company_by_name(company_name)
        if not company:
            messagebox.showerror("错误", f"未找到公司: {company_name}")
            return
        
        # 创建详细信息窗口
        detail_window = tk.Toplevel(self.root)
        detail_window.title(f"公司详情 - {company_name}")
        detail_window.geometry("600x500")
        
        # 创建滚动文本框
        text_frame = ttk.Frame(detail_window)
        text_frame.pack(fill='both', expand=True, padx=10, pady=10)
        
        text_widget = tk.Text(text_frame, wrap='word', font=('Arial', 10))
        scrollbar = ttk.Scrollbar(text_frame, orient="vertical", command=text_widget.yview)
        text_widget.configure(yscrollcommand=scrollbar.set)
        
        text_widget.pack(side='left', fill='both', expand=True)
        scrollbar.pack(side='right', fill='y')
        
        # 插入公司详细信息
        details = f"""
公司详细信息
{'='*50}

公司名称: {company.get('company_name', 'N/A')}
简介: {company.get('description', 'N/A')}
实习时长要求: {company.get('duration_requirement', 'N/A')}
实习地点要求: {company.get('location_requirement', 'N/A')}
HR邮箱: {company.get('hr_email', 'N/A')}
职位类型: {company.get('position_type', 'N/A')}
岗位大类: {company.get('position_major_category', 'N/A')}
岗位子类: {company.get('position_sub_category', 'N/A')}
分类理由: {company.get('position_classification_reason', 'N/A')}
分类置信度: {company.get('position_classification_confidence', 'N/A')}
文件夹: {company.get('folder_name', 'N/A')}
创建时间: {company.get('created_at', 'N/A')}
更新时间: {company.get('updated_at', 'N/A')}
"""
        
        text_widget.insert('1.0', details)
        text_widget.config(state='disabled')  # 设为只读
        
        # 添加关闭按钮
        close_btn = ttk.Button(detail_window, text="关闭", command=detail_window.destroy)
        close_btn.pack(pady=10)

    def refresh_folders(self):
        """刷新文件夹列表"""
        try:
            # 清空文件夹树
            for item in self.folder_tree.get_children():
                self.folder_tree.delete(item)
            
            # 获取所有文件夹
            folders = company_db.get_folders()
            self.company_folders = {folder: [] for folder in folders}
            
            # 为每个文件夹获取公司列表
            for folder in folders:
                companies = company_db.get_companies_by_folder(folder)
                self.company_folders[folder] = companies
            
            # 添加根节点
            root_item = self.folder_tree.insert("", "end", text="所有文件夹", values=("root",), open=True)
            
            # 添加各个文件夹
            for folder in folders:
                self.company_folders[folder] = folder
                # 计算该文件夹下的公司数量
                companies = company_db.get_companies_by_folder(folder)
                count = len(companies) if companies else 0
                self.folder_tree.insert(root_item, "end", text=f"{folder} ({count})", values=(folder,))
            
            print(f"✓ 刷新文件夹列表完成，共 {len(folders)} 个文件夹")
            
        except Exception as e:
            print(f"❌ 刷新文件夹列表失败: {e}")
            self.company_folders = {}

    def toggle_company_selection(self, event):
        """切换公司选择状态（只在选择列点击时生效）"""
        try:
            # 获取点击的项目
            item = self.positions_tree.selection()[0]
            
            # 获取点击的列
            region = self.positions_tree.identify_region(event.x, event.y)
            if region != "cell":
                return
            
            column = self.positions_tree.identify_column(event.x)
            # 只有点击第一列（选择列）时才切换状态
            if column != "#1":
                return
            
            # 获取当前值
            current_values = self.positions_tree.item(item, 'values')
            if not current_values:
                return
            
            # 切换选择状态（使用新的复选框格式）
            is_selected = current_values[0] == "☑️"
            new_selection = "☑️" if not is_selected else "☐"
            
            # 更新显示
            new_values = (new_selection,) + current_values[1:]
            self.positions_tree.item(item, values=new_values)
            
        except IndexError:
            # 如果没有选中项目，忽略
            pass
        except Exception as e:
            print(f"切换公司选择状态时出错: {e}")
    
    def select_all_companies(self):
        """全选公司"""
        try:
            for item in self.positions_tree.get_children():
                current_values = self.positions_tree.item(item, 'values')
                if current_values:
                    new_values = ("☑️",) + current_values[1:]
                    self.positions_tree.item(item, values=new_values)
        except Exception as e:
            print(f"全选公司时出错: {e}")
    
    def deselect_all_companies(self):
        """取消全选公司"""
        try:
            for item in self.positions_tree.get_children():
                current_values = self.positions_tree.item(item, 'values')
                if current_values:
                    new_values = ("☐",) + current_values[1:]
                    self.positions_tree.item(item, values=new_values)
        except Exception as e:
            print(f"取消全选公司时出错: {e}")
    
    def init_position_categories(self):
        """初始化岗位大类列表"""
        try:
            # 从岗位分类器获取完整的岗位大类列表
            from src.position_classifier import position_classifier
            all_categories = position_classifier.get_all_categories()
            categories = list(all_categories.keys())
            self.category_combo['values'] = categories
            if categories:
                self.category_combo.set(categories[0])  # 设置默认值
        except Exception as e:
            print(f"初始化岗位大类时出错: {e}")
    
    def refresh_positions_by_category(self, employee_name):
        """根据岗位大类刷新岗位列表"""
        try:
            selected_category = self.category_var.get()
            if not selected_category:
                return
            
            # 清空现有列表
            for item in self.positions_tree.get_children():
                self.positions_tree.delete(item)
            
            # 获取该岗位大类下的所有公司
            all_companies = company_db.get_companies_by_category(selected_category)
            
            if not all_companies:
                print(f"⚠️ 岗位大类 '{selected_category}' 下没有找到公司")
                # 即使没有公司，也显示空的列表，不返回
            
            # 获取员工信息用于匹配
            employee = None
            for emp in self.employees:
                if emp['姓名'] == employee_name:
                    employee = emp
                    break
            
            # 如果找到员工，运行匹配算法获取推荐公司
            recommended_companies = []
            if employee:
                try:
                    # 运行匹配算法获取推荐公司（5-15个）
                    from src.companyMatch import run_company_match
                    matched_companies = run_company_match(employee['姓名'], 'flexible')
                    if matched_companies:
                        # 提取推荐的公司名称
                        recommended_companies = [company.get('公司名称', '') for company in matched_companies]
                        print(f"✓ 获取到 {len(recommended_companies)} 家推荐公司")
                except Exception as e:
                    print(f"⚠️ 获取推荐公司失败: {e}")
            
            # 添加到列表，所有公司都显示，推荐公司自动选中
            for company in all_companies:
                company_name = company.get('name', company.get('company_name', ''))
                is_recommended = company_name in recommended_companies
                
                # 使用复选框显示选择状态
                selection_status = "☑️" if is_recommended else "☐"
                
                # 显示公司简介而不是HR邮箱
                company_description = company.get('description', '')
                if len(company_description) > 50:
                    company_description = company_description[:50] + "..."
                
                self.positions_tree.insert("", "end", values=(
                    selection_status,  # 选择状态（复选框）
                    company_name,  # 公司名称
                    company.get('position_subcategory', company.get('position_sub_category', '')),  # 岗位子类
                    company_description,  # 公司简介（替换HR邮箱）
                    company.get('hr_email', '')  # HR邮箱移到最后一列
                ))
            
            print(f"✓ 刷新岗位列表完成，共 {len(all_companies)} 家公司，其中 {len(recommended_companies)} 家推荐")
            
        except Exception as e:
            print(f"刷新岗位列表时出错: {e}")
    
    def generate_for_selected_companies_from_positions(self, employee):
        """为选中的公司生成Cover Letter（从岗位列表）"""
        try:
            selected_companies = []
            
            # 获取选中的公司
            for item in self.positions_tree.get_children():
                values = self.positions_tree.item(item, 'values')
                if values and values[0] == "☑️":  # 已选中
                    company_name = values[1]
                    selected_companies.append(company_name)
            
            if not selected_companies:
                messagebox.showwarning("警告", "请先选择要生成Cover Letter的公司！")
                return
            
            # 为每个选中的公司生成Cover Letter
            for company_name in selected_companies:
                self.generate_cover_letter_for_company(employee, company_name, None, self.root)
                
        except Exception as e:
            print(f"为选中公司生成Cover Letter时出错: {e}")
            messagebox.showerror("错误", f"生成Cover Letter失败: {str(e)}")
    
    def send_to_selected_companies_from_positions(self, employee):
        """为选中的公司发送邮件（从岗位列表）"""
        try:
            selected_companies = []
            
            # 获取选中的公司
            for item in self.positions_tree.get_children():
                values = self.positions_tree.item(item, 'values')
                if values and values[0] == "☑️":  # 已选中
                    company_name = values[1]
                    hr_email = values[4]  # HR邮箱现在在第5列
                    selected_companies.append((company_name, hr_email))
            
            if not selected_companies:
                messagebox.showwarning("警告", "请先选择要发送邮件的公司！")
                return
            
            # 为每个选中的公司发送邮件
            for company_name, hr_email in selected_companies:
                # 这里可以调用发送邮件的逻辑
                print(f"准备为 {company_name} 发送邮件到 {hr_email}")
                # TODO: 实现实际的邮件发送逻辑
                
        except Exception as e:
            print(f"为选中公司发送邮件时出错: {e}")
            messagebox.showerror("错误", f"发送邮件失败: {str(e)}")
    
    def toggle_company_selection_in_tree_column(self, event, tree):
        """切换树形视图中的公司选择状态（只在选择列点击时生效）"""
        try:
            # 获取点击的项目
            item = tree.selection()[0]
            
            # 获取点击的列
            region = tree.identify_region(event.x, event.y)
            if region != "cell":
                return
            
            column = tree.identify_column(event.x)
            # 只有点击第一列（选择列）时才切换状态
            if column != "#1":
                return
            
            # 获取当前值
            current_values = tree.item(item, 'values')
            if not current_values:
                return
            
            # 切换选择状态
            is_selected = current_values[0] == "☑️"
            new_selection = "☑️" if not is_selected else "☐"
            
            # 更新显示
            new_values = (new_selection,) + current_values[1:]
            tree.item(item, values=new_values)
            
        except IndexError:
            # 如果没有选中项目，忽略
            pass
        except Exception as e:
            print(f"切换公司选择状态时出错: {e}")
    
    def toggle_company_selection_in_tree(self, event, tree):
        """切换树形视图中的公司选择状态（兼容旧版本）"""
        self.toggle_company_selection_in_tree_column(event, tree)
    
    def select_all_recommended(self, notebook):
        """全选推荐公司"""
        try:
            # 获取推荐的公司列表
            recommended_companies = []
            try:
                from src.companyMatch import run_company_match
                # 这里需要获取当前员工名称，暂时使用默认员工
                recommended_companies = run_company_match("LIU Siyuan", 'flexible')
                recommended_names = [company.get('公司名称', company.get('company_name', '')) for company in recommended_companies]
            except:
                # 如果获取推荐公司失败，则全选
                recommended_names = []
            
            # 遍历所有页面
            for tab_id in notebook.tabs():
                page = notebook.nametowidget(tab_id)
                # 找到页面中的树形视图
                for widget in page.winfo_children():
                    if isinstance(widget, ttk.Treeview):
                        tree = widget
                        for item in tree.get_children():
                            current_values = tree.item(item, 'values')
                            if current_values:
                                company_name = current_values[1]
                                # 只选中推荐的公司
                                is_recommended = company_name in recommended_names
                                new_selection = "☑️" if is_recommended else "☐"
                                new_values = (new_selection,) + current_values[1:]
                                tree.item(item, values=new_values)
                        break
        except Exception as e:
            print(f"全选推荐公司时出错: {e}")
    
    def deselect_all_companies_in_tree(self, notebook):
        """取消全选所有公司"""
        try:
            # 遍历所有页面
            for tab_id in notebook.tabs():
                page = notebook.nametowidget(tab_id)
                # 找到页面中的树形视图
                for widget in page.winfo_children():
                    if isinstance(widget, ttk.Treeview):
                        tree = widget
                        for item in tree.get_children():
                            current_values = tree.item(item, 'values')
                            if current_values:
                                new_values = ("☐",) + current_values[1:]
                                tree.item(item, values=new_values)
                        break
        except Exception as e:
            print(f"取消全选公司时出错: {e}")
    
    def generate_for_selected_companies_in_tree(self, employee, notebook):
        """为树形视图中选中的公司生成Cover Letter"""
        try:
            selected_companies = []
            
            # 遍历所有页面，获取选中的公司
            for tab_id in notebook.tabs():
                page = notebook.nametowidget(tab_id)
                for widget in page.winfo_children():
                    if isinstance(widget, ttk.Treeview):
                        tree = widget
                        for item in tree.get_children():
                            values = tree.item(item, 'values')
                            if values and values[0] == "☑️":  # 已选中
                                company_name = values[1]
                                selected_companies.append(company_name)
                        break
            
            if not selected_companies:
                messagebox.showwarning("警告", "请先选择要生成Cover Letter的公司！")
                return
            
            # 为每个选中的公司生成Cover Letter
            for company_name in selected_companies:
                self.generate_cover_letter_for_company(employee, company_name, None, self.root)
                
        except Exception as e:
            print(f"为选中公司生成Cover Letter时出错: {e}")
            messagebox.showerror("错误", f"生成Cover Letter失败: {str(e)}")
    
    def send_to_selected_companies_in_tree(self, employee, notebook):
        """为树形视图中选中的公司发送邮件"""
        try:
            selected_companies = []
            
            # 遍历所有页面，获取选中的公司
            for tab_id in notebook.tabs():
                page = notebook.nametowidget(tab_id)
                for widget in page.winfo_children():
                    if isinstance(widget, ttk.Treeview):
                        tree = widget
                        for item in tree.get_children():
                            values = tree.item(item, 'values')
                            if values and values[0] == "☑️":  # 已选中
                                company_name = values[1]
                                hr_email = values[4]  # HR邮箱在第5列
                                selected_companies.append((company_name, hr_email))
                        break
            
            if not selected_companies:
                messagebox.showwarning("警告", "请先选择要发送邮件的公司！")
                return
            
            # 为每个选中的公司发送邮件
            for company_name, hr_email in selected_companies:
                print(f"准备为 {company_name} 发送邮件到 {hr_email}")
                # TODO: 实现实际的邮件发送逻辑
                
        except Exception as e:
            print(f"为选中公司发送邮件时出错: {e}")
            messagebox.showerror("错误", f"发送邮件失败: {str(e)}")
    
    def select_all_companies_in_notebook(self, notebook):
        """全选notebook中的所有公司"""
        try:
            # 遍历所有页面
            for tab_id in notebook.tabs():
                page = notebook.nametowidget(tab_id)
                # 找到页面中的树形视图
                for widget in page.winfo_children():
                    if isinstance(widget, ttk.Treeview):
                        tree = widget
                        for item in tree.get_children():
                            current_values = tree.item(item, 'values')
                            if current_values:
                                new_values = ("☑️",) + current_values[1:]
                                tree.item(item, values=new_values)
                        break
        except Exception as e:
            print(f"全选公司时出错: {e}")
    
    def deselect_all_companies_in_notebook(self, notebook):
        """取消全选notebook中的所有公司"""
        try:
            # 遍历所有页面
            for tab_id in notebook.tabs():
                page = notebook.nametowidget(tab_id)
                # 找到页面中的树形视图
                for widget in page.winfo_children():
                    if isinstance(widget, ttk.Treeview):
                        tree = widget
                        for item in tree.get_children():
                            current_values = tree.item(item, 'values')
                            if current_values:
                                new_values = ("☐",) + current_values[1:]
                                tree.item(item, values=new_values)
                        break
        except Exception as e:
            print(f"取消全选公司时出错: {e}")
    
    def generate_for_selected_companies_in_notebook(self, employee, notebook):
        """为选中的公司生成Cover Letter（从notebook）"""
        try:
            selected_companies = []
            
            # 遍历所有页面
            for tab_id in notebook.tabs():
                page = notebook.nametowidget(tab_id)
                # 找到页面中的树形视图
                for widget in page.winfo_children():
                    if isinstance(widget, ttk.Treeview):
                        tree = widget
                        for item in tree.get_children():
                            current_values = tree.item(item, 'values')
                            if current_values and current_values[0] == "☑️":  # 已选中
                                company_name = current_values[1]
                                selected_companies.append(company_name)
                        break
            
            if not selected_companies:
                messagebox.showwarning("警告", "请先选择要生成Cover Letter的公司！")
                return
            
            # 为每个选中的公司生成Cover Letter
            for company_name in selected_companies:
                self.generate_cover_letter_for_company(employee, company_name, None, self.root)
                
        except Exception as e:
            print(f"为选中公司生成Cover Letter时出错: {e}")
            messagebox.showerror("错误", f"生成Cover Letter失败: {str(e)}")
    
    def send_to_selected_companies_in_notebook(self, employee, notebook):
        """为选中的公司发送邮件（从notebook）"""
        try:
            selected_companies = []
            
            # 遍历所有页面
            for tab_id in notebook.tabs():
                page = notebook.nametowidget(tab_id)
                # 找到页面中的树形视图
                for widget in page.winfo_children():
                    if isinstance(widget, ttk.Treeview):
                        tree = widget
                        for item in tree.get_children():
                            current_values = tree.item(item, 'values')
                            if current_values and current_values[0] == "☑️":  # 已选中
                                company_name = current_values[1]
                                hr_email = current_values[4]  # HR邮箱在第5列
                                selected_companies.append((company_name, hr_email))
                        break
            
            if not selected_companies:
                messagebox.showwarning("警告", "请先选择要发送邮件的公司！")
                return
            
            # 为每个选中的公司发送邮件
            for company_name, hr_email in selected_companies:
                # 这里可以调用发送邮件的逻辑
                print(f"准备为 {company_name} 发送邮件到 {hr_email}")
                # TODO: 实现实际的邮件发送逻辑
                
        except Exception as e:
            print(f"为选中公司发送邮件时出错: {e}")
            messagebox.showerror("错误", f"发送邮件失败: {str(e)}")

def main():
    """主函数"""
    root = tk.Tk()
    app = IntegratedGUI(root)
    root.mainloop()

if __name__ == "__main__":
    main() 