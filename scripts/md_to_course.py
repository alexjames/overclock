#!/usr/bin/env python3
"""
Convert a markdown file into an Overclock course JSON file.

Markdown format:
  # Course Title
  ### Section Title
  Optional paragraph(s) right after ### become an intro page.
  #### Page Title
   * Bullet points become text blocks on the page.
   * Another bullet point becomes another text block.

Output:
  - Writes <course-id>.json to data/courses/
  - Updates data/courses/courses_index.json with the new course entry

Usage:
  python scripts/md_to_course.py <markdown-file> [options]

Options:
  --id ID            Course ID (default: derived from filename)
  --category CAT     Category string (default: "Computer Science")
  --icon ICON        Ionicons icon name (default: "book")
  --color COLOR      Hex color (default: "#6366F1")

Example:
  python scripts/md_to_course.py overclockdata/discover/testing/performance-testing.md --id testing --icon bug --color "#EF4444"
"""

import argparse
import json
import os
import re
import sys

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
COURSES_DIR = os.path.join(PROJECT_ROOT, "data", "courses")
INDEX_PATH = os.path.join(COURSES_DIR, "courses_index.json")


def slugify(text: str) -> str:
    """Convert text to a URL-friendly slug."""
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_]+", "-", text)
    text = re.sub(r"-+", "-", text)
    return text.strip("-")


def parse_markdown(md_text: str):
    """
    Parse markdown into a structure:
    {
        "title": str,
        "sections": [
            {
                "title": str,
                "intro_paragraphs": [str],  # text between ### and first ####
                "pages": [
                    {"title": str, "bullets": [str]}
                ]
            }
        ]
    }
    """
    lines = md_text.split("\n")
    result = {"title": "", "sections": []}
    current_section = None
    current_page = None
    in_intro = False  # between ### and first ####

    for line in lines:
        stripped = line.strip()

        # # Course Title
        if stripped.startswith("# ") and not stripped.startswith("## "):
            result["title"] = stripped[2:].strip()
            continue

        # ### Section Title
        if stripped.startswith("### ") and not stripped.startswith("####"):
            # Save previous section
            if current_section is not None:
                if current_page is not None:
                    current_section["pages"].append(current_page)
                    current_page = None
                result["sections"].append(current_section)

            current_section = {
                "title": stripped[4:].strip(),
                "intro_paragraphs": [],
                "pages": [],
            }
            in_intro = True
            continue

        # #### Page Title
        if stripped.startswith("#### "):
            if current_section is None:
                continue
            # Save previous page
            if current_page is not None:
                current_section["pages"].append(current_page)
            current_page = {"title": stripped[5:].strip(), "bullets": []}
            in_intro = False
            continue

        # Bullet point: * or -
        bullet_match = re.match(r"^\s*[\*\-]\s+(.+)$", stripped)
        if bullet_match:
            bullet_text = bullet_match.group(1).strip()
            if current_page is not None:
                current_page["bullets"].append(bullet_text)
            elif current_section is not None and in_intro:
                current_section["intro_paragraphs"].append(bullet_text)
            continue

        # Plain paragraph text (non-empty, not a heading, not a bullet)
        if stripped and current_section is not None and in_intro and current_page is None:
            current_section["intro_paragraphs"].append(stripped)
            continue

    # Flush remaining
    if current_section is not None:
        if current_page is not None:
            current_section["pages"].append(current_page)
        result["sections"].append(current_section)

    return result


def build_course_json(parsed, course_id: str, category: str, icon: str, color: str):
    """Convert parsed markdown structure into the Overclock course JSON format."""
    course = {
        "id": course_id,
        "title": parsed["title"],
        "category": category,
        "icon": icon,
        "color": color,
        "sections": [],
    }

    for sec_idx, section in enumerate(parsed["sections"]):
        section_id = slugify(section["title"])
        if not section_id:
            section_id = f"section-{sec_idx + 1}"

        pages = []
        page_counter = 0

        # If there are intro paragraphs, create an intro page
        if section["intro_paragraphs"]:
            page_counter += 1
            blocks = []
            for para in section["intro_paragraphs"]:
                blocks.append({"type": "text", "content": para})
            pages.append(
                {
                    "id": f"{section_id}-{page_counter}",
                    "title": section["title"],
                    "content": "",
                    "blocks": blocks,
                }
            )

        # Convert each #### page
        for page in section["pages"]:
            page_counter += 1
            page_id = f"{section_id}-{page_counter}"
            blocks = []
            for bullet in page["bullets"]:
                blocks.append({"type": "text", "content": bullet})

            pages.append(
                {
                    "id": page_id,
                    "title": page["title"],
                    "content": "",
                    "blocks": blocks,
                }
            )

        course["sections"].append(
            {
                "id": section_id,
                "title": section["title"],
                "pages": pages,
            }
        )

    return course


def update_courses_index(course_id: str, title: str, category: str, icon: str, color: str):
    """Add or update the course entry in courses_index.json."""
    index = []
    if os.path.exists(INDEX_PATH):
        with open(INDEX_PATH, "r", encoding="utf-8") as f:
            index = json.load(f)

    # Remove existing entry with same id
    index = [entry for entry in index if entry.get("id") != course_id]

    index.append(
        {
            "id": course_id,
            "title": title,
            "category": category,
            "icon": icon,
            "color": color,
        }
    )

    with open(INDEX_PATH, "w", encoding="utf-8") as f:
        json.dump(index, f, indent=2, ensure_ascii=False)
        f.write("\n")

    print(f"  Updated {INDEX_PATH}")


def main():
    parser = argparse.ArgumentParser(
        description="Convert a markdown file into an Overclock course JSON file."
    )
    parser.add_argument("markdown_file", help="Path to the markdown file")
    parser.add_argument("--id", dest="course_id", help="Course ID (default: derived from filename)")
    parser.add_argument("--category", default="Computer Science", help="Category (default: Computer Science)")
    parser.add_argument("--icon", default="book", help="Ionicons icon name (default: book)")
    parser.add_argument("--color", default="#6366F1", help="Hex color (default: #6366F1)")

    args = parser.parse_args()

    md_path = args.markdown_file
    if not os.path.exists(md_path):
        print(f"Error: File not found: {md_path}", file=sys.stderr)
        sys.exit(1)

    # Derive course ID from filename if not provided
    course_id = args.course_id
    if not course_id:
        basename = os.path.splitext(os.path.basename(md_path))[0]
        course_id = slugify(basename)

    with open(md_path, "r", encoding="utf-8") as f:
        md_text = f.read()

    parsed = parse_markdown(md_text)

    if not parsed["title"]:
        print("Error: Markdown file must have a # Title heading", file=sys.stderr)
        sys.exit(1)

    if not parsed["sections"]:
        print("Error: Markdown file must have at least one ### Section", file=sys.stderr)
        sys.exit(1)

    course = build_course_json(parsed, course_id, args.category, args.icon, args.color)

    # Write course JSON
    os.makedirs(COURSES_DIR, exist_ok=True)
    output_path = os.path.join(COURSES_DIR, f"{course_id}.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(course, f, indent=2, ensure_ascii=False)
        f.write("\n")

    print(f"  Wrote {output_path}")

    # Count stats
    total_sections = len(course["sections"])
    total_pages = sum(len(s["pages"]) for s in course["sections"])
    print(f"  Course: {parsed['title']}")
    print(f"  Sections: {total_sections}, Pages: {total_pages}")

    # Update index
    update_courses_index(course_id, parsed["title"], args.category, args.icon, args.color)

    print("Done!")


if __name__ == "__main__":
    main()
