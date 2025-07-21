#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Util工具使用示例 - Example Usage

展示util文件夹中三个工具的使用方法：
1. resume_about_generator.py - 简历About生成器
2. resume_evaluator.py - 简历评估器
3. resume_section_splitter.py - 简历分割器

使用方法:
    python util/example_usage.py
"""

import json
import os
from resume_about_generator import ResumeAboutGenerator
from resume_evaluator import ResumeEvaluator
# from resume_section_splitter import split_resume_sections_from_text  # 暂时禁用分割器

def example_about_generator():
    """示例1: 简历About生成器"""
    print("=" * 60)
    print("📝 示例1: ResumeAboutGenerator - 简历About生成器")
    print("=" * 60)
    print("功能: 使用Qwen2.5-1.5B-Instruct模型生成LinkedIn风格的about介绍")
    print()
    
    try:
        # 初始化生成器
        generator = ResumeAboutGenerator()
        
        # 示例1: 处理简历文件
        print("🔄 处理简历文件...")
        resume_file = "../sample/lsy_resume.json"
        if os.path.exists(resume_file):
            about_text = generator.process_resume_file(resume_file)
            print("✅ 生成的LinkedIn About介绍:")
            print("-" * 40)
            print(about_text)
            print("-" * 40)
        else:
            print(f"❌ 文件不存在: {resume_file}")
        
        # 示例2: 直接处理简历数据
        print("\n🔄 处理自定义简历数据...")
        custom_resume = {
            "contact": {
                "name": "张三",
                "location": "北京, 上海"
            },
            "education": [
                {
                    "school": "清华大学",
                    "degree": "计算机科学硕士",
                    "startDate": "09/2022",
                    "endDate": "06/2025"
                }
            ],
            "research": [
                {
                    "position": "研究助理",
                    "lab": "AI实验室",
                    "project": "大语言模型优化",
                    "date": "01/2024 - Present"
                }
            ],
            "skills": {
                "languages": ["Python", "Java", "C++"]
            },
            "awards": [
                "优秀毕业生奖",
                "学术论文奖"
            ]
        }
        
        about_text = generator.generate_about(custom_resume)
        print("✅ 生成的LinkedIn About介绍:")
        print("-" * 40)
        print(about_text)
        print("-" * 40)
        
    except Exception as e:
        print(f"❌ About生成器示例失败: {e}")

def example_resume_evaluator():
    """示例2: 简历评估器"""
    print("\n" + "=" * 60)
    print("📊 示例2: ResumeEvaluator - 简历评估器")
    print("=" * 60)
    print("功能: 评估简历并生成三个分数 - 整体分数、垂直一致性、完整性")
    print()
    
    try:
        # 初始化评估器
        evaluator = ResumeEvaluator()
        
        # 评估简历文件
        print("🔄 评估简历文件...")
        resume_file = "../sample/lsy_resume.json"
        if os.path.exists(resume_file):
            overall, vertical, completeness = evaluator.process_resume_file(resume_file)
            
            print("✅ 评估结果:")
            print("-" * 30)
            print(f"整体分数: {overall}/100")
            print(f"垂直一致性分数: {vertical}/100")
            print(f"完整性分数: {completeness}/100")
            print("-" * 30)
            
            # 保存到CSV文件
            evaluator.save_scores((overall, vertical, completeness), "score/example_scores.csv")
            print("✅ 分数已保存到 score/example_scores.csv")
        else:
            print(f"❌ 文件不存在: {resume_file}")
        
        # 评估自定义简历数据
        print("\n🔄 评估自定义简历数据...")
        custom_resume = {
            "contact": {
                "name": "李四",
                "location": "深圳"
            },
            "education": [
                {
                    "school": "北京大学",
                    "degree": "软件工程学士",
                    "startDate": "09/2020",
                    "endDate": "06/2024"
                }
            ],
            "research": [
                {
                    "position": "软件工程师",
                    "lab": "腾讯科技",
                    "project": "微信小程序开发",
                    "date": "07/2024 - Present"
                }
            ],
            "skills": {
                "languages": ["JavaScript", "Python", "Java"],
                "software": ["VS Code", "Git", "Docker"]
            },
            "awards": [
                "优秀毕业生",
                "编程竞赛二等奖"
            ]
        }
        
        overall, vertical, completeness = evaluator.evaluate_resume(custom_resume)
        print("✅ 自定义简历评估结果:")
        print("-" * 30)
        print(f"整体分数: {overall}/100")
        print(f"垂直一致性分数: {vertical}/100")
        print(f"完整性分数: {completeness}/100")
        print("-" * 30)
        
    except Exception as e:
        print(f"❌ 简历评估器示例失败: {e}")

def example_resume_section_splitter():
    """示例3: 简历分割器"""
    print("\n" + "=" * 60)
    print("✂️ 示例3: ResumeSectionSplitter - 简历分割器")
    print("=" * 60)
    print("功能: 将简历文本分割为不同的部分")
    print()
    
    try:
        # 示例简历文本
        resume_text = """
