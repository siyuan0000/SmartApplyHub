#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Resume About Generator - ResumeAboutGenerator

Process resume JSON files and generate LinkedIn-style about introductions.

Quick usage:
    from util.resume_about_generator import ResumeAboutGenerator
    generator = ResumeAboutGenerator()
    about_text = generator.process_resume_file("resume.json")

Note: The actual model implementation is managed by ModelRouter in __init__.py
"""

import json
import logging
from typing import Dict, Any, Optional
import os
from datetime import datetime
from pathlib import Path

# Load environment variables from .env.local file
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
                        # Remove quotes if present
                        value = value.strip('"\'')
                        os.environ[key.strip()] = value.strip()
            print(f"✓ Loaded environment variables from {env_file}")
        except Exception as e:
            print(f"Warning: Failed to load .env.local file: {e}")

# Load environment variables at module import
load_env_file()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Try to import DeepSeek API support
try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False

# Simple DeepSeek API wrapper
class SimpleDeepSeekGenerator:
    """Simple DeepSeek API wrapper for about generation"""
    
    def __init__(self):
        if not OPENAI_AVAILABLE:
            raise ImportError("OpenAI package required")
        
        api_key = os.getenv("DEEPSEEK_API_KEY")
        if not api_key:
            raise ValueError("DEEPSEEK_API_KEY not found")
        
        self.client = OpenAI(api_key=api_key, base_url="https://api.deepseek.com")
        self.model = "deepseek-chat"
    
    def generate_about(self, resume_data):
        """Generate about text using DeepSeek API"""
        # Extract resume info
        info_parts = []
        contact = resume_data.get('contact', {})
        if contact.get('name'):
            info_parts.append(f"Name: {contact['name']}")
        
        education = resume_data.get('education', [])
        if education:
            edu = education[0]
            degree = edu.get('degree', '')
            school = edu.get('school', '')
            if degree and school:
                info_parts.append(f"Education: {degree} at {school}")
        
        research = resume_data.get('research', [])
        if research:
            res = research[0]
            position = res.get('position', '')
            lab = res.get('lab', '')
            if position and lab:
                info_parts.append(f"Position: {position} at {lab}")
        
        skills = resume_data.get('skills', {})
        if skills.get('languages'):
            info_parts.append(f"Skills: {', '.join(skills['languages'][:5])}")
        
        resume_info = "\n".join(info_parts)
        
        # Create prompt
        system_prompt = (
            "You are a professional LinkedIn about text generator. Create a compelling, "
            "professional LinkedIn about section (100-150 words) that will attract "
            "recruiters and networking opportunities. Use first person perspective, "
            "be professional but engaging, highlight key achievements and expertise."
        )
        
        user_prompt = f"Generate LinkedIn about text from:\n{resume_info}"
        
        # Call API
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                max_tokens=200,
                temperature=0.7
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            logger.error(f"DeepSeek API call failed: {e}")
            return f"LinkedIn About generation failed: {e}"

# Try to initialize DeepSeek support
DEEPSEEK_AVAILABLE = False
try:
    if OPENAI_AVAILABLE and os.getenv("DEEPSEEK_API_KEY"):
        DEEPSEEK_AVAILABLE = True
        logger.info("DeepSeek API support available")
    else:
        logger.warning("DeepSeek API not available - missing API key or OpenAI package")
except Exception as e:
    logger.warning(f"DeepSeek setup failed: {e}")

class ResumeAboutGenerator:
    """
    Resume About Generator class
    Generates LinkedIn-style about introductions
    """
    
    def __init__(self, model_path: str = None):
        """
        Initialize the generator
        
        Args:
            model_path: Model path, managed by ModelRouter
        """
        self.model_path = model_path
        
        # Try to initialize DeepSeek generator
        self.deepseek_generator = None
        if DEEPSEEK_AVAILABLE:
            try:
                self.deepseek_generator = SimpleDeepSeekGenerator()
                logger.info("DeepSeek about generator initialized successfully")
            except Exception as e:
                logger.warning(f"Failed to initialize DeepSeek generator: {e}")
        
        # Ensure about folder exists
        self.about_folder = "about"
        self._ensure_about_folder()
        
        logger.info("ResumeAboutGenerator initialization completed")
    
    def _ensure_about_folder(self):
        """Ensure about folder exists"""
        if not os.path.exists(self.about_folder):
            os.makedirs(self.about_folder)
            logger.info(f"Created about folder: {self.about_folder}")
    
    def _extract_resume_info(self, resume_data: Dict[str, Any]) -> str:
        """
        Extract key information from resume JSON
        
        Args:
            resume_data: Resume JSON data
            
        Returns:
            Formatted resume information string
        """
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
        
        # Extract education background
        education = resume_data.get('education', [])
        if education:
            latest_edu = education[0]  # Assume sorted by time in reverse order
            school = latest_edu.get('school', '')
            degree = latest_edu.get('degree', '')
            if school and degree:
                info_parts.append(f"Education: {degree} at {school}")
        
        # Extract research experience
        research = resume_data.get('research', [])
        if research:
            current_research = research[0]  # Current research
            position = current_research.get('position', '')
            lab = current_research.get('lab', '')
            project = current_research.get('project', '')
            if position and lab:
                info_parts.append(f"Current Position: {position} at {lab}")
            if project:
                info_parts.append(f"Project: {project}")
        
        # Extract skills
        skills = resume_data.get('skills', {})
        if skills:
            languages = skills.get('languages', [])
            if languages:
                info_parts.append(f"Programming Languages: {', '.join(languages)}")
            
            software = skills.get('software', [])
            if software:
                info_parts.append(f"Software Tools: {', '.join(software)}")
        
        # Extract awards
        awards = resume_data.get('awards', [])
        if awards:
            info_parts.append(f"Awards: {'; '.join(awards)}")
        
        # Extract publications
        publications = resume_data.get('publications', [])
        if publications:
            info_parts.append(f"Publications: {len(publications)} papers published")
        
        return "\n".join(info_parts)
    
    def _create_prompt(self, resume_info: str) -> str:
        """
        Create prompt for generating about text
        
        Args:
            resume_info: Resume information string
            
        Returns:
            Formatted prompt
        """
        prompt = f"""<|im_start|>system
