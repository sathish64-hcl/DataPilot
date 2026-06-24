from fastapi import APIRouter
from common import ai, AIConfigRequest

router = APIRouter()


@router.get("/api/ai/config")
async def get_ai_config():
    return ai.public_config()


@router.post("/api/ai/config")
async def update_ai_config(req: AIConfigRequest):
    return ai.configure(req.dict())


@router.post("/api/ai/test")
async def test_ai_connection():
    return ai.test_connection()


@router.get("/api/ai/usage")
async def get_ai_usage():
    return ai.usage_snapshot()


@router.post("/api/ai/usage/reset")
async def reset_ai_usage():
    return ai.reset_usage()


@router.get("/api/ai/templates")
async def get_ai_templates():
    return {"templates": ai.public_config().get("templates", {})}


@router.post("/api/ai/conversation/clear")
async def clear_ai_conversation():
    return ai.clear_conversation()
