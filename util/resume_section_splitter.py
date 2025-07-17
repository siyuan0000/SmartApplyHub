import os
import json
from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline

# Model path
MODEL_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '../models/Qwen2.5-1.5B-Instruct'))

# Load model and tokenizer
print('Loading model...')
tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH, trust_remote_code=True)
model = AutoModelForCausalLM.from_pretrained(MODEL_PATH, trust_remote_code=True)

pipe = pipeline('text-generation', model=model, tokenizer=tokenizer, max_new_tokens=2048)


def split_resume_sections(resume_json):
    """
    Input: resume json (dict), assuming there's a 'content' field with original text
    Output: json split by sections
    """
    prompt = f"""
You are an intelligent resume analysis assistant. Please segment the following resume content according to common sections (such as: Personal Information, Education, Work Experience, Project Experience, Skills, Certificates, Awards, etc.), and output a JSON object where each section is a key and the content is the original text of that part.

Resume content:
{resume_json['content']}

Output format example:
{{
  "Personal Information": "...",
  "Education": "...",
  "Work Experience": "...",
  ...
}}
"""
    result = pipe(prompt)[0]['generated_text']
    # Try to extract JSON part
    try:
        json_start = result.find('{')
        json_end = result.rfind('}') + 1
        section_json = json.loads(result[json_start:json_end])
    except Exception as e:
        print('Failed to parse model output:', e)
        section_json = {"error": "Model output cannot be parsed as JSON", "raw": result}
    return section_json


def main():
    import argparse
    parser = argparse.ArgumentParser(description='Resume section splitting tool')
    parser.add_argument('input', help='Input resume json file path, must have content field')
    parser.add_argument('output', help='Output path for sectioned json file')
    args = parser.parse_args()

    with open(args.input, 'r', encoding='utf-8') as f:
        resume_json = json.load(f)
    sectioned = split_resume_sections(resume_json)
    with open(args.output, 'w', encoding='utf-8') as f:
        json.dump(sectioned, f, ensure_ascii=False, indent=2)
    print('Sectioned result saved to', args.output)

if __name__ == '__main__':
    main() 