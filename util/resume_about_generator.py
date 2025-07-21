#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
简历About生成器 - ResumeAboutGenerator

使用Qwen2.5-1.5B-Instruct模型处理简历JSON文件，生成LinkedIn风格的about介绍。

快速使用:
    from util.resume_about_generator import ResumeAboutGenerator
    generator = ResumeAboutGenerator()
    about_text = generator.process_resume_file("resume.json")

依赖: torch, transformers, accelerate, sentencepiece, protobuf
"""

import json
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
import logging
from typing import Dict, Any, Optional
import os

# 配置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class ResumeAboutGenerator:
    """
    简历About生成器类
    使用Qwen2.5-1.5B-Instruct模型生成LinkedIn风格的about介绍
    """
    
    def __init__(self, model_path: str = "./models/Qwen2.5-1.5B-Instruct"):
        """
        初始化生成器
        
        Args:
            model_path: 模型路径，默认为本地Qwen2.5-1.5B-Instruct模型
        """
        self.model_path = model_path
        self.tokenizer = None
        self.model = None
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        
        logger.info(f"使用设备: {self.device}")
        self._load_model()
    
    def _load_model(self):
        """加载模型和分词器"""
        try:
            logger.info("正在加载模型和分词器...")
            
            # 尝试加载分词器
            try:
                self.tokenizer = AutoTokenizer.from_pretrained(
                    self.model_path,
                    trust_remote_code=True
                )
                logger.info("分词器加载成功")
            except Exception as e:
                logger.warning(f"本地分词器加载失败: {e}")
                logger.info("尝试从HuggingFace下载分词器...")
                self.tokenizer = AutoTokenizer.from_pretrained(
                    "Qwen/Qwen2.5-1.5B-Instruct",
                    trust_remote_code=True
                )
            
            # 尝试加载模型
            try:
                self.model = AutoModelForCausalLM.from_pretrained(
                    self.model_path,
                    torch_dtype=torch.float16 if self.device == "cuda" else torch.float32,
                    device_map="auto" if self.device == "cuda" else None,
                    trust_remote_code=True,
                    low_cpu_mem_usage=True
                )
                logger.info("本地模型加载成功")
            except Exception as e:
                logger.warning(f"本地模型加载失败: {e}")
                logger.info("尝试从HuggingFace下载模型...")
                self.model = AutoModelForCausalLM.from_pretrained(
                    "Qwen/Qwen2.5-1.5B-Instruct",
                    torch_dtype=torch.float16 if self.device == "cuda" else torch.float32,
                    device_map="auto" if self.device == "cuda" else None,
                    trust_remote_code=True,
                    low_cpu_mem_usage=True
                )
            
            logger.info("模型加载完成")
            
        except Exception as e:
            logger.error(f"模型加载失败: {e}")
            raise
    
    def _extract_resume_info(self, resume_data: Dict[str, Any]) -> str:
        """
        从简历JSON中提取关键信息
        
        Args:
            resume_data: 简历JSON数据
            
        Returns:
            格式化的简历信息字符串
        """
        info_parts = []
        
        # 提取基本信息
        contact = resume_data.get('contact', {})
        if contact:
            name = contact.get('name', '')
            location = contact.get('location', '')
            if name:
                info_parts.append(f"姓名: {name}")
            if location:
                info_parts.append(f"位置: {location}")
        
        # 提取教育背景
        education = resume_data.get('education', [])
        if education:
            latest_edu = education[0]  # 假设按时间倒序排列
            school = latest_edu.get('school', '')
            degree = latest_edu.get('degree', '')
            if school and degree:
                info_parts.append(f"教育: {degree} at {school}")
        
        # 提取研究经历
        research = resume_data.get('research', [])
        if research:
            current_research = research[0]  # 当前研究
            position = current_research.get('position', '')
            lab = current_research.get('lab', '')
            project = current_research.get('project', '')
            if position and lab:
                info_parts.append(f"当前职位: {position} at {lab}")
            if project:
                info_parts.append(f"项目: {project}")
        
        # 提取技能
        skills = resume_data.get('skills', {})
        if skills:
            languages = skills.get('languages', [])
            if languages:
                info_parts.append(f"编程语言: {', '.join(languages)}")
        
        # 提取奖项
        awards = resume_data.get('awards', [])
        if awards:
            # 选择最重要的奖项
            important_awards = awards[:2]  # 取前两个奖项
            info_parts.append(f"奖项: {'; '.join(important_awards)}")
        
        # 提取发表论文
        publications = resume_data.get('publications', [])
        if publications:
            latest_pub = publications[0]
            title = latest_pub.get('title', '')
            if title:
                # 截取标题的前50个字符
                short_title = title[:50] + "..." if len(title) > 50 else title
                info_parts.append(f"最新论文: {short_title}")
        
        return "\n".join(info_parts)
    
    def _create_prompt(self, resume_info: str) -> str:
        """
        创建用于生成about的提示词
        
        Args:
            resume_info: 简历信息字符串
            
        Returns:
            格式化的提示词
        """
        prompt = f"""<|im_start|>system
