#!/usr/bin/env python3
"""
Convert YAML flashcard files into data/review/<name>.json.

Supported formats:
  cloze.yaml  — fill_blank cards
    data:
      - answer: SomeWord
        text:
          - Sentence with <<MASK>> in it.

  mcq.yaml    — tap_reveal cards
    data:
      - option: SomeWord
        text:
          - Description of that option.

Usage:
  python scripts/yaml_to_flashcards.py overclockdata/code/oops/cloze.yaml
  python scripts/yaml_to_flashcards.py overclockdata/code/oops/mcq.yaml --id oops-cloze
  python scripts/yaml_to_flashcards.py overclockdata/code/oops/  # convert all yaml in a folder
"""

import argparse
import hashlib
import json
import os
import sys
import yaml

# Rotating palette for card colors.
COLORS = [
    "#E8F4FD", "#FDF6E8", "#E8FDF4", "#F4E8FD",
    "#FDE8E8", "#E8FDFA", "#FDF4E8", "#EAE8FD",
]


def color_for_index(i: int) -> str:
    return COLORS[i % len(COLORS)]


def short_id(prefix: str, text: str, index: int) -> str:
    """Generate a stable short ID from prefix + text hash."""
    digest = hashlib.md5(text.encode()).hexdigest()[:6]
    return f"{prefix}-{index}-{digest}"


def parse_cloze(data: list, prefix: str, category: str) -> list:
    """
    Each entry has an `answer` and a list of `text` sentences containing <<MASK>>.
    Each sentence becomes one fill_blank card; <<MASK>> is replaced with _____.
    """
    cards = []
    idx = 1
    for entry in data:
        answer = str(entry.get("answer", "")).strip()
        sentences = entry.get("text", [])
        for sentence in sentences:
            question = str(sentence).replace("<<MASK>>", "_____").strip()
            cards.append({
                "id": short_id(prefix, question, idx),
                "type": "fill_blank",
                "color": color_for_index(idx - 1),
                "question": question,
                "answer": answer,
                "category": category,
            })
            idx += 1
    return cards


def parse_mcq(data: list, prefix: str, category: str) -> list:
    """
    Each entry has an `option` (the answer) and a list of `text` descriptions.
    Each description becomes one tap_reveal card whose answer is the option name.
    """
    cards = []
    idx = 1
    for entry in data:
        option = str(entry.get("option", "")).strip()
        descriptions = entry.get("text", [])
        for desc in descriptions:
            question = str(desc).strip()
            cards.append({
                "id": short_id(prefix, question, idx),
                "type": "tap_reveal",
                "color": color_for_index(idx - 1),
                "question": question,
                "answer": option,
                "category": category,
            })
            idx += 1
    return cards


def convert_file(yaml_path: str, output_id: str | None, output_dir: str) -> str:
    with open(yaml_path, "r", encoding="utf-8") as f:
        doc = yaml.safe_load(f)

    if not isinstance(doc, dict) or "data" not in doc:
        raise ValueError(f"{yaml_path}: expected a YAML dict with a 'data' key")

    data = doc["data"]
    filename = os.path.basename(yaml_path)
    stem = os.path.splitext(filename)[0]           # e.g. "cloze" or "mcq"
    parent = os.path.basename(os.path.dirname(os.path.abspath(yaml_path)))  # e.g. "oops"

    # Derive defaults from path.
    prefix = output_id or f"{parent}-{stem}"
    category = parent.replace("-", " ").replace("_", " ").title()

    # Detect format from filename stem or structure of first entry.
    first = data[0] if data else {}
    if stem == "cloze" or "answer" in first:
        cards = parse_cloze(data, prefix, category)
    elif stem == "mcq" or "option" in first:
        cards = parse_mcq(data, prefix, category)
    else:
        raise ValueError(
            f"{yaml_path}: cannot detect format. "
            "Expected 'answer'/'text' (cloze) or 'option'/'text' (mcq) keys."
        )

    out_filename = f"{prefix}.json"
    out_path = os.path.join(output_dir, out_filename)
    os.makedirs(output_dir, exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(cards, f, indent=2, ensure_ascii=False)

    return out_path


def main():
    parser = argparse.ArgumentParser(description="Convert YAML flashcard files to JSON.")
    parser.add_argument("input", help="Path to a .yaml file or a directory of .yaml files")
    parser.add_argument(
        "--id",
        dest="output_id",
        default=None,
        help="Override the output file stem / card ID prefix (ignored when input is a directory)",
    )
    parser.add_argument(
        "--out",
        dest="output_dir",
        default=None,
        help="Output directory (default: data/review relative to repo root)",
    )
    args = parser.parse_args()

    # Resolve output directory relative to this script's repo root.
    script_dir = os.path.dirname(os.path.abspath(__file__))
    repo_root = os.path.dirname(script_dir)
    output_dir = args.output_dir or os.path.join(repo_root, "data", "review")

    input_path = args.input

    if os.path.isdir(input_path):
        yaml_files = [
            os.path.join(input_path, f)
            for f in os.listdir(input_path)
            if f.endswith(".yaml") or f.endswith(".yml")
        ]
        if not yaml_files:
            print(f"No YAML files found in {input_path}", file=sys.stderr)
            sys.exit(1)
        for yf in sorted(yaml_files):
            try:
                out = convert_file(yf, None, output_dir)
                print(f"  {yf} -> {out}")
            except Exception as e:
                print(f"  ERROR {yf}: {e}", file=sys.stderr)
    elif os.path.isfile(input_path):
        try:
            out = convert_file(input_path, args.output_id, output_dir)
            print(f"  {input_path} -> {out}")
        except Exception as e:
            print(f"ERROR: {e}", file=sys.stderr)
            sys.exit(1)
    else:
        print(f"ERROR: {input_path} does not exist", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