张三
电话: 13800138000
邮箱: zhangsan@example.com
地址: 北京市朝阳区

教育背景:
北京大学 计算机科学学士 2020-2024
主修课程: 数据结构、算法、数据库

工作经验:
腾讯科技 软件工程师 2024-至今
- 负责微信小程序后端开发
- 优化系统性能，提升用户体验

技能:
编程语言: Python, Java, JavaScript
工具: Git, Docker, VS Code

项目经验:
智能推荐系统 2023-2024
- 使用机器学习算法开发推荐系统
- 准确率提升15%
        """
        
        print("🔄 分割简历文本...")
        sections = split_resume_sections_from_text(resume_text)
        
        print("✅ 分割结果:")
        print("-" * 30)
        for section_name, content in sections.items():
            if content.strip():
                print(f"{section_name}:")
                print(content.strip())
                print()
        
        # 示例2: 处理文件
        print("🔄 处理简历文件...")
        resume_file = "../sample/lsy_resume.json"
        if os.path.exists(resume_file):
            with open(resume_file, 'r', encoding='utf-8') as f:
                resume_data = json.load(f)
            
            # 将JSON转换为文本格式
            resume_text = json.dumps(resume_data, ensure_ascii=False, indent=2)
            sections = split_resume_sections_from_text(resume_text)
            
            print("✅ JSON文件分割结果:")
            print("-" * 30)
            for section_name, content in sections.items():
                if content.strip():
                    print(f"{section_name}:")
                    print(content.strip()[:100] + "..." if len(content) > 100 else content.strip())
                    print()
        else:
            print(f"❌ 文件不存在: {resume_file}")
        
    except Exception as e:
        print(f"❌ 简历分割器示例失败: {e}")

def show_usage_guide():
    """显示使用指南"""
    print("\n" + "=" * 60)
    print("📚 使用指南 - Usage Guide")
    print("=" * 60)
    
    print("""
🔧 工具概览:

1. ResumeAboutGenerator (简历About生成器)
   - 功能: 生成LinkedIn风格的about介绍
   - 输入: 简历JSON文件或数据
   - 输出: 专业的LinkedIn about文本
   - 使用: generator.process_resume_file("resume.json")

2. ResumeEvaluator (简历评估器)
   - 功能: 评估简历质量并生成三个分数
   - 输入: 简历JSON文件或数据
   - 输出: overall, vertical, completeness 三个分数
   - 使用: evaluator.process_resume_file("resume.json")

3. ResumeSectionSplitter (简历分割器)
   - 功能: 将简历文本分割为不同部分
   - 输入: 简历文本
   - 输出: 分割后的各个部分
   - 使用: splitter.split_resume(resume_text)

📋 支持的简历JSON格式:
{
    "contact": {
        "name": "姓名",
        "location": "位置"
    },
    "education": [
        {
            "school": "学校",
            "degree": "学位",
            "startDate": "开始时间",
            "endDate": "结束时间"
        }
    ],
    "research": [
        {
            "position": "职位",
            "lab": "实验室/公司",
            "project": "项目",
            "date": "时间"
        }
    ],
    "skills": {
        "languages": ["编程语言"],
        "software": ["软件工具"]
    },
    "awards": ["奖项"],
    "publications": [
        {
            "title": "论文标题",
            "venue": "发表平台",
            "date": "发表时间",
            "authors": ["作者"]
        }
    ]
}

🚀 快速开始:
    python util/example_usage.py
    """)

def main():
    """主函数"""
    print("🚀 Util工具使用示例")
    print("展示util文件夹中三个工具的使用方法")
    print()
    
    # 显示使用指南
    show_usage_guide()
    
    # 运行示例
    example_about_generator()
    example_resume_evaluator()
    # example_resume_section_splitter()  # 暂时禁用分割器
    
    print("\n" + "=" * 60)
    print("✅ 所有示例运行完成！")
    print("=" * 60)

if __name__ == "__main__":
    main() 