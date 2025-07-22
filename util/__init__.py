#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Resume Processing System - Main Module

This module provides a unified interface for resume processing, including:
- Resume evaluation with letter grades
- LinkedIn "About" section generation
- Model routing (DeepSeek API or local models)

Quick usage:
    from util import ResumeProcessor
    processor = ResumeProcessor()
    results = processor.process_resume_file("resume.json")
"""

import os
import json
import logging
from typing import Dict, Any, Tuple, Optional
from pathlib import Path

# Load environment variables from .env.local if it exists
def load_env_file():
    """Load environment variables from .env.local file"""
    env_file = Path(__file__).parent.parent / ".env.local"
    if env_file.exists():
        try:
            with open(env_file, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#') and '=' in line:
                        key, value = line.split('=', 1)
                        os.environ[key.strip()] = value.strip()
            print(f"✓ Loaded environment variables from {env_file}")
        except Exception as e:
            print(f"Warning: Failed to load .env.local file: {e}")

# Load environment variables at module import
load_env_file()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

from enum import Enum
import re

# Import the utility classes
try:
    from .resume_about_generator import ResumeAboutGenerator
    from .resume_evaluator import ResumeEvaluator
    # from .resume_section_splitter import split_resume_sections_from_text  # temporarily disabled
    split_resume_sections_from_text = None  # placeholder
except ImportError:
    # Fallback for direct execution
    from resume_about_generator import ResumeAboutGenerator
    from resume_evaluator import ResumeEvaluator
    # from resume_section_splitter import split_resume_sections_from_text  # temporarily disabled
    split_resume_sections_from_text = None  # placeholder

# DeepSeek API support
try:
    from openai import OpenAI
    DEEPSEEK_AVAILABLE = True
except ImportError:
    DEEPSEEK_AVAILABLE = False
    print("Warning: OpenAI package not available. DeepSeek API will be disabled.")

class ModelType(Enum):
    """Available model types"""
    QWEN_1_5B = "Qwen2.5-1.5B-Instruct"
    QWEN_7B = "Qwen2.5-7B-Instruct"
    DEEPSEEK_API = "deepseek-chat"

class DeepSeekAPIProcessor:
    """
    DeepSeek API processor for resume processing operations.
    
    This class provides an interface for using DeepSeek API instead of local models.
    """
    
    def __init__(self, api_key: str, base_url: str = "https://api.deepseek.com"):
        """
        Initialize the DeepSeek API processor.
        
        Args:
            api_key: DeepSeek API key
            base_url: DeepSeek API base URL
        """
        if not DEEPSEEK_AVAILABLE:
            raise ImportError("OpenAI package not available. Please install it with: pip install openai")
        
        self.client = OpenAI(api_key=api_key, base_url=base_url)
        self.model = "deepseek-chat"
        self.api_key_valid = self._test_api_key()
    
    def _test_api_key(self) -> bool:
        """Test if the API key is valid"""
        try:
            # Simple test call
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": "Hello"}],
                max_tokens=5
            )
            return True
        except Exception as e:
            print(f"Warning: DeepSeek API key is invalid or not provided. Error: {e}")
            print("Falling back to local model processing...")
            return False
    
    def _call_api(self, messages: list) -> str:
        """
        Call DeepSeek API with messages.
        
        Args:
            messages: List of message dictionaries
            
        Returns:
            API response content
        """
        if not self.api_key_valid:
            # Return a mock response for testing when API key is invalid
            return "A"  # Default grade for testing
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                stream=False
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"Warning: DeepSeek API call failed: {e}")
            return "B"  # Default grade for testing
    
    def generate_about(self, resume_data: Dict[str, Any]) -> str:
        """
        Generate LinkedIn-style about text using DeepSeek API.
        
        Args:
            resume_data: Resume data in JSON format
            
        Returns:
            Generated about text
        """
        # Extract resume information
        resume_info = self._extract_resume_info(resume_data)
        
        # Create prompt
        prompt = f"""You are a professional LinkedIn about text generator. 
Please create a concise, professional LinkedIn about text (100-150 words) based on the following resume information:

{resume_info}

Requirements:
1. Professional and LinkedIn-appropriate tone
2. Highlight key achievements and skills
3. Focus on career goals and expertise
4. Keep it concise (100-150 words)
5. Use first person perspective

