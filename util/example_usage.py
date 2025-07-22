#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Example usage of DeepSeek Resume Evaluation System

This script demonstrates how to use the robust DeepSeek API evaluator for:
- Resume evaluation with letter grades (A+, A, A-, B+, B, B-, C+, C, C-, F)
- CSV output with proper formatting
- Error handling and graceful fallbacks
"""

import os
import json
from typing import Dict, Any

def demonstrate_deepseek_evaluation():
    """Demonstrate DeepSeek API resume evaluation"""
    
    print("DeepSeek Resume Evaluation System")
    print("=" * 45)
    
    # Use the actual lsy_resume.json file
    resume_file = "../sample/lsy_resume.json"
    
    if not os.path.exists(resume_file):
        print(f"❌ Resume file not found: {resume_file}")
        return False, None
    
    try:
        # Import the robust evaluator - try deepseek first, fallback to resume_evaluator
        try:
            from deepseek_resume_evaluator import DeepSeekResumeEvaluator
            evaluator = DeepSeekResumeEvaluator()
            print("Using DeepSeek Resume Evaluator")
        except ImportError:
            from resume_evaluator import ResumeEvaluator
            evaluator = ResumeEvaluator()
            print("Using Resume Evaluator (fallback)")
        
        # Create evaluator (uses DEEPSEEK_API_KEY from environment)
        print("Initializing evaluator...")
        
        # Load resume data to get person name
        with open(resume_file, 'r', encoding='utf-8') as f:
            resume_data = json.load(f)
        
        # Extract person name
        contact = resume_data.get('contact', {})
        person_name = contact.get('name', 'Unknown')
        
        print(f"Processing: {person_name}")
        if hasattr(evaluator, 'model'):
            print(f"Using model: {evaluator.model}")
        
        # Evaluate resume
        print("\nEvaluating resume...")
        overall, vertical, completeness = evaluator.evaluate_resume(resume_data)
        
        print(f"\n📊 EVALUATION RESULTS:")
        print(f"  Overall Grade:               {overall}")
        print(f"  Vertical Consistency Grade:  {vertical}")
        print(f"  Completeness Grade:          {completeness}")
        
        # Save grades to CSV
        print("\nSaving results to CSV...")
        if hasattr(evaluator, 'save_grades_to_csv'):
            csv_file = evaluator.save_grades_to_csv(
                (overall, vertical, completeness), 
                person_name
            )
        else:
            # Fallback for resume_evaluator
            evaluator.save_grades((overall, vertical, completeness), None, person_name)
            csv_file = "score/resume_grades_*.csv"
        print(f"✅ Results saved to: {csv_file}")
        
        # Also generate LinkedIn about text using resume_about_generator
        print("\n📝 Generating LinkedIn About Text with DeepSeek API...")
        try:
            from resume_about_generator import ResumeAboutGenerator
            about_generator = ResumeAboutGenerator()
            about_text = about_generator.generate_about(resume_data)
            
            print(f"\n📝 GENERATED ABOUT TEXT:")
            print("-" * 40)
            print(about_text[:200] + "..." if len(about_text) > 200 else about_text)
            print("-" * 40)
            
            # Save about text to file
            about_file = about_generator.save_about_to_file(about_text, None, person_name)
            print(f"✅ About text saved to: {about_file}")
            
        except Exception as e:
            print(f"⚠️  About text generation failed: {e}")
        
        return True, (overall, vertical, completeness)
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        print("Make sure to install: pip install openai")
        return False, None
        
    except ValueError as e:
        print(f"❌ Configuration error: {e}")
        print("Make sure DEEPSEEK_API_KEY environment variable is set")
        return False, None
        
    except Exception as e:
        print(f"❌ Error processing resume: {e}")
        return False, None

def demonstrate_different_usage_methods(grades):
    """Demonstrate different ways to use the evaluator without re-evaluating"""
    
    print("\n" + "=" * 45)
    print("Different Usage Methods (using same results)")
    print("=" * 45)
    
    if grades:
        overall, vertical, completeness = grades
        
        print("📈 RESULTS FROM PREVIOUS EVALUATION:")
        print(f"  Overall: {overall}")
        print(f"  Vertical: {vertical}")  
        print(f"  Completeness: {completeness}")
        
        print("\n📝 ALTERNATIVE USAGE METHODS:")
        print("1. Direct file evaluation:")
        print("   grades = evaluator.evaluate_resume_file('resume.json')")
        print()
        print("2. From resume data:")
        print("   grades = evaluator.evaluate_resume(resume_data)")
        print()
        print("3. Command line:")
        print("   python deepseek_resume_evaluator.py resume.json")
        
        return True
    else:
        print("❌ No grades available from previous evaluation")
        return False

def show_usage_examples():
    """Show different ways to use the evaluator"""
    
    print("\n" + "=" * 45)
    print("USAGE EXAMPLES")
    print("=" * 45)
    
    print("1. Basic usage:")
    print("   from deepseek_resume_evaluator import DeepSeekResumeEvaluator")
    print("   evaluator = DeepSeekResumeEvaluator()")
    print("   grades = evaluator.evaluate_resume_file('resume.json')")
    print()
    
    print("2. With custom API key:")
    print("   evaluator = DeepSeekResumeEvaluator(api_key='your_key')")
    print()
    
    print("3. Command line usage:")
    print("   python deepseek_resume_evaluator.py resume.json")
    print()
    
    print("4. Environment setup:")
    print("   export DEEPSEEK_API_KEY='your_api_key_here'")

def demonstrate_resume_evaluation():
    """Demonstrate resume evaluation using resume_evaluator.py"""
    
    print("Resume Evaluation using resume_evaluator.py")
    print("=" * 50)
    
    # Resume file path
    resume_file = "../sample/lsy_resume.json"
    
    if not os.path.exists(resume_file):
        print(f"❌ Resume file not found: {resume_file}")
        return False, None
    
    try:
        # Import and use ResumeEvaluator
        from resume_evaluator import ResumeEvaluator
        
        print("Initializing ResumeEvaluator...")
        evaluator = ResumeEvaluator()
        
        # Load resume data to get person name
        with open(resume_file, 'r', encoding='utf-8') as f:
            resume_data = json.load(f)
        
        person_name = resume_data.get('contact', {}).get('name', 'Unknown')
        print(f"Processing: {person_name}")
        
        # Evaluate resume
        print("\nEvaluating resume...")
        overall, vertical, completeness = evaluator.evaluate_resume(resume_data)
        
        print(f"\n📊 EVALUATION RESULTS:")
        print(f"  Overall Grade:               {overall}")
        print(f"  Vertical Consistency Grade:  {vertical}")
        print(f"  Completeness Grade:          {completeness}")
        
        # Save grades to CSV
        print("\nSaving results to CSV...")
        evaluator.save_grades((overall, vertical, completeness), None, person_name)
        print(f"✅ Results saved to score folder")
        
        return True, (overall, vertical, completeness, person_name, resume_data)
        
    except Exception as e:
        print(f"❌ Error in resume evaluation: {e}")
        return False, None

def demonstrate_about_generation(person_name, resume_data):
    """Demonstrate about text generation using resume_about_generator.py"""
    
    print("\n" + "=" * 50)
    print("About Text Generation using resume_about_generator.py")
    print("=" * 50)
    
    try:
        # Import and use ResumeAboutGenerator
        from resume_about_generator import ResumeAboutGenerator
        
        print("Initializing ResumeAboutGenerator...")
        generator = ResumeAboutGenerator()
        
        print(f"Generating LinkedIn about text for: {person_name}")
        
        # Generate about text
        about_text = generator.generate_about(resume_data)
        
        print(f"\n📝 GENERATED ABOUT TEXT:")
        print("-" * 50)
        print(about_text)
        print("-" * 50)
        
        # Save about text to file
        about_file = generator.save_about_to_file(about_text, None, person_name)
        print(f"✅ About text saved to: {about_file}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error in about generation: {e}")
        return False

if __name__ == "__main__":
    # Run resume evaluation using resume_evaluator.py
    success1, eval_results = demonstrate_resume_evaluation()
    
    if success1 and eval_results:
        overall, vertical, completeness, person_name, resume_data = eval_results
        
        # Run about generation using resume_about_generator.py
        success2 = demonstrate_about_generation(person_name, resume_data)
        
        if success2:
            print("\n🎉 All demonstrations completed successfully!")
            print(f"\n📋 SUMMARY:")
            print(f"  Person: {person_name}")
            print(f"  Grades: Overall={overall}, Vertical={vertical}, Completeness={completeness}")
            print(f"  About text generated and saved")
        else:
            print("\n⚠️  About generation failed. Check error messages above.")
    else:
        print("\n⚠️  Resume evaluation failed. Check error messages above.")
    