You are a professional LinkedIn about text generator. Please generate a concise, professional LinkedIn about introduction (100-150 words) based on the following resume information.

Requirements:
1. Professional and LinkedIn-appropriate tone
2. Highlight key achievements and skills
3. Focus on career goals and expertise
4. Keep it concise (100-150 words)
5. Use first person perspective
6. Make it engaging and professional

Resume information:
{resume_info}

LinkedIn About: <|im_end|>
<|im_start|>assistant
"""
        
        return prompt
    
    def generate_about(self, resume_data: Dict[str, Any]) -> str:
        """
        Generate LinkedIn-style about text from resume data
        
        Args:
            resume_data: Resume JSON data
            
        Returns:
            Generated about text
        """
        try:
            # Use DeepSeek generator if available
            if self.deepseek_generator:
                logger.info("Using DeepSeek API for about generation")
                return self.deepseek_generator.generate_about(resume_data)
            
            # Fallback to prompt generation for compatibility
            logger.warning("DeepSeek API not available, returning prompt only")
            
            # Extract resume information
            resume_info = self._extract_resume_info(resume_data)
            logger.info("Resume information extraction completed")
            
            # Create prompt
            prompt = self._create_prompt(resume_info)
            logger.info("About generation prompt prepared")
            
            return prompt
            
        except Exception as e:
            logger.error(f"Error generating about text: {e}")
            raise
    
    def save_about_to_file(self, about_text: str, filename: str = None, person_name: str = None) -> str:
        """
        Save about text to file
        
        Args:
            about_text: Generated about text
            filename: Output filename, auto-generated if None
            person_name: Person's name for filename
            
        Returns:
            Saved file path
        """
        try:
            # Generate filename if not provided
            if filename is None:
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                if person_name:
                    # Clean person name for filename
                    clean_name = person_name.replace(" ", "_").replace(",", "").replace(".", "")
                    filename = f"{clean_name}_about_{timestamp}.txt"
                else:
                    filename = f"about_{timestamp}.txt"
            
            # Ensure filename has .txt extension
            if not filename.endswith('.txt'):
                filename += '.txt'
            
            # Full file path
            file_path = os.path.join(self.about_folder, filename)
            
            # Write to file
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(about_text)
            
            logger.info(f"About text saved to: {file_path}")
            return file_path
            
        except Exception as e:
            logger.error(f"Error saving about text: {e}")
            raise
    
    def process_resume_file(self, file_path: str, save_to_file: bool = True, output_filename: str = None) -> str:
        """
        Process resume JSON file and generate about text
        
        Args:
            file_path: Resume JSON file path
            save_to_file: Whether to save to file, default True
            output_filename: Output filename, auto-generated if None
            
        Returns:
            Generated about text
        """
        try:
            # Read JSON file
            with open(file_path, 'r', encoding='utf-8') as f:
                resume_data = json.load(f)
            
            logger.info(f"Successfully read resume file: {file_path}")
            
            # Extract person name for filename
            contact = resume_data.get('contact', {})
            person_name = contact.get('name', '') if contact else None
            
            # Generate about text
            about_text = self.generate_about(resume_data)
            
            # Save to file if requested
            if save_to_file:
                self.save_about_to_file(about_text, output_filename, person_name)
            
            return about_text
            
        except FileNotFoundError:
            logger.error(f"File not found: {file_path}")
            raise
        except json.JSONDecodeError:
            logger.error(f"JSON file format error: {file_path}")
            raise
        except Exception as e:
            logger.error(f"Error processing file: {e}")
            raise

def main():
    """Main function, demonstrates how to use ResumeAboutGenerator"""
    
    # Initialize generator
    generator = ResumeAboutGenerator()
    
    # Process example resume file
    resume_file = "../sample/lsy_resume.json"
    
    if os.path.exists(resume_file):
        try:
            # Generate about text
            about_text = generator.process_resume_file(resume_file)
            
            # Output results
            print("\n" + "="*50)
            print("Generated LinkedIn About:")
            print("="*50)
            print(about_text)
            print("="*50)
            
        except Exception as e:
            print(f"Generation failed: {e}")
    else:
        print(f"Resume file does not exist: {resume_file}")
        print("Please ensure sample/lsy_resume.json file exists")

if __name__ == "__main__":
    main() 