LinkedIn About:"""
        
        messages = [
            {"role": "system", "content": "You are a professional LinkedIn about text generator."},
            {"role": "user", "content": prompt}
        ]
        
        return self._call_api(messages)
    
    def evaluate_resume(self, resume_data: Dict[str, Any]) -> Tuple[str, str, str]:
        """
        Evaluate resume using DeepSeek API and return three grades.
        
        Args:
            resume_data: Resume data in JSON format
            
        Returns:
            Tuple of (overall_grade, vertical_grade, completeness_grade)
        """
        resume_info = self._extract_resume_info(resume_data)
        
        # Load evaluation criteria
        criteria_file = "score/criteria.json"
        try:
            with open(criteria_file, 'r', encoding='utf-8') as f:
                criteria = json.load(f)
        except:
            criteria = {}
        
        # Generate overall grade
        overall_criteria = criteria.get("Overall Grade", {})
        overall_description = overall_criteria.get("description", "")
        overall_prompt = f"""You are a resume evaluation expert. 
Please evaluate the following resume and provide an overall grade (A+, A, A-, B+, B, B-, C+, C, C-, F):

{resume_info}

Evaluation criteria:
{overall_description}

Please respond with only a single letter grade (A+, A, A-, B+, B, B-, C+, C, C-, F):"""
        
        overall_response = self._call_api([
            {"role": "system", "content": "You are a resume evaluation expert."},
            {"role": "user", "content": overall_prompt}
        ])
        
        # Generate vertical consistency grade
        vertical_criteria = criteria.get("Vertical Consistency Grade", {})
        vertical_description = vertical_criteria.get("description", "")
        vertical_prompt = f"""You are a resume evaluation expert.
Please evaluate the vertical consistency of this resume (A+, A, A-, B+, B, B-, C+, C, C-, F):

{resume_info}

Vertical consistency criteria:
{vertical_description}

Please respond with only a single letter grade (A+, A, A-, B+, B, B-, C+, C, C-, F):"""
        
        vertical_response = self._call_api([
            {"role": "system", "content": "You are a resume evaluation expert."},
            {"role": "user", "content": vertical_prompt}
        ])
        
        # Generate completeness grade
        completeness_criteria = criteria.get("Completeness Grade", {})
        completeness_description = completeness_criteria.get("description", "")
        completeness_prompt = f"""You are a resume evaluation expert.
Please evaluate the completeness of this resume (A+, A, A-, B+, B, B-, C+, C, C-, F):

{resume_info}

Completeness criteria:
{completeness_description}

Please respond with only a single letter grade (A+, A, A-, B+, B, B-, C+, C, C-, F):"""
        
        completeness_response = self._call_api([
            {"role": "system", "content": "You are a resume evaluation expert."},
            {"role": "user", "content": completeness_prompt}
        ])
        
        # Extract grades
        overall_grade = self._extract_grade(overall_response)
        vertical_grade = self._extract_grade(vertical_response)
        completeness_grade = self._extract_grade(completeness_response)
        
        return overall_grade, vertical_grade, completeness_grade
    
    def _extract_resume_info(self, resume_data: Dict[str, Any]) -> str:
        """Extract key information from resume data."""
        info_parts = []
        
        # Extract basic information
        contact = resume_data.get('contact', {})
        if contact:
            name = contact.get('name', '')
            location = contact.get('location', '')
            if name:
                info_parts.append(f"Name: {name}")
            if location:
                info_parts.append(f"Location: {location}")
        
        # Extract education
        education = resume_data.get('education', [])
        if education:
            for i, edu in enumerate(education):
                school = edu.get('school', '')
                degree = edu.get('degree', '')
                start_date = edu.get('startDate', '')
                end_date = edu.get('endDate', '')
                info_parts.append(f"Education {i+1}: {degree} at {school} ({start_date} - {end_date})")
        
        # Extract research/work experience
        research = resume_data.get('research', [])
        if research:
            for i, res in enumerate(research):
                position = res.get('position', '')
                lab = res.get('lab', '')
                project = res.get('project', '')
                date = res.get('date', '')
                info_parts.append(f"Experience {i+1}: {position} at {lab}, Project: {project}, Period: {date}")
        
        # Extract skills
        skills = resume_data.get('skills', {})
        if skills:
            languages = skills.get('languages', [])
            software = skills.get('software', [])
            if languages:
                info_parts.append(f"Programming Languages: {', '.join(languages)}")
            if software:
                info_parts.append(f"Software Tools: {', '.join(software)}")
        
        # Extract awards
        awards = resume_data.get('awards', [])
        if awards:
            info_parts.append(f"Awards: {'; '.join(awards)}")
        
        # Extract publications
        publications = resume_data.get('publications', [])
        if publications:
            for i, pub in enumerate(publications):
                title = pub.get('title', '')
                venue = pub.get('venue', '')
                date = pub.get('date', '')
                authors = pub.get('authors', [])
                info_parts.append(f"Publication {i+1}: {title}, Venue: {venue}, Date: {date}, Authors: {', '.join(authors[:3])}")
        
        return "\n".join(info_parts)
    
    def _extract_grade(self, response: str) -> str:
        """Extract letter grade from API response."""
        import re
        try:
            # Look for letter grades in the response
            grade_pattern = r'\b([ABC][+-]?|F)\b'
            grade_match = re.search(grade_pattern, response)
            if grade_match:
                grade = grade_match.group(1)
                # Validate grade
                valid_grades = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'F']
                if grade in valid_grades:
                    return grade
            return "B"  # Default grade
        except:
            return "B"  # Default grade

class ModelRouter:
    """
    Router for managing different AI models in resume processing utilities.
    
    This class provides a unified interface for accessing different models
    and automatically handles model loading, caching, and fallback strategies.
    """
    
    def __init__(self, model_name: str = "deepseek-chat", api_key: str = None, base_url: str = None):
        """
        Initialize the model router.
        
        Args:
            model_name: Name of the model to use. Options:
                - "deepseek-chat" (default, DeepSeek API)
                - "Qwen2.5-1.5B-Instruct" (balanced performance)
                - "Qwen2.5-7B-Instruct" (high performance, more memory)
            api_key: DeepSeek API key (required for deepseek-chat model)
            base_url: DeepSeek API base URL (optional, defaults to https://api.deepseek.com)
        """
        self.model_name = model_name
        self._about_generator = None
        self._evaluator = None
        self._deepseek_processor = None
        self._tokenizer = None
        self._model = None
        self._device = None
        
        # Handle DeepSeek API (default)
        if model_name == "deepseek-chat":
            if not api_key:
                # Use environment variable DEEPSEEK_API_KEY
                api_key = os.getenv("DEEPSEEK_API_KEY")
                if not api_key:
                    print("Warning: DEEPSEEK_API_KEY environment variable not set.")
                    print("Falling back to local model...")
                    self.model_name = "Qwen2.5-1.5B-Instruct"
                    self._model_path = self._get_model_path(self.model_name)
                    self._load_local_model()
                    return
                else:
                    self._model_path = None
            
            try:
                self._deepseek_processor = DeepSeekAPIProcessor(api_key, base_url or "https://api.deepseek.com")
                if not self._deepseek_processor.api_key_valid:
                    print("DeepSeek API key is invalid. Falling back to local model...")
                    self.model_name = "Qwen2.5-1.5B-Instruct"
                    self._deepseek_processor = None
                    self._model_path = self._get_model_path(self.model_name)
                    self._load_local_model()
                else:
                    self._model_path = None
            except Exception as e:
                print(f"Failed to initialize DeepSeek API: {e}")
                print("Falling back to local model...")
                self.model_name = "Qwen2.5-1.5B-Instruct"
                self._deepseek_processor = None
                self._model_path = self._get_model_path(self.model_name)
                self._load_local_model()
        else:
            # Local model path
            self._model_path = self._get_model_path(model_name)
            self._load_local_model()
        
        # Ensure _model_path is always set for compatibility
        if not hasattr(self, '_model_path'):
            self._model_path = None
    
    def _get_model_path(self, model_name: str) -> str:
        """
        Get the local model path for the specified model.
        
        Args:
            model_name: Name of the model
            
        Returns:
            Local path to the model directory
        """
        base_path = "../models"
        model_path = os.path.join(base_path, model_name)
        
        # Check if model exists locally
        if os.path.exists(model_path):
            return model_path
        else:
            # Fallback to HuggingFace model name
            return model_name
    
    def _get_about_generator(self) -> ResumeAboutGenerator:
        """Get or create the about generator instance."""
        if self._about_generator is None:
            self._about_generator = ResumeAboutGenerator(model_path=self._model_path)
        return self._about_generator
    
    def _load_local_model(self):
        """Load local model and tokenizer."""
        try:
            import torch
            from transformers import AutoTokenizer, AutoModelForCausalLM
            
            self._device = "cuda" if torch.cuda.is_available() else "cpu"
            
            # Load tokenizer
            self._tokenizer = AutoTokenizer.from_pretrained(
                "Qwen/Qwen2.5-1.5B-Instruct",
                trust_remote_code=True
            )
            
            # Load model
            try:
                self._model = AutoModelForCausalLM.from_pretrained(
                    self._model_path,
                    torch_dtype=torch.float16 if self._device == "cuda" else torch.float32,
                    device_map="auto" if self._device == "cuda" else None,
                    trust_remote_code=True,
                    low_cpu_mem_usage=True,
                    offload_folder="offload"
                )
            except Exception as e:
                # Fallback to HuggingFace
                self._model = AutoModelForCausalLM.from_pretrained(
                    "Qwen/Qwen2.5-1.5B-Instruct",
                    torch_dtype=torch.float16 if self._device == "cuda" else torch.float32,
                    device_map="auto" if self._device == "cuda" else None,
                    trust_remote_code=True,
                    low_cpu_mem_usage=True
                )
                
        except Exception as e:
            raise Exception(f"Failed to load local model: {e}")
    
    def _call_model(self, prompt: str, max_new_tokens: int = 200, temperature: float = 0.7) -> str:
        """
        Call the local model with a prompt.
        
        Args:
            prompt: Input prompt
            max_new_tokens: Maximum new tokens to generate
            temperature: Sampling temperature
            
        Returns:
            Generated text
        """
        import torch
        
        # Encode input
        inputs = self._tokenizer(prompt, return_tensors="pt").to(self._device)
        
        # Generate text
        with torch.no_grad():
            outputs = self._model.generate(
                **inputs,
                max_new_tokens=max_new_tokens,
                temperature=temperature,
                top_p=0.9,
                do_sample=True,
                pad_token_id=self._tokenizer.eos_token_id
            )
        
        # Decode output
        generated_text = self._tokenizer.decode(outputs[0], skip_special_tokens=True)
        
        # Extract the generated part
        about_start = generated_text.find("Please generate LinkedIn-style about introduction:")
        if about_start != -1:
            about_text = generated_text[about_start + len("Please generate LinkedIn-style about introduction:"):].strip()
        else:
            # If Chinese prompt not found, try English prompt
            about_start = generated_text.find("Generate the LinkedIn-style 'About' section in English:")
            if about_start != -1:
                about_text = generated_text[about_start + len("Generate the LinkedIn-style 'About' section in English:"):].strip()
            else:
                about_text = generated_text.strip()
        
        # Clean output text
        if about_text.startswith("assistant"):
            about_text = about_text[9:].strip()
        
        return about_text
    
    def _evaluate_with_prompts(self, prompts: Tuple[str, str, str]) -> Tuple[str, str, str]:
        """
        Evaluate resume using three prompts.
        
        Args:
            prompts: Tuple of (overall_prompt, vertical_prompt, completeness_prompt)
            
        Returns:
            Tuple of (overall_grade, vertical_grade, completeness_grade)
        """
        overall_prompt, vertical_prompt, completeness_prompt = prompts
        
        # Generate grades using model
        overall_response = self._call_model(overall_prompt, max_new_tokens=50, temperature=0.3)
        vertical_response = self._call_model(vertical_prompt, max_new_tokens=50, temperature=0.3)
        completeness_response = self._call_model(completeness_prompt, max_new_tokens=50, temperature=0.3)
        
        # Print raw responses
        print(f"Overall response: {overall_response}")
        print(f"Vertical response: {vertical_response}")
        print(f"Completeness response: {completeness_response}")
        
        # Extract grades
        overall_grade = self._extract_grade_from_response(overall_response)
        vertical_grade = self._extract_grade_from_response(vertical_response)
        completeness_grade = self._extract_grade_from_response(completeness_response)
        
        return overall_grade, vertical_grade, completeness_grade
    
    def _extract_grade_from_response(self, response: str) -> str:
        """
        Extract letter grade from model response.
        
        Args:
            response: Model response
            
        Returns:
            Extracted letter grade (A+, A, A-, B+, B, B-, C+, C, C-, F)
        """
        import re
        
        try:
            # Clean response text
            if response.startswith("assistant"):
                response = response[9:].strip()
            
            # Look for letter grades in the response
            grade_pattern = r'\b([ABC][+-]?|F)\b'
            grade_match = re.search(grade_pattern, response)
            if grade_match:
                grade = grade_match.group(1)
                # Validate grade
                valid_grades = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'F']
                if grade in valid_grades:
                    return grade
            
            # If no valid grade found, return default
            # logger.warning(f"No valid grade found, response: {response}") # logger is not defined
            return "B"
        except:
            return "B"  # Default grade
    
    def _get_evaluator(self) -> ResumeEvaluator:
        """Get or create the evaluator instance."""
        if self._evaluator is None:
            self._evaluator = ResumeEvaluator(model_path=self._model_path)
        return self._evaluator
    
    def generate_about(self, resume_data: Dict[str, Any]) -> str:
        """
        Generate LinkedIn-style about text from resume data.
        
        Args:
            resume_data: Resume data in JSON format
            
        Returns:
            Generated about text
        """
        if self._deepseek_processor:
            return self._deepseek_processor.generate_about(resume_data)
        else:
            generator = self._get_about_generator()
            # Directly call model, not through generate_about method
            resume_info = generator._extract_resume_info(resume_data)
            prompt = generator._create_prompt(resume_info)
            return self._call_model(prompt)
    
    def process_resume_file_for_about(self, file_path: str, save_to_file: bool = True, output_filename: str = None) -> str:
        """
        Process resume file and generate about text.
        
        Args:
            file_path: Path to resume JSON file
            save_to_file: Whether to save to file, default True
            output_filename: Output filename, auto-generated if None (format: {person_name}_about_{timestamp}.txt)
            
        Returns:
            Generated about text
        """
        if self._deepseek_processor:
            # For DeepSeek API, directly use its method
            with open(file_path, 'r', encoding='utf-8') as f:
                import json
                resume_data = json.load(f)
            return self._deepseek_processor.generate_about(resume_data)
        else:
            # For local models, need to call model generation
            generator = self._get_about_generator()
            
            # Read file and extract information
            with open(file_path, 'r', encoding='utf-8') as f:
                import json
                resume_data = json.load(f)
            
            # Extract person name for filename
            contact = resume_data.get('contact', {})
            person_name = contact.get('name', '') if contact else None
            
            # Generate prompt and call model
            resume_info = generator._extract_resume_info(resume_data)
            prompt = generator._create_prompt(resume_info)
            generated_text = self._call_model(prompt)
            
            # Save generated text if needed
            if save_to_file:
                generator.save_about_to_file(generated_text, output_filename, person_name)
            
            return generated_text
    
    def evaluate_resume(self, resume_data: Dict[str, Any]) -> Tuple[str, str, str]:
        """
        Evaluate resume and return three grades.
        
        Args:
            resume_data: Resume data in JSON format
            
        Returns:
            Tuple of (overall_grade, vertical_grade, completeness_grade)
        """
        if self._deepseek_processor:
            return self._deepseek_processor.evaluate_resume(resume_data)
        else:
            evaluator = self._get_evaluator()
            # Directly call model, not through evaluate_resume method
            resume_info = evaluator._extract_resume_info(resume_data)
            overall_prompt = evaluator._create_evaluation_prompt(resume_info, "overall")
            vertical_prompt = evaluator._create_evaluation_prompt(resume_info, "vertical")
            completeness_prompt = evaluator._create_evaluation_prompt(resume_info, "completeness")
            return self._evaluate_with_prompts((overall_prompt, vertical_prompt, completeness_prompt))
    
    def process_resume_file_for_evaluation(self, file_path: str) -> Tuple[str, str, str]:
        """
        Process resume file and evaluate it.
        
        Args:
            file_path: Path to resume JSON file
            
        Returns:
            Tuple of (overall_grade, vertical_grade, completeness_grade)
        """
        # Read resume file
        with open(file_path, 'r', encoding='utf-8') as f:
            import json
            resume_data = json.load(f)
        
        # Use evaluate_resume method for evaluation
        return self.evaluate_resume(resume_data)
    
    def save_evaluation_grades(self, grades: Tuple[str, str, str], output_file: str = None, person_name: str = "Unknown"):
        """
        Save evaluation grades to CSV file with date as filename.
        
        Args:
            grades: Tuple of (overall_grade, vertical_grade, completeness_grade)
            output_file: Output file path (optional, will use date if not provided)
            person_name: Resume owner's name
        """
        evaluator = self._get_evaluator()
        evaluator.save_grades(grades, output_file, person_name)
    
    def split_resume_sections(self, resume_text: str) -> Dict[str, str]:
        """
        Split resume text into sections.
        
        Args:
            resume_text: Raw resume text
            
        Returns:
            Dictionary of section names to content
        """
        return split_resume_sections_from_text(resume_text)
    
    def get_model_info(self) -> Dict[str, Any]:
        """
        Get information about the current model configuration.
        
        Returns:
            Dictionary with model information
        """
        return {
            "model_name": self.model_name,
            "model_path": self._model_path,
            "local_model_exists": os.path.exists(self._model_path),
            "about_generator_loaded": self._about_generator is not None,
            "evaluator_loaded": self._evaluator is not None
        }

class ResumeProcessor:
    """
    High-level interface for resume processing operations.
    
    This class provides a simplified interface for common resume processing tasks,
    automatically handling model selection and initialization.
    """
    
    def __init__(self, model_name: str = "deepseek-chat", api_key: str = None, base_url: str = None):
        """
        Initialize the resume processor.
        
        Args:
            model_name: Name of the model to use
            api_key: DeepSeek API key (required for deepseek-chat model)
            base_url: DeepSeek API base URL (optional)
        """
        self.router = ModelRouter(model_name, api_key, base_url)
    
    def generate_about(self, resume_data: Dict[str, Any]) -> str:
        """Generate LinkedIn-style about text."""
        return self.router.generate_about(resume_data)
    
    def evaluate_resume(self, resume_data: Dict[str, Any]) -> Tuple[str, str, str]:
        """Evaluate resume and return grades."""
        return self.router.evaluate_resume(resume_data)
    
    def process_resume_file(self, file_path: str, save_about: bool = True, about_filename: str = None) -> Dict[str, Any]:
        """
        Process a resume file and return both about text and evaluation grades.
        
        Args:
            file_path: Path to resume JSON file
            save_about: Whether to save about text to file, default True
            about_filename: About text filename, auto-generated if None
            
        Returns:
            Dictionary containing about text and evaluation grades
        """
        about_text = self.router.process_resume_file_for_about(file_path, save_about, about_filename)
        grades = self.router.process_resume_file_for_evaluation(file_path)
        
        return {
            "about_text": about_text,
            "grades": {
                "overall": grades[0],
                "vertical_consistency": grades[1],
                "completeness": grades[2]
            }
        }
    
    def get_model_info(self) -> Dict[str, Any]:
        """Get model information."""
        return self.router.get_model_info()

# Convenience functions for quick access
def create_processor(model_name: str = "deepseek-chat", api_key: str = None, base_url: str = None) -> ResumeProcessor:
    """
    Create a resume processor with the specified model.
    
    Args:
        model_name: Name of the model to use
        api_key: DeepSeek API key (optional, will use DEEPSEEK_API_KEY env var if not provided)
        base_url: DeepSeek API base URL (optional)
        
    Returns:
        ResumeProcessor instance
    """
    # If no API key provided and using deepseek-chat, try to get from environment
    if model_name == "deepseek-chat" and not api_key:
        api_key = os.getenv("DEEPSEEK_API_KEY")
    
    return ResumeProcessor(model_name, api_key, base_url)

def get_available_models() -> Dict[str, str]:
    """
    Get list of available models and their descriptions.
    
    Returns:
        Dictionary mapping model names to descriptions
    """
    models = {}
    
    if DEEPSEEK_AVAILABLE:
        models["deepseek-chat"] = "DeepSeek API, requires API key (default)"
    
    models["Qwen2.5-1.5B-Instruct"] = "Balanced performance, lower memory usage"
    models["Qwen2.5-7B-Instruct"] = "High performance, requires more memory"
    
    return models

# Export main classes and functions
__all__ = [
    "ResumeProcessor",
    "ModelRouter", 
    "ModelType",
    "DeepSeekAPIProcessor",
    "create_processor",
    "get_available_models",
    "ResumeAboutGenerator",
    "ResumeEvaluator",
    "split_resume_sections_from_text"
] 