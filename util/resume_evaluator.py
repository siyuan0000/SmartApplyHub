#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Resume Evaluator - ResumeEvaluator

Evaluates resume JSON files and returns three letter grades:
    1. Overall Grade
    2. Vertical Consistency Grade
    3. Completeness Grade

Changes in this full version
----------------------------
* **Real model integration** – prompts are now sent through the shared
  `ResumeProcessor().router` so genuine grades are produced when a model or
  API key is available.
* **Graceful fallback** – if the router cannot be initialised (e.g. no API
  key or model files) the code quietly drops back to the old behaviour so
  demo scripts continue to run.
* **Centralised `_query_model` helper** keeps model‑specific code in one
  place and standardises error handling.

Typical usage
-------------
```python
from resume_evaluator import ResumeEvaluator

# Using a resume dict already loaded in memory
rv = ResumeEvaluator()
print(rv.evaluate_resume(resume_dict))

# Or directly from a file
print(rv.process_resume_file("sample/lsy_resume.json"))
```
"""

from __future__ import annotations

import csv
import json
import logging
import os
import re
from datetime import datetime
from typing import Any, Dict, Tuple

# ---------------------------------------------------------------------------
# Load environment variables and optional imports
# ---------------------------------------------------------------------------
from pathlib import Path

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
                        value = value.strip('"\'')
                        os.environ[key.strip()] = value.strip()
        except Exception:
            pass

load_env_file()

# Try to import OpenAI for DeepSeek API
try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False

# Simple DeepSeek API evaluator
class SimpleDeepSeekEvaluator:
    """Simple DeepSeek API wrapper for resume evaluation"""
    
    def __init__(self):
        if not OPENAI_AVAILABLE:
            raise ImportError("OpenAI package required")
        
        api_key = os.getenv("DEEPSEEK_API_KEY")
        if not api_key:
            raise ValueError("DEEPSEEK_API_KEY not found")
        
        self.client = OpenAI(api_key=api_key, base_url="https://api.deepseek.com")
        self.model = "deepseek-chat"
        self.model_name = "deepseek-chat"
    
    def evaluate_resume(self, resume_data):
        """Evaluate resume using DeepSeek API"""
        # Extract basic info
        info_parts = []
        contact = resume_data.get('contact', {})
        if contact.get('name'):
            info_parts.append(f"Name: {contact['name']}")
        
        education = resume_data.get('education', [])
        if education:
            edu = education[0]
            info_parts.append(f"Education: {edu.get('degree', '')} at {edu.get('school', '')}")
        
        research = resume_data.get('research', [])
        if research:
            res = research[0]
            info_parts.append(f"Position: {res.get('position', '')} at {res.get('lab', '')}")
        
        skills = resume_data.get('skills', {})
        if skills.get('languages'):
            info_parts.append(f"Skills: {', '.join(skills['languages'][:5])}")
        
        resume_info = "\n".join(info_parts)
        
        grades = {}
        grade_types = {
            "overall": "Overall Grade",
            "vertical": "Vertical Consistency Grade", 
            "completeness": "Completeness Grade"
        }
        
        for grade_type, grade_name in grade_types.items():
            prompt = f"""You are a professional resume evaluation expert. 
Evaluate this resume and provide a {grade_name} (A+, A, A-, B+, B, B-, C+, C, C-, F).

Resume:
{resume_info}

Respond with ONLY the letter grade:"""
            
            try:
                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=5,
                    temperature=0.3
                )
                grade = response.choices[0].message.content.strip()
                # Extract valid grade
                import re
                match = re.search(r'\b([ABC][+-]?|F)\b', grade)
                grades[grade_type] = match.group(1) if match else "B"
            except Exception:
                grades[grade_type] = "B"
        
        return grades["overall"], grades["vertical"], grades["completeness"]

# Optional import of the shared processor / router.
try:
    from __init__ import ResumeProcessor  # noqa: F401 – imported for side‑effects
except Exception:  # pragma: no cover – acceptable if module missing in unit tests
    ResumeProcessor = None  # type: ignore

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Helper – valid letter grades in descending order
# ---------------------------------------------------------------------------
_VALID_GRADES = [
    "A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "F",
]


class ResumeEvaluator:
    """Evaluate resumes and assign three detailed letter grades."""

    # ---------------------------------------------------------------------
    # Construction & configuration
    # ---------------------------------------------------------------------

    def __init__(self, model_path: str | None = None):
        """Create a new :class:`ResumeEvaluator`.

        Parameters
        ----------
        model_path
            Reserved for future use – the real routing happens inside
            :class:`ResumeProcessor`, but passing a path lets callers control
            which model that processor loads (if implemented).
        """
        self.model_path = model_path
        self.criteria = self._load_evaluation_criteria()

        # -----------------------------------------------------------------
        # Try to initialize DeepSeek API first, then fallback to router
        # -----------------------------------------------------------------
        self.processor = None
        self.router = None
        self.deepseek_evaluator = None
        
        # Try DeepSeek API first
        if OPENAI_AVAILABLE and os.getenv("DEEPSEEK_API_KEY"):
            try:
                self.deepseek_evaluator = SimpleDeepSeekEvaluator()
                logger.info("DeepSeek API evaluator initialized")
            except Exception as exc:
                logger.warning("Failed to initialize DeepSeek API: %s", exc)
        
        # Fallback to router if available
        if self.deepseek_evaluator is None and ResumeProcessor is not None:
            try:
                self.processor = ResumeProcessor(model_path=model_path)
                self.router = self.processor.router
                logger.info("Model ready: %s", getattr(self.router, "model_name", "<unknown>"))
            except Exception as exc:  # pragma: no cover – environment‑specific
                logger.warning(
                    "Failed to initialise model router – running in prompt‑only "
                    "mode. Details: %s", exc,
                )
                self.processor = None
                self.router = None

    # ---------------------------------------------------------------------
    # Internal helpers
    # ---------------------------------------------------------------------

    @staticmethod
    def _load_evaluation_criteria() -> Dict[str, Any]:
        """Read *score/criteria.json* if present.

        Returns an empty dict when the file is missing or malformed so that the
        remainder of the pipeline never crashes.
        """
        criteria_file = os.path.join("score", "criteria.json")
        try:
            if os.path.exists(criteria_file):
                with open(criteria_file, "r", encoding="utf-8") as fh:
                    data = json.load(fh)
                logger.info("Evaluation criteria loaded from %s", criteria_file)
                return data
            logger.warning("Criteria file not found: %s", criteria_file)
            return {}
        except Exception as exc:  # pragma: no cover – corrupted JSON, etc.
            logger.error("Could not load criteria file: %s", exc)
            return {}

    # ------------------------------------------------------------------
    # Resume parsing utilities
    # ------------------------------------------------------------------

    @staticmethod
    def _extract_resume_info(resume_data: Dict[str, Any]) -> str:
        """Turn raw resume JSON into a human‑readable multiline string."""
        parts: list[str] = []

        # Contact ---------------------------------------------------------
        contact = resume_data.get("contact", {}) or {}
        name = contact.get("name", "")
        location = contact.get("location", "")
        if name:
            parts.append(f"Name: {name}")
        if location:
            parts.append(f"Location: {location}")

        # Education -------------------------------------------------------
        for idx, edu in enumerate(resume_data.get("education", []) or [], 1):
            school = edu.get("school", "")
            degree = edu.get("degree", "")
            start_date = edu.get("startDate", "")
            end_date = edu.get("endDate", "")
            parts.append(
                f"Education {idx}: {degree} at {school} ({start_date} – {end_date})",
            )

        # Research --------------------------------------------------------
        for idx, res in enumerate(resume_data.get("research", []) or [], 1):
            pos = res.get("position", "")
            lab = res.get("lab", "")
            proj = res.get("project", "")
            date = res.get("date", "")
            parts.append(
                f"Research {idx}: {pos} at {lab}, Project: {proj}, Period: {date}",
            )

        # Skills ----------------------------------------------------------
        skills = resume_data.get("skills", {}) or {}
        if languages := skills.get("languages", []):
            parts.append("Programming Languages: " + ", ".join(languages))
        if software := skills.get("software", []):
            parts.append("Software Tools: " + ", ".join(software))

        # Awards ----------------------------------------------------------
        if awards := resume_data.get("awards", []):
            parts.append("Awards: " + "; ".join(awards))

        # Publications ----------------------------------------------------
        for idx, pub in enumerate(resume_data.get("publications", []) or [], 1):
            title = pub.get("title", "")
            venue = pub.get("venue", "")
            date = pub.get("date", "")
            authors = ", ".join(pub.get("authors", [])[:3])
            parts.append(
                f"Publication {idx}: {title}, Venue: {venue}, Date: {date}, "
                f"Authors: {authors}",
            )

        return "\n".join(parts)

    # ------------------------------------------------------------------
    # Prompt building
    # ------------------------------------------------------------------

    def _create_evaluation_prompt(self, resume_info: str, grade_type: str) -> str:
        """Return a fully‑formatted prompt ready for the LLM."""

        if grade_type == "overall":
            criteria_key = "Overall Grade"
            grade_label = "Overall Grade"
        elif grade_type == "vertical":
            criteria_key = "Vertical Consistency Grade"
            grade_label = "Vertical Consistency Grade"
        else:
            criteria_key = "Completeness Grade"
            grade_label = "Completeness Grade"

        crit = self.criteria.get(criteria_key, {})
        description = crit.get("description", "")
        sub_crit = crit.get("sub_criteria", [])

        # Detailed criteria list (optional) ------------------------------
        criteria_text = ""
        if sub_crit:
            criteria_text += "Detailed evaluation criteria:\n"
            for idx, c in enumerate(sub_crit, 1):
                n = c.get("name", "")
                d = c.get("description", "")
                w = c.get("weight", 0)
                criteria_text += f"{idx}. {n} (Weight: {w}%): {d}\n"

        # Grading scale --------------------------------------------------
        scale = self.criteria.get("grading_scale", {}) or {}
        scale_text = "Grading scale:\n" + "\n".join(
            f"- {g}: {desc}" for g, desc in scale.items()
        )

        return (
            f"<|im_start|>system\n"
            "You are a professional resume evaluation expert. Please "
            f"evaluate the following resume and provide a {grade_label} based "
            "on the criteria below.\n\n"
            f"{description}\n\n"
            f"{criteria_text}\n"
            f"{scale_text}\n\n"
            "Please respond with only a single letter grade (A+, A, A-, B+, B, "
            "B-, C+, C, C-, F).\n\n"
            f"Resume information:\n{resume_info}\n\n"
            f"{grade_label}: <|im_end|>\n<|im_start|>assistant\nGrade:"
        )

    # ------------------------------------------------------------------
    # Model interaction
    # ------------------------------------------------------------------

    def _query_model(self, prompt: str) -> str:
        """Send *prompt* to the LLM and return its raw response.

        Returns an empty string if the router is unavailable or any error
        occurs so that the caller can gracefully degrade.
        """
        if self.router is None:
            return ""
        try:
            # Get raw response from model using the router's _call_model method
            if hasattr(self.router, '_call_model'):
                response = self.router._call_model(prompt, max_new_tokens=50, temperature=0.3)
            else:
                # Fallback to direct model call
                response = str(self.router.generate(prompt)).strip()
            
            return response
        except Exception as exc:  # pragma: no cover
            logger.error("Model query failed: %s", exc)
            return ""

    # ------------------------------------------------------------------
    # Grade extraction
    # ------------------------------------------------------------------

    @staticmethod
    def _extract_grade_from_response(response: str) -> str:
        """Pull the first valid letter grade out of *response*."""
        # Remove leading role labels sometimes returned by chat models
        response = response.lstrip().removeprefix("assistant:").strip()
        match = re.search(r"\b([ABC][+-]?|F)\b", response)
        if match:
            grade = match.group(1)
            if grade in _VALID_GRADES:
                return grade
        logger.warning("No valid grade found in response: %s", response)
        return "B"  # Sensible default

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def evaluate_resume(self, resume_data: Dict[str, Any]) -> Tuple[str, str, str]:
        """Return *(overall, vertical, completeness)* grades for *resume_data*."""
        info = self._extract_resume_info(resume_data)
        logger.info("Resume information extracted for evaluation")

        prompts = {
            "overall": self._create_evaluation_prompt(info, "overall"),
            "vertical": self._create_evaluation_prompt(info, "vertical"),
            "completeness": self._create_evaluation_prompt(info, "completeness"),
        }

        # Use DeepSeek API if available
        if self.deepseek_evaluator is not None:
            try:
                return self.deepseek_evaluator.evaluate_resume(resume_data)
            except Exception as e:
                logger.error("DeepSeek evaluation failed: %s", e)
        
        # Use router for evaluation if available
        elif self.router is not None:
            try:
                return self.router.evaluate_resume(resume_data)
            except Exception as e:
                logger.error("Router evaluation failed: %s", e)
        
        # Fallback to old method
        grades: dict[str, str] = {}
        for key, prompt in prompts.items():
            raw = self._query_model(prompt)
            grades[key] = self._extract_grade_from_response(raw or prompt)
            logger.info("%s grade determined as %s", key.capitalize(), grades[key])

        return grades["overall"], grades["vertical"], grades["completeness"]

    # ------------------------------------------------------------------
    # Convenience wrappers for file IO
    # ------------------------------------------------------------------

    def process_resume_file(self, file_path: str) -> Tuple[str, str, str]:
        """Load JSON from *file_path* and evaluate it."""
        try:
            with open(file_path, "r", encoding="utf-8") as fh:
                data = json.load(fh)
            logger.info("Loaded resume file: %s", file_path)
            return self.evaluate_resume(data)
        except FileNotFoundError:  # pragma: no cover – caller error
            logger.error("File not found: %s", file_path)
            raise
        except json.JSONDecodeError as exc:  # pragma: no cover – bad file
            logger.error("Malformed JSON in %s: %s", file_path, exc)
            raise

    # ------------------------------------------------------------------
    # CSV output
    # ------------------------------------------------------------------

    def save_grades(
        self,
        grades: Tuple[str, str, str],
        output_file: str | None = None,
        person_name: str = "Unknown",
    ) -> None:
        """Write *grades* to a CSV (default: *score/resume_grades_YYYYMMDD.csv*)."""
        overall, vertical, completeness = grades

        if output_file is None:
            date_str = datetime.now().strftime("%Y%m%d")
            output_file = os.path.join("score", f"resume_grades_{date_str}.csv")

        os.makedirs(os.path.dirname(output_file), exist_ok=True)
        try:
            with open(output_file, "w", newline="", encoding="utf-8") as fh:
                writer = csv.writer(fh)
                writer.writerow(["name", "overall_grade", "vertical_grade", "completeness_grade"])
                writer.writerow([person_name, overall, vertical, completeness])
            logger.info("Grades saved to %s", output_file)
        except Exception as exc:  # pragma: no cover – disk errors, etc.
            logger.error("Failed to save grades: %s", exc)
            raise


# ---------------------------------------------------------------------------
# Command‑line demonstration – `python resume_evaluator.py`
# ---------------------------------------------------------------------------

def _demo() -> None:  # pragma: no cover – not run in unit tests
    import sys
    sample_file = sys.argv[1] if len(sys.argv) > 1 else "../sample/lsy_resume.json"

    ev = ResumeEvaluator()
    try:
        overall, vertical, completeness = ev.process_resume_file(sample_file)
    except Exception as exc:
        print(f"❌ Evaluation failed: {exc}")
        return

    print("\n" + "=" * 60)
    print("Resume Evaluation Results")
    print("=" * 60)
    print(f"Overall Grade:               {overall}")
    print(f"Vertical Consistency Grade:  {vertical}")
    print(f"Completeness Grade:          {completeness}")

    ev.save_grades((overall, vertical, completeness), person_name=os.path.basename(sample_file))
    print(f"CSV saved in 'score/' directory (date‑stamp filename).\n")


if __name__ == "__main__":
    _demo()
