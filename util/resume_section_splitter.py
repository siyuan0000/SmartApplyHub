import os
import json
from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline

# 模型路径
MODEL_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '../Qwen2.5-1.5B-Instruct'))

# 加载模型和分词器
print('Loading model...')
tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH, trust_remote_code=True)
model = AutoModelForCausalLM.from_pretrained(MODEL_PATH, trust_remote_code=True)

pipe = pipeline('text-generation', model=model, tokenizer=tokenizer, max_new_tokens=2048)


def split_resume_sections(resume_json):
    """
    输入：简历json（dict），假设有一个 'content' 字段为原始文本
    输出：按section分割的json
    """
    prompt = f"""
你是一个智能简历分析助手。请将以下简历内容按照常见的section（如：个人信息、教育经历、工作经历、项目经历、技能、证书、获奖等）进行分段，输出一个JSON对象，每个section为一个key，内容为该部分的原文。

简历内容：
{resume_json['content']}

输出格式示例：
{{
  "个人信息": "...",
  "教育经历": "...",
  "工作经历": "...",
  ...
}}
"""
    result = pipe(prompt)[0]['generated_text']
    # 尝试提取JSON部分
    try:
        json_start = result.find('{')
        json_end = result.rfind('}') + 1
        section_json = json.loads(result[json_start:json_end])
    except Exception as e:
        print('解析模型输出失败:', e)
        section_json = {"error": "模型输出无法解析为JSON", "raw": result}
    return section_json


def main():
    import argparse
    parser = argparse.ArgumentParser(description='简历分section工具')
    parser.add_argument('input', help='输入简历json文件路径，需有content字段')
    parser.add_argument('output', help='输出分section后的json文件路径')
    args = parser.parse_args()

    with open(args.input, 'r', encoding='utf-8') as f:
        resume_json = json.load(f)
    sectioned = split_resume_sections(resume_json)
    with open(args.output, 'w', encoding='utf-8') as f:
        json.dump(sectioned, f, ensure_ascii=False, indent=2)
    print('分section结果已保存到', args.output)

if __name__ == '__main__':
    main() 