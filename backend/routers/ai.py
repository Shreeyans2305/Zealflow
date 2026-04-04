import os
import json
import re
from typing import List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import google.generativeai as genai

router = APIRouter()

# Configure Gemini
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)

class GenerateFormRequest(BaseModel):
    prompt: str
    context: Optional[str] = None

SYSTEM_PROMPT = """
You are an expert form designer for Zealflow, a high-end form builder.
Your task is to generate a JSON schema for a form based on a user's description.

Supported field types:
- text: Short text input
- number: Numeric input
- email: Email address input
- longtext: Multi-line textarea
- rating: Star/NPS rating (defaultSchema: { mode: 'stars', max: 5 })
- binary: Yes/No toggle (defaultSchema: { leftLabel: 'Yes', rightLabel: 'No' })
- opinion: Likert scale (defaultSchema: { leftLabel: 'Strongly Disagree', rightLabel: 'Strongly Agree' })
- date: Date picker
- upload: File upload
- choice: Multiple choice / Radio (defaultSchema: { options: ['Option 1', 'Option 2'] })
- checkbox: Multi-select checkboxes (defaultSchema: { options: ['Option A', 'Option B'] })

Rules:
1. Return ONLY a valid JSON object. No markdown, no triple backticks, no preamble.
2. The JSON structure MUST be:
{
  "title": "Form Title",
  "fields": [
    {
      "type": "field_type",
      "label": "Question Label",
      "required": true/false,
      "placeholder": "Optional placeholder",
      "options": ["Option 1", "Option 2"] (ONLY for choice/checkbox),
      "meta": { ... } (Optional additional metadata)
    }
  ],
  "settings": {
    "submitLabel": "Submit",
    "thankYouMessage": "Thank you for your response!"
  }
}
3. Be creative and professional with labels and placeholders.
4. If the user prompt is vague, generate a high-quality standard form for that category.
"""

@router.post("/generate-form")
async def generate_form(request: GenerateFormRequest):
    if not api_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured on server")

    try:
        model = genai.GenerativeModel("gemini-2.5-flash")
        
        full_prompt = f"{SYSTEM_PROMPT}\n\nUser Request: {request.prompt}"
        if request.context:
            full_prompt += f"\n\nContext of existing form: {request.context}"

        response = model.generate_content(full_prompt)
        text = response.text

        # Clean up response in case Gemini adds markdown blocks
        json_match = re.search(r"\{.*\}", text, re.DOTALL)
        if json_match:
            text = json_match.group(0)

        schema = json.loads(text)
        return schema
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="AI generated an invalid JSON response. Please try again.")
    except Exception as e:
        print(f"[AI Error] {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")
