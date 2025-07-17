"""
resume_section_splitter_sliding.py
---------------------------------
A small, TS-friendly helper that parses résumé text **incrementally**
with a sliding window so we never overflow an LLM context.
"""

from __future__ import annotations

import argparse
import json
import os
import re
from pathlib import Path
from typing import Dict, List

from transformers import AutoModelForCausalLM, AutoTokenizer, pipeline


# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

MODEL_PATH = (
    Path(__file__).resolve().parent / ".." / "models" / "Qwen2.5-1.5B-Instruct"
).as_posix()
MAX_NEW_TOKENS = 128            # tiny prompt; fast classification
WINDOW_SIZE = 5                 # number of lines examined at once
SECTION_CATEGORIES: List[str] = [
    "Personal Information",
    "Education",
    "Research",
    "Publications",
    "Work Experience",
    "Project Experience",
    "Skills",
    "Certificates",
    "Awards",
    "Others",
]

# Lazy global so model is only loaded once when the module is imported
_tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH, trust_remote_code=True)
_model = AutoModelForCausalLM.from_pretrained(MODEL_PATH, trust_remote_code=True)
_pipe = pipeline(
    "text-generation",
    model=_model,
    tokenizer=_tokenizer,
    max_new_tokens=MAX_NEW_TOKENS,
)


# ---------------------------------------------------------------------------
# Core helpers
# ---------------------------------------------------------------------------

def _classify_snippet(snippet: str) -> str:
    """
    Feed a small chunk to the model and return a clean, single-word section label.
    Falls back to 'Others' on any parsing error.
    """
    prompt = (
        "You are an intelligent resume assistant. Respond with **only** one label "
        f"from the list {SECTION_CATEGORIES} that best describes the following text:\n\n"
        f"{snippet}\n\nLabel:"
    )
    try:
        raw = _pipe(prompt)[0]["generated_text"]
        # Extract first bracketed word or first capitalised phrase
        match = re.search(r"(" + "|".join(map(re.escape, SECTION_CATEGORIES)) + r")", raw)
        return match.group(1) if match else "Others"
    except Exception:  # noqa: BLE001
        return "Others"


def split_resume_sections_from_text(content: str, window_size: int = WINDOW_SIZE) -> Dict[str, str]:
    """
    Public API: Given raw résumé text, return a dict keyed by section names.
    """
    lines = [ln for ln in content.splitlines() if ln.strip()]
    if not lines:
        return {}

    result: Dict[str, List[str]] = {}
    cur_label = None
    buffer: List[str] = []

    for idx in range(0, len(lines), window_size):
        window = "\n".join(lines[idx : idx + window_size])
        predicted = _classify_snippet(window)

        if cur_label is None:
            cur_label = predicted

        if predicted != cur_label:
            # Flush buffer to result dict
            result.setdefault(cur_label, []).extend(buffer)
            buffer = []
            cur_label = predicted

        buffer.extend(lines[idx : idx + window_size])

    # Flush remaining lines
    if buffer:
        result.setdefault(cur_label or "Others", []).extend(buffer)

    # Join lists back into single strings
    return {k: "\n".join(v) for k, v in result.items()}


# ---------------------------------------------------------------------------
# CLI entry-point
# ---------------------------------------------------------------------------

def _cli() -> None:
    parser = argparse.ArgumentParser(description="Split résumé text into sections.")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--content", help="Raw résumé text (string).")
    group.add_argument("--file", help="Path to a text or JSON file containing résumé.")
    parser.add_argument(
        "--window", type=int, default=WINDOW_SIZE, help="Sliding window size (lines)."
    )
    args = parser.parse_args()

    if args.content:
        raw = args.content
    else:
        path = Path(args.file).expanduser()
        if path.suffix.lower() == ".json":
            raw = json.loads(path.read_text(encoding="utf-8"))["content"]
        else:
            raw = path.read_text(encoding="utf-8")

    sections = split_resume_sections_from_text(raw, window_size=args.window)
    print(json.dumps(sections, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    _cli()
