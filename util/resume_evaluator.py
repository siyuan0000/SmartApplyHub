#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
简历评估器 - ResumeEvaluator

使用Qwen2.5-1.5B-Instruct模型评估简历JSON文件，生成三个详细分数：
- Overall Score: 整体评估分数
- Vertical Consistency Score: 垂直一致性分数
- Completeness Score: 完整性分数

快速使用:
    from util.resume_evaluator import ResumeEvaluator
    evaluator = ResumeEvaluator()
    scores = evaluator.evaluate_resume("resume.json")
    evaluator.save_scores("resume_scores.csv")

依赖: torch, transformers, accelerate, sentencepiece, protobuf, csv
"""

import json
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
import logging
from typing import Dict, Any, Tuple
import os
import csv

# 配置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class ResumeEvaluator:
    """
    简历评估器类
    使用Qwen2.5-1.5B-Instruct模型评估简历并生成三个详细分数
    """
    
    def __init__(self, model_path: str = "../models/Qwen2.5-1.5B-Instruct"):
        """
        初始化评估器
        
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
            
            # 直接使用HuggingFace分词器（本地分词器文件损坏）
            logger.info("使用HuggingFace分词器...")
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
                    low_cpu_mem_usage=True,
                    offload_folder="offload"  # 添加模型卸载文件夹
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
        从简历JSON中提取详细信息用于评估
        
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
            for i, edu in enumerate(education):
                school = edu.get('school', '')
                degree = edu.get('degree', '')
                start_date = edu.get('startDate', '')
                end_date = edu.get('endDate', '')
                info_parts.append(f"教育{i+1}: {degree} at {school} ({start_date} - {end_date})")
        
        # 提取研究经历
        research = resume_data.get('research', [])
        if research:
            for i, res in enumerate(research):
                position = res.get('position', '')
                lab = res.get('lab', '')
                project = res.get('project', '')
                date = res.get('date', '')
                info_parts.append(f"研究{i+1}: {position} at {lab}, 项目: {project}, 时间: {date}")
        
        # 提取技能
        skills = resume_data.get('skills', {})
        if skills:
            languages = skills.get('languages', [])
            software = skills.get('software', [])
            if languages:
                info_parts.append(f"编程语言: {', '.join(languages)}")
            if software:
                info_parts.append(f"软件工具: {', '.join(software)}")
        
        # 提取奖项
        awards = resume_data.get('awards', [])
        if awards:
            info_parts.append(f"奖项: {'; '.join(awards)}")
        
        # 提取发表论文
        publications = resume_data.get('publications', [])
        if publications:
            for i, pub in enumerate(publications):
                title = pub.get('title', '')
                venue = pub.get('venue', '')
                date = pub.get('date', '')
                authors = pub.get('authors', [])
                info_parts.append(f"论文{i+1}: {title}, 发表: {venue}, 时间: {date}, 作者: {', '.join(authors[:3])}")
        
        return "\n".join(info_parts)
    
    def _create_evaluation_prompt(self, resume_info: str, score_type: str) -> str:
        """
        创建评估提示词
        
        Args:
            resume_info: 简历信息字符串
            score_type: 评估类型 (overall, vertical, completeness)
            
        Returns:
            格式化的提示词
        """
        if score_type == "overall":
            prompt = f"""<|im_start|>system
你是一个专业的简历评估专家。请根据以下简历信息，给出一个0-100的整体评估分数。

评估标准：
1. 教育背景的质量和相关性
2. 研究/工作经历的专业性和成就
3. 技能与职位的匹配度
4. 奖项和荣誉的重要性
5. 论文发表的质量和影响力
6. 整体简历的专业性和吸引力

请只返回一个0-100的整数分数，不要其他解释。

简历信息：
{resume_info}

整体评估分数：<|im_end|>
<|im_start|>assistant
分数：
"""
        elif score_type == "vertical":
            prompt = f"""<|im_start|>system
你是一个专业的简历评估专家。请根据以下简历信息，评估垂直一致性，给出0-100的分数。

垂直一致性评估标准：
1. 教育背景与研究/工作方向的一致性
2. 技能与专业领域的匹配度
3. 研究项目与学术方向的连贯性
4. 奖项与专业领域的相关性
5. 论文发表与研究方向的一致性
6. 整体职业发展路径的清晰度

请只返回一个0-100的整数分数，不要其他解释。

简历信息：
{resume_info}

垂直一致性分数：<|im_end|>
<|im_start|>assistant
分数：
"""
        else:  # completeness
            prompt = f"""<|im_start|>system
你是一个专业的简历评估专家。请根据以下简历信息，评估简历完整性，给出0-100的分数。

完整性评估标准：
1. 基本信息是否完整（姓名、联系方式、位置）
2. 教育经历是否有完整的时间、学校、学位信息
3. 研究/工作经历是否有详细的职位、机构、项目、时间信息
4. 技能是否详细列出
5. 奖项是否有具体说明
6. 论文是否有完整的标题、发表信息、作者信息
7. 是否有缺失的重要信息

请只返回一个0-100的整数分数，不要其他解释。

简历信息：
{resume_info}

完整性分数：<|im_end|>
<|im_start|>assistant
分数：
"""
        
        return prompt
    
    def _extract_score_from_response(self, response: str) -> int:
        """
        从模型响应中提取分数
        
        Args:
            response: 模型生成的响应
            
        Returns:
            提取的分数
        """
        try:
            # 清理响应文本
            if response.startswith("assistant"):
                response = response[9:].strip()
            
            # 查找"分数："后面的数字
            import re
            score_pattern = r'分数：\s*(\d+)'
            score_match = re.search(score_pattern, response)
            if score_match:
                score = int(score_match.group(1))
                return max(0, min(100, score))
            
            # 查找行末的数字
            line_end_pattern = r'(\d+)\s*$'
            line_end_match = re.search(line_end_pattern, response)
            if line_end_match:
                score = int(line_end_match.group(1))
                return max(0, min(100, score))
            
            # 查找任何数字
            all_numbers = re.findall(r'\b\d+\b', response)
            if all_numbers:
                # 取最后一个数字（通常是最新的分数）
                score = int(all_numbers[-1])
                # 如果数字太大，进行缩放
                if score > 100:
                    score = min(100, score // 10)
                return max(0, min(100, score))
            
            # 如果仍然没有找到数字，返回默认分数
            logger.warning(f"未找到有效分数，响应: {response}")
            return 75
        except Exception as e:
            logger.warning(f"分数提取失败: {e}, 响应: {response}")
            return 75
    
    def _generate_score(self, resume_info: str, score_type: str) -> int:
        """
        生成特定类型的分数
        
        Args:
            resume_info: 简历信息字符串
            score_type: 评估类型
            
        Returns:
            生成的分数
        """
        try:
            # 创建提示词
            prompt = self._create_evaluation_prompt(resume_info, score_type)
            logger.info(f"开始生成{score_type}分数...")
            
            # 编码输入
            inputs = self.tokenizer(prompt, return_tensors="pt").to(self.device)
            
            # 生成文本
            with torch.no_grad():
                outputs = self.model.generate(
                    **inputs,
                    max_new_tokens=50,  # 只需要短回答
                    temperature=0.3,     # 降低创造性，提高一致性
                    top_p=0.9,
                    do_sample=True,
                    pad_token_id=self.tokenizer.eos_token_id
                )
            
            # 解码输出
            generated_text = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
            
            # 提取分数
            score = self._extract_score_from_response(generated_text)
            logger.info(f"{score_type}分数生成完成: {score}")
            return score
            
        except Exception as e:
            logger.error(f"生成{score_type}分数时出错: {e}")
            return 75  # 返回默认分数
    
    def evaluate_resume(self, resume_data: Dict[str, Any]) -> Tuple[int, int, int]:
        """
        评估简历并返回三个分数
        
        Args:
            resume_data: 简历JSON数据
            
        Returns:
            (overall_score, vertical_score, completeness_score)
        """
        try:
            # 提取简历信息
            resume_info = self._extract_resume_info(resume_data)
            logger.info("简历信息提取完成")
            
            # 生成三个分数
            overall_score = self._generate_score(resume_info, "overall")
            vertical_score = self._generate_score(resume_info, "vertical")
            completeness_score = self._generate_score(resume_info, "completeness")
            
            logger.info(f"评估完成 - 整体: {overall_score}, 垂直一致性: {vertical_score}, 完整性: {completeness_score}")
            return overall_score, vertical_score, completeness_score
            
        except Exception as e:
            logger.error(f"评估简历时出错: {e}")
            raise
    
    def process_resume_file(self, file_path: str) -> Tuple[int, int, int]:
        """
        处理简历JSON文件并评估
        
        Args:
            file_path: 简历JSON文件路径
            
        Returns:
            (overall_score, vertical_score, completeness_score)
        """
        try:
            # 读取JSON文件
            with open(file_path, 'r', encoding='utf-8') as f:
                resume_data = json.load(f)
            
            logger.info(f"成功读取简历文件: {file_path}")
            
            # 评估简历
            scores = self.evaluate_resume(resume_data)
            return scores
            
        except FileNotFoundError:
            logger.error(f"文件未找到: {file_path}")
            raise
        except json.JSONDecodeError:
            logger.error(f"JSON文件格式错误: {file_path}")
            raise
        except Exception as e:
            logger.error(f"处理文件时出错: {e}")
            raise
    
    def save_scores(self, scores: Tuple[int, int, int], output_file: str = "score/resume_scores.csv"):
        """
        保存分数到CSV文件
        
        Args:
            scores: (overall_score, vertical_score, completeness_score)
            output_file: 输出文件路径
        """
        try:
            # 确保目录存在
            os.makedirs(os.path.dirname(output_file), exist_ok=True)
            
            # 写入CSV文件
            with open(output_file, 'w', newline='', encoding='utf-8') as csvfile:
                writer = csv.writer(csvfile)
                writer.writerow(['overall', 'vertical', 'completeness'])
                writer.writerow(scores)
            
            logger.info(f"分数已保存到: {output_file}")
            
        except Exception as e:
            logger.error(f"保存分数时出错: {e}")
            raise

def main():
    """主函数，演示如何使用ResumeEvaluator"""
    
    # 初始化评估器
    evaluator = ResumeEvaluator()
    
    # 处理示例简历文件
    resume_file = "sample/lsy_resume.json"
    
    if os.path.exists(resume_file):
        try:
            # 评估简历
            overall, vertical, completeness = evaluator.process_resume_file(resume_file)
            
            # 输出结果
            print("\n" + "="*50)
            print("简历评估结果:")
            print("="*50)
            print(f"整体分数: {overall}/100")
            print(f"垂直一致性分数: {vertical}/100")
            print(f"完整性分数: {completeness}/100")
            print("="*50)
            
            # 保存到CSV文件
            evaluator.save_scores((overall, vertical, completeness))
            
        except Exception as e:
            print(f"评估失败: {e}")
    else:
        print(f"简历文件不存在: {resume_file}")
        print("请确保sample/lsy_resume.json文件存在")

if __name__ == "__main__":
    main() 