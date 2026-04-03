import asyncio
import json
from collections import defaultdict
from typing import Any

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from services.auth_service import decode_token
from services.supabase_client import get_supabase

router = APIRouter()


def _can_access_form(sb, form_id: str, user_id: str) -> bool:
    form_result = (
        sb.table("forms")
        .select("id,admin_id")
        .eq("id", form_id)
        .maybe_single()
        .execute()
    )
    form = form_result.data if form_result else None
    if not form:
        return False
    if form.get("admin_id") == user_id:
        return True
    collab_result = (
        sb.table("form_collaborators")
        .select("id")
        .eq("form_id", form_id)
        .eq("user_id", user_id)
        .maybe_single()
        .execute()
    )
    return (collab_result.data if collab_result else None) is not None


class CollaborationManager:
    def __init__(self):
        self._rooms: dict[str, set[WebSocket]] = defaultdict(set)
        self._socket_meta: dict[WebSocket, dict[str, Any]] = {}
        self._lock = asyncio.Lock()

    async def connect(self, form_id: str, websocket: WebSocket, user: dict[str, Any]):
        await websocket.accept()
        async with self._lock:
            self._rooms[form_id].add(websocket)
            self._socket_meta[websocket] = {
                "form_id": form_id,
                "user_id": user["id"],
                "username": user.get("username") or "Anonymous",
            }
        await self._broadcast_presence_snapshot(form_id)

    async def send_schema_snapshot(self, websocket: WebSocket, schema: dict[str, Any] | None):
        payload = {
            "type": "schema_snapshot",
            "schema": schema or {},
        }
        await websocket.send_text(json.dumps(payload))

    async def disconnect(self, websocket: WebSocket):
        async with self._lock:
            meta = self._socket_meta.pop(websocket, None)
            if not meta:
                return
            form_id = meta["form_id"]
            room = self._rooms.get(form_id)
            if room and websocket in room:
                room.remove(websocket)
            if room is not None and len(room) == 0:
                self._rooms.pop(form_id, None)
        await self._broadcast_presence_snapshot(meta["form_id"])

    async def _broadcast_presence_snapshot(self, form_id: str):
        async with self._lock:
            sockets = list(self._rooms.get(form_id, set()))
            users_map: dict[str, dict[str, Any]] = {}
            for ws in sockets:
                meta = self._socket_meta.get(ws)
                if not meta:
                    continue
                users_map[meta["user_id"]] = {
                    "user_id": meta["user_id"],
                    "username": meta["username"],
                }
            users = list(users_map.values())

        if not sockets:
            return
        payload = {"type": "presence_snapshot", "users": users}
        await self._broadcast(form_id, payload)

    async def _broadcast(self, form_id: str, message: dict[str, Any], exclude: WebSocket | None = None):
        async with self._lock:
            sockets = list(self._rooms.get(form_id, set()))

        dead_sockets: list[WebSocket] = []
        for ws in sockets:
            if exclude is not None and ws == exclude:
                continue
            try:
                await ws.send_text(json.dumps(message))
            except Exception:
                dead_sockets.append(ws)

        for ws in dead_sockets:
            await self.disconnect(ws)

    async def relay(self, websocket: WebSocket, message: dict[str, Any]):
        meta = self._socket_meta.get(websocket)
        if not meta:
            return
        form_id = meta["form_id"]
        user_id = meta["user_id"]

        message_type = message.get("type")
        if message_type == "cursor_move":
            x = message.get("x")
            y = message.get("y")
            if not isinstance(x, (int, float)) or not isinstance(y, (int, float)):
                return
            await self._broadcast(
                form_id,
                {
                    "type": "cursor_move",
                    "user_id": user_id,
                    "x": x,
                    "y": y,
                },
                exclude=websocket,
            )
            return

        if message_type == "yjs_update":
            update = message.get("update")
            if not isinstance(update, list):
                return
            await self._broadcast(
                form_id,
                {
                    "type": "yjs_update",
                    "user_id": user_id,
                    "update": update,
                },
                exclude=websocket,
            )
            return

        if message_type == "schema_update":
            schema = message.get("schema")
            if not isinstance(schema, dict):
                return
            await self._broadcast(
                form_id,
                {
                    "type": "schema_update",
                    "user_id": user_id,
                    "schema": schema,
                },
                exclude=websocket,
            )
            return

        if message_type == "ping":
            await websocket.send_text(json.dumps({"type": "pong"}))


manager = CollaborationManager()


@router.websocket("/ws/forms/{form_id}")
async def form_collaboration_socket(websocket: WebSocket, form_id: str):
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=4401, reason="Missing auth token")
        return

    try:
        user_id = decode_token(token)
    except Exception:
        await websocket.close(code=4401, reason="Invalid token")
        return

    sb = get_supabase()
    admin_result = (
        sb.table("admins")
        .select("id,username")
        .eq("id", user_id)
        .maybe_single()
        .execute()
    )
    admin = admin_result.data if admin_result else None
    if not admin:
        await websocket.close(code=4401, reason="Admin not found")
        return

    if not _can_access_form(sb, form_id, user_id):
        await websocket.close(code=4403, reason="Access denied")
        return

    await manager.connect(form_id, websocket, admin)

    form_result = (
        sb.table("forms")
        .select("schema")
        .eq("id", form_id)
        .maybe_single()
        .execute()
    )
    current_schema = (form_result.data or {}).get("schema") if form_result else {}
    await manager.send_schema_snapshot(websocket, current_schema)

    try:
        while True:
            data = await websocket.receive_json()
            if isinstance(data, dict):
                await manager.relay(websocket, data)
    except WebSocketDisconnect:
        await manager.disconnect(websocket)
    except Exception:
        await manager.disconnect(websocket)
        try:
            await websocket.close(code=1011)
        except Exception:
            pass