你是一个专业的LinkedIn个人介绍撰写专家。请根据以下简历信息，生成一个简洁、专业、有吸引力的LinkedIn about介绍。

要求：
1. 长度控制在100-150字左右
2. 突出个人专业能力和成就
3. 使用LinkedIn风格的专业语言
4. 包含个人定位、专业领域、关键成就
5. 语言要简洁有力，避免冗长
6. 适合LinkedIn平台展示

简历信息：
{resume_info}

请生成LinkedIn风格的about介绍：<|im_end|>
<|im_start|>assistant
"""
        return prompt
    
    def generate_about(self, resume_data: Dict[str, Any]) -> str:
        """
        生成LinkedIn风格的about介绍
        
        Args:
            resume_data: 简历JSON数据
            
        Returns:
            生成的about介绍文本
        """
        try:
            # 提取简历信息
            resume_info = self._extract_resume_info(resume_data)
            logger.info("简历信息提取完成")
            
            # 创建提示词
            prompt = self._create_prompt(resume_info)
            logger.info("提示词创建完成")
            
            # 编码输入
            inputs = self.tokenizer(prompt, return_tensors="pt").to(self.device)
            
            # 生成文本
            logger.info("开始生成about介绍...")
            with torch.no_grad():
                outputs = self.model.generate(
                    **inputs,
                    max_new_tokens=200,  # 最大生成200个新token
                    temperature=0.7,     # 控制创造性
                    top_p=0.9,          # 核采样
                    do_sample=True,
                    pad_token_id=self.tokenizer.eos_token_id
                )
            
            # 解码输出
            generated_text = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
            
            # 提取生成的about部分
            about_start = generated_text.find("请生成LinkedIn风格的about介绍：")
            if about_start != -1:
                about_text = generated_text[about_start + len("请生成LinkedIn风格的about介绍："):].strip()
            else:
                about_text = generated_text.strip()
            
            # 清理输出文本，去掉assistant前缀
            if about_text.startswith("assistant"):
                about_text = about_text[9:].strip()
            
            logger.info("about介绍生成完成")
            return about_text
            
        except Exception as e:
            logger.error(f"生成about介绍时出错: {e}")
            raise
    
    def process_resume_file(self, file_path: str) -> str:
        """
        处理简历JSON文件并生成about介绍
        
        Args:
            file_path: 简历JSON文件路径
            
        Returns:
            生成的about介绍文本
        """
        try:
            # 读取JSON文件
            with open(file_path, 'r', encoding='utf-8') as f:
                resume_data = json.load(f)
            
            logger.info(f"成功读取简历文件: {file_path}")
            
            # 生成about介绍
            about_text = self.generate_about(resume_data)
            return about_text
            
        except FileNotFoundError:
            logger.error(f"文件未找到: {file_path}")
            raise
        except json.JSONDecodeError:
            logger.error(f"JSON文件格式错误: {file_path}")
            raise
        except Exception as e:
            logger.error(f"处理文件时出错: {e}")
            raise

def main():
    """主函数，演示如何使用ResumeAboutGenerator"""
    
    # 初始化生成器
    generator = ResumeAboutGenerator()
    
    # 处理示例简历文件
    resume_file = "sample/lsy_resume.json"
    
    if os.path.exists(resume_file):
        try:
            about_text = generator.process_resume_file(resume_file)
            print("\n" + "="*50)
            print("生成的LinkedIn About介绍:")
            print("="*50)
            print(about_text)
            print("="*50)
        except Exception as e:
            print(f"处理失败: {e}")
    else:
        print(f"简历文件不存在: {resume_file}")
        print("请确保sample/lsy_resume.json文件存在")

if __name__ == "__main__":
    main() 