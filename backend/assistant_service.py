"""
AgriSense Real Intelligent LLM-Powered Conversational AI Service
Integrates genuine Large Language Models:
- Google Gemini API (gemini-1.5-flash / gemini-2.0-flash / gemini-1.5-pro)
- Groq API (llama-3.3-70b-versatile / llama-3.1-8b-instant / mixtral-8x7b-32768)
- OpenAI API (gpt-4o-mini / gpt-4o / gpt-3.5-turbo)

NO hardcoded answers. NO simulated responses. NO rule-based keyword matching.
Every valid question is sent directly to the configured LLM.
When no API key is configured, an explicit API_KEY_REQUIRED status is returned with instructions.
"""

import os
import json
import time
from typing import Dict, Any, List, Optional
import httpx
from dotenv import load_dotenv

# Load local environment variables from root and backend/.env
load_dotenv()
load_dotenv("backend/.env")

# LLM API Endpoints
GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models"
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
OPENAI_API_URL = "https://api.openai.com/v1/chat/completions"

# Default Model Selection
DEFAULT_GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
DEFAULT_GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
DEFAULT_OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")


def get_configured_provider(
    api_key_override: Optional[str] = None,
    provider_override: Optional[str] = None
) -> Optional[str]:
    """Detects which LLM provider has an active API key configured."""
    if provider_override and api_key_override and len(api_key_override.strip()) > 5:
        return provider_override.lower()

    # Check environment variables in priority order
    gemini_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if gemini_key and len(gemini_key.strip()) > 5:
        return "gemini"

    groq_key = os.getenv("GROQ_API_KEY")
    if groq_key and len(groq_key.strip()) > 5:
        return "groq"

    openai_key = os.getenv("OPENAI_API_KEY")
    if openai_key and len(openai_key.strip()) > 5:
        return "openai"

    if api_key_override and len(api_key_override.strip()) > 5:
        if api_key_override.startswith("gsk_"):
            return "groq"
        elif api_key_override.startswith("sk-"):
            return "openai"
        elif api_key_override.startswith("AIza"):
            return "gemini"
        return "gemini"

    return None


def get_assistant_status() -> Dict[str, Any]:
    """Returns current assistant configuration status without leaking keys."""
    provider = get_configured_provider()
    gemini_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    groq_key = os.getenv("GROQ_API_KEY")
    openai_key = os.getenv("OPENAI_API_KEY")

    active_model = "None"
    if provider == "gemini":
        active_model = DEFAULT_GEMINI_MODEL
    elif provider == "groq":
        active_model = DEFAULT_GROQ_MODEL
    elif provider == "openai":
        active_model = DEFAULT_OPENAI_MODEL

    return {
        "success": True,
        "is_configured": provider is not None,
        "provider": provider,
        "active_model": active_model,
        "models": {
            "gemini": DEFAULT_GEMINI_MODEL,
            "groq": DEFAULT_GROQ_MODEL,
            "openai": DEFAULT_OPENAI_MODEL
        },
        "has_gemini_key": bool(gemini_key and len(gemini_key.strip()) > 5),
        "has_groq_key": bool(groq_key and len(groq_key.strip()) > 5),
        "has_openai_key": bool(openai_key and len(openai_key.strip()) > 5),
        "supported_languages": [
            "en", "te", "hi", "ta", "kn", "mr", "bn", "gu", "pa", "ml", "or", "ur"
        ]
    }


def build_system_prompt(farm_context: Optional[Dict[str, Any]], language: str) -> str:
    """
    Builds a versatile, comprehensive system prompt that empowers the AI
    to handle all conversational domains (science, programming, math, tech, greetings)
    while grounding it in live agricultural telemetry when available.
    """
    context_lines = []

    if farm_context:
        # Location
        loc = farm_context.get("location")
        if loc:
            loc_name = loc.get("name") if isinstance(loc, dict) else str(loc)
            context_lines.append(f"- Active Location: {loc_name}")

        # Live Weather
        weather = farm_context.get("weather") or farm_context.get("currentWeather")
        if weather and isinstance(weather, dict):
            temp = weather.get("temperature_2m", weather.get("temperature"))
            hum = weather.get("relative_humidity_2m", weather.get("humidity"))
            wind = weather.get("wind_speed_10m", weather.get("windSpeed"))
            rain = weather.get("precipitation", 0)
            context_lines.append(
                f"- Current Microclimate: Temp: {temp}°C, Humidity: {hum}%, "
                f"Wind Speed: {wind} km/h, Precipitation: {rain} mm"
            )

        # Forecast
        daily = farm_context.get("dailyWeather")
        if daily and isinstance(daily, dict):
            rain_sum = daily.get("precipitation_sum", [0, 0])
            prob_max = daily.get("precipitation_probability_max", [0, 0])
            t_max = daily.get("temperature_2m_max", [0, 0])
            t_min = daily.get("temperature_2m_min", [0, 0])
            if isinstance(rain_sum, list) and len(rain_sum) > 1:
                context_lines.append(
                    f"- Tomorrow's Forecast: Max Temp: {t_max[1]}°C, Min Temp: {t_min[1]}°C, "
                    f"Rain Probability: {prob_max[1]}%, Expected Rain: {rain_sum[1]} mm"
                )

        # Soil
        soil = farm_context.get("soil") or farm_context.get("telemetry", {}).get("soilAnalysis")
        if soil and isinstance(soil, dict):
            ph = soil.get("farmAveragePh", soil.get("ph"))
            moisture = soil.get("moisturePct", soil.get("moisture"))
            if ph:
                context_lines.append(f"- Measured Soil pH: {ph}")
            if moisture:
                context_lines.append(f"- Soil Moisture: {moisture}%")

        # Plant Health
        plant_health = farm_context.get("plantHealthResult")
        if plant_health and isinstance(plant_health, dict) and plant_health.get("success"):
            disease = plant_health.get("disease", {})
            d_name = disease.get("diseaseName") or plant_health.get("predicted_class") or "Healthy"
            conf = plant_health.get("confidence", 0)
            context_lines.append(f"- Recent Leaf Scan: {d_name} (Confidence: {conf}%)")

        # Registered Crop & Precision Lifecycle Advisory
        crop = farm_context.get("registeredCrop") or farm_context.get("activeCrop")
        lifecycle = farm_context.get("lifecycle")
        fertilizer = farm_context.get("fertilizerResult")
        if crop and isinstance(crop, dict):
            c_name = str(crop.get("cropId", "Crop")).upper()
            c_var = crop.get("varietyId", "")
            c_area = crop.get("areaAcres", "")
            c_method = crop.get("cultivationMethod", "")
            context_lines.append(
                f"- Registered Farmer's Field: {c_name} (Variety: {c_var}, Area: {c_area} Acres, Method: {c_method})"
            )
            if lifecycle and isinstance(lifecycle, dict):
                das = lifecycle.get("daysAfterSowing")
                stage_name = lifecycle.get("currentStage", {}).get("name", "Active")
                context_lines.append(f"- Current Growth Stage: {stage_name} ({das} Days After Sowing/Transplanting)")
            if fertilizer and isinstance(fertilizer, dict):
                prods = fertilizer.get("commercialProducts", {})
                u_bags = prods.get("urea", {}).get("totalBags", "")
                d_bags = prods.get("dap", {}).get("totalBags", "")
                m_bags = prods.get("mop", {}).get("totalBags", "")
                context_lines.append(
                    f"- Scientifically Calculated Fertilizer Requirement: Urea: {u_bags} bags (45kg), DAP: {d_bags} bags (50kg), MOP Potash: {m_bags} bags (50kg)"
                )


    telemetry_block = "\n".join(context_lines) if context_lines else "None provided."

    lang_instructions = {
        "te": "Respond in natural, fluent Telugu (తెలుగు). Use clear language and authentic phrasing.",
        "hi": "Respond in natural, conversational Hindi (हिन्दी).",
        "ta": "Respond in natural, clear Tamil (தமிழ்).",
        "mr": "Respond in natural, clear Marathi (मराठी).",
        "kn": "Respond in natural, clear Kannada (ಕನ್ನಡ).",
        "en": "Respond in clear, accessible, professional English."
    }
    lang_inst = lang_instructions.get(language, f"Respond fluently in language code '{language}' or in English.")

    return f"""You are AgriSense AI Assistant, an advanced, intelligent conversational AI assistant.

CORE CAPABILITIES & DOMAINS:
1. General Knowledge & Technology: You understand and explain concepts across Artificial Intelligence, computer science, software engineering, science, mathematics, literature, history, and everyday life.
2. Programming & Code: When asked to write or explain code (e.g. Java, Python, HTML, CSS, JavaScript, C++), provide clean, correct, well-structured code blocks with language identifiers (e.g. ```java) and clear, concise explanations.
3. Agricultural Intelligence: You possess deep expertise in agronomy, crops, soil chemistry, IPM pest management, irrigation planning, fertilizers, and agricultural economics.
4. Telemetry Grounding: When live weather, soil, or plant telemetry is provided below, reference it intelligently if the user's question relates to their farm or local environment. Never invent fake readings.

LIVE ENVIRONMENT TELEMETRY:
{telemetry_block}

CONVERSATION PRINCIPLES:
- MULTI-TURN CONTINUITY: Understand follow-up questions, pronouns (e.g. 'its', 'they', 'the same topic', 'how to fix it'), and references to previous messages in the conversation history.
- CLARITY & BREVITY: Answer greetings naturally and warmly. Provide thorough, well-structured answers for technical or conceptual questions, and short concise answers for simple queries.
- HONESTY: If you do not know a specific fact or if telemetry data is missing, state it honestly instead of hallucinating.
- FORMATTING: Use markdown headings, bullet points, and code blocks to make your answers easy to read.
- LANGUAGE: {lang_inst}
"""


# -----------------------------------------------------------------------------
# 1. Google Gemini API Integration
# -----------------------------------------------------------------------------
async def call_gemini_api(
    api_key: str,
    user_message: str,
    history: List[Dict[str, str]],
    system_prompt: str,
    model: str = DEFAULT_GEMINI_MODEL
) -> Dict[str, Any]:
    """Invokes Google Gemini official REST API using httpx."""
    url = f"{GEMINI_BASE_URL}/{model}:generateContent?key={api_key}"

    contents = []

    # Map previous conversation history (up to last 10 turns)
    for msg in history[-10:]:
        role = "user" if msg.get("role") == "user" else "model"
        content = (msg.get("content") or "").strip()
        if content:
            contents.append({"role": role, "parts": [{"text": content}]})

    # Append current user message
    contents.append({"role": "user", "parts": [{"text": user_message}]})

    payload = {
        "systemInstruction": {
            "parts": [{"text": system_prompt}]
        },
        "contents": contents,
        "generationConfig": {
            "temperature": 0.7,
            "maxOutputTokens": 2048,
            "topP": 0.95
        }
    }

    async with httpx.AsyncClient(timeout=35.0) as client:
        try:
            res = await client.post(url, json=payload, headers={"Content-Type": "application/json"})
            if res.status_code == 200:
                data = res.json()
                candidates = data.get("candidates", [])
                if candidates and "content" in candidates[0]:
                    parts = candidates[0]["content"].get("parts", [])
                    if parts and "text" in parts[0]:
                        answer_text = parts[0]["text"].strip()
                        return {
                            "success": True,
                            "answer": answer_text,
                            "speechText": answer_text,
                            "provider": "gemini",
                            "model": model,
                            "display_cards": [
                                {"label": "AI Provider", "value": "Google Gemini"},
                                {"label": "Model", "value": model},
                                {"label": "Status", "value": "Live LLM Response"}
                            ]
                        }
                return {
                    "success": False,
                    "error_code": "EMPTY_RESPONSE",
                    "message": "Gemini model returned an empty response. Please retry."
                }
            elif res.status_code in [400, 403]:
                err_text = res.text
                if "API_KEY_INVALID" in err_text or "API key not valid" in err_text or "PERMISSION_DENIED" in err_text:
                    return {
                        "success": False,
                        "error_code": "INVALID_API_KEY",
                        "message": "Invalid or unauthorized Google Gemini API key. Please check GEMINI_API_KEY in backend/.env."
                    }
                return {
                    "success": False,
                    "error_code": f"HTTP_{res.status_code}",
                    "message": f"Gemini API Error ({res.status_code}): {res.text}"
                }
            elif res.status_code == 429:
                return {
                    "success": False,
                    "error_code": "RATE_LIMIT_EXCEEDED",
                    "message": "Gemini API rate limit reached. Please wait a moment before trying again."
                }
            else:
                return {
                    "success": False,
                    "error_code": f"HTTP_{res.status_code}",
                    "message": f"Gemini API returned HTTP {res.status_code}: {res.text}"
                }
        except httpx.TimeoutException:
            return {
                "success": False,
                "error_code": "TIMEOUT",
                "message": "Request to Google Gemini API timed out after 35 seconds. Please check your network connection."
            }
        except Exception as e:
            return {
                "success": False,
                "error_code": "NETWORK_ERROR",
                "message": f"Network error connecting to Gemini API: {str(e)}"
            }


# -----------------------------------------------------------------------------
# 2. Groq API Integration (OpenAI-Compatible format)
# -----------------------------------------------------------------------------
async def call_groq_api(
    api_key: str,
    user_message: str,
    history: List[Dict[str, str]],
    system_prompt: str,
    model: str = DEFAULT_GROQ_MODEL
) -> Dict[str, Any]:
    """Invokes Groq High-Speed Inference API using httpx."""
    messages = [{"role": "system", "content": system_prompt}]

    for msg in history[-10:]:
        role = "user" if msg.get("role") == "user" else "assistant"
        content = (msg.get("content") or "").strip()
        if content:
            messages.append({"role": role, "content": content})

    messages.append({"role": "user", "content": user_message})

    payload = {
        "model": model,
        "messages": messages,
        "temperature": 0.7,
        "max_tokens": 2048
    }

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    async with httpx.AsyncClient(timeout=35.0) as client:
        try:
            res = await client.post(GROQ_API_URL, json=payload, headers=headers)
            if res.status_code == 200:
                data = res.json()
                choices = data.get("choices", [])
                if choices and "message" in choices[0]:
                    answer_text = choices[0]["message"].get("content", "").strip()
                    return {
                        "success": True,
                        "answer": answer_text,
                        "speechText": answer_text,
                        "provider": "groq",
                        "model": model,
                        "display_cards": [
                            {"label": "AI Provider", "value": "Groq Cloud"},
                            {"label": "Model", "value": model},
                            {"label": "Speed", "value": "High Performance"}
                        ]
                    }
                return {
                    "success": False,
                    "error_code": "EMPTY_RESPONSE",
                    "message": "Groq API returned an empty response. Please retry."
                }
            elif res.status_code == 401:
                return {
                    "success": False,
                    "error_code": "INVALID_API_KEY",
                    "message": "Invalid Groq API key. Please check GROQ_API_KEY in backend/.env."
                }
            elif res.status_code == 429:
                return {
                    "success": False,
                    "error_code": "RATE_LIMIT_EXCEEDED",
                    "message": "Groq API rate limit or TPM exceeded. Please wait a moment."
                }
            else:
                return {
                    "success": False,
                    "error_code": f"HTTP_{res.status_code}",
                    "message": f"Groq API returned HTTP {res.status_code}: {res.text}"
                }
        except httpx.TimeoutException:
            return {
                "success": False,
                "error_code": "TIMEOUT",
                "message": "Request to Groq API timed out after 35 seconds."
            }
        except Exception as e:
            return {
                "success": False,
                "error_code": "NETWORK_ERROR",
                "message": f"Network error connecting to Groq API: {str(e)}"
            }


# -----------------------------------------------------------------------------
# 3. OpenAI API Integration
# -----------------------------------------------------------------------------
async def call_openai_api(
    api_key: str,
    user_message: str,
    history: List[Dict[str, str]],
    system_prompt: str,
    model: str = DEFAULT_OPENAI_MODEL
) -> Dict[str, Any]:
    """Invokes OpenAI Chat Completions API using httpx."""
    messages = [{"role": "system", "content": system_prompt}]

    for msg in history[-10:]:
        role = "user" if msg.get("role") == "user" else "assistant"
        content = (msg.get("content") or "").strip()
        if content:
            messages.append({"role": role, "content": content})

    messages.append({"role": "user", "content": user_message})

    payload = {
        "model": model,
        "messages": messages,
        "temperature": 0.7,
        "max_tokens": 2048
    }

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    async with httpx.AsyncClient(timeout=35.0) as client:
        try:
            res = await client.post(OPENAI_API_URL, json=payload, headers=headers)
            if res.status_code == 200:
                data = res.json()
                choices = data.get("choices", [])
                if choices and "message" in choices[0]:
                    answer_text = choices[0]["message"].get("content", "").strip()
                    return {
                        "success": True,
                        "answer": answer_text,
                        "speechText": answer_text,
                        "provider": "openai",
                        "model": model,
                        "display_cards": [
                            {"label": "AI Provider", "value": "OpenAI"},
                            {"label": "Model", "value": model},
                            {"label": "Status", "value": "Live LLM Response"}
                        ]
                    }
                return {
                    "success": False,
                    "error_code": "EMPTY_RESPONSE",
                    "message": "OpenAI returned an empty response."
                }
            elif res.status_code == 401:
                return {
                    "success": False,
                    "error_code": "INVALID_API_KEY",
                    "message": "Invalid OpenAI API key. Please check OPENAI_API_KEY in backend/.env."
                }
            elif res.status_code == 429:
                return {
                    "success": False,
                    "error_code": "RATE_LIMIT_EXCEEDED",
                    "message": "OpenAI quota or rate limit exceeded. Please check your OpenAI account billing."
                }
            else:
                return {
                    "success": False,
                    "error_code": f"HTTP_{res.status_code}",
                    "message": f"OpenAI API returned HTTP {res.status_code}: {res.text}"
                }
        except httpx.TimeoutException:
            return {
                "success": False,
                "error_code": "TIMEOUT",
                "message": "Request to OpenAI API timed out after 35 seconds."
            }
        except Exception as e:
            return {
                "success": False,
                "error_code": "NETWORK_ERROR",
                "message": f"Network error connecting to OpenAI API: {str(e)}"
            }


# -----------------------------------------------------------------------------
# 4. Primary Assistant Orchestrator
# -----------------------------------------------------------------------------
async def process_assistant_chat(
    message: str,
    conversation_history: Optional[List[Dict[str, str]]] = None,
    language: str = "en",
    farm_context: Optional[Dict[str, Any]] = None,
    api_key_override: Optional[str] = None,
    provider_override: Optional[str] = None,
    force_error_test: Optional[str] = None
) -> Dict[str, Any]:
    """
    Primary orchestrator for AI Assistant requests.
    Enforces honest LLM calls with ZERO static fallback or fake answers.
    """
    clean_message = (message or "").strip()
    if not clean_message:
        return {
            "success": False,
            "error_code": "EMPTY_QUERY",
            "message": "Please enter a valid message or question."
        }

    history = conversation_history or []

    # Explicit diagnostic test handlers
    if force_error_test == "missing_key":
        return {
            "success": False,
            "error_code": "API_KEY_REQUIRED",
            "message": "LLM API Key missing: Please configure GEMINI_API_KEY, GROQ_API_KEY, or OPENAI_API_KEY in backend/.env to connect to the live AI model.",
            "retryable": True
        }

    if force_error_test == "api_failure":
        return {
            "success": False,
            "error_code": "UPSTREAM_API_FAILURE",
            "message": "AI Provider connection failed (HTTP 504 Gateway Timeout). Please check network and retry.",
            "retryable": True
        }

    # Resolve active provider & API key
    gemini_key = api_key_override if provider_override == "gemini" else (
        api_key_override or os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    )
    groq_key = api_key_override if provider_override == "groq" else (
        api_key_override or os.getenv("GROQ_API_KEY")
    )
    openai_key = api_key_override if provider_override == "openai" else (
        api_key_override or os.getenv("OPENAI_API_KEY")
    )

    provider = provider_override or get_configured_provider(api_key_override, provider_override)

    system_prompt = build_system_prompt(farm_context, language)

    # 1. Call Gemini if configured
    if provider == "gemini" and gemini_key and len(gemini_key.strip()) > 5:
        return await call_gemini_api(
            api_key=gemini_key.strip(),
            user_message=clean_message,
            history=history,
            system_prompt=system_prompt,
            model=DEFAULT_GEMINI_MODEL
        )

    # 2. Call Groq if configured
    if provider == "groq" and groq_key and len(groq_key.strip()) > 5:
        return await call_groq_api(
            api_key=groq_key.strip(),
            user_message=clean_message,
            history=history,
            system_prompt=system_prompt,
            model=DEFAULT_GROQ_MODEL
        )

    # 3. Call OpenAI if configured
    if provider == "openai" and openai_key and len(openai_key.strip()) > 5:
        return await call_openai_api(
            api_key=openai_key.strip(),
            user_message=clean_message,
            history=history,
            system_prompt=system_prompt,
            model=DEFAULT_OPENAI_MODEL
        )

    # 4. If NO API key is configured anywhere:
    # Explicitly return API_KEY_REQUIRED error. NEVER fake or simulate responses.
    return {
        "success": False,
        "error_code": "API_KEY_REQUIRED",
        "message": (
            "No LLM API Key is configured. To enable genuine AI responses, "
            "please set your GEMINI_API_KEY, GROQ_API_KEY, or OPENAI_API_KEY in backend/.env "
            "or use the API Key Configuration button in the chat interface."
        ),
        "configured": False,
        "instructions": {
            "gemini": "Get a free Google Gemini key at https://aistudio.google.com/",
            "groq": "Get a fast free Groq key at https://console.groq.com/keys",
            "openai": "Get an OpenAI key at https://platform.openai.com/api-keys"
        }
    }
