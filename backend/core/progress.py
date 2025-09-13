from typing import Optional, Callable, Any, Dict
import asyncio
from fastapi import WebSocket

class ProgressTracker:
    def __init__(self, websocket: WebSocket = None):
        self.websocket = websocket
        self.progress = 0
        self.status = ""
        self.total_steps = 0
        self.current_step = 0

    async def update_progress(self, progress: int, status: str = ""):
        self.progress = progress
        self.status = status
        if self.websocket:
            try:
                await self.websocket.send_json({
                    "type": "progress",
                    "progress": progress,
                    "status": status
                })
            except Exception as e:
                print(f"Error sending progress update: {e}")

    async def step(self, status: str):
        self.current_step += 1
        if self.total_steps > 0:
            progress = int((self.current_step / self.total_steps) * 100)
            await self.update_progress(progress, status)
        else:
            await self.update_progress(0, status)

    def set_total_steps(self, total: int):
        self.total_steps = total
        self.current_step = 0
