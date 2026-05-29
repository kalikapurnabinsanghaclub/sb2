import json
import asyncio
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os

app = FastAPI(title="KNSDC Real-time Sync Server")

# Enable CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_FILE = "data/sync_state.json"

# Ensure data directory exists
os.makedirs("data", exist_ok=True)

# --- PROPER MAPPING (Models) ---

class SwitchStates(BaseModel):
    publicReg: bool = True
    stagePreview: bool = True
    lockScore: bool = False
    editScore: bool = False
    resultPublic: bool = False
    promoPublic: bool = False
    downloadPublic: bool = False

class Category(BaseModel):
    id: int
    name: str
    color: str
    ageMin: Optional[int] = 0
    ageMax: Optional[int] = 99
    eventId: Optional[Any] = None

class Participant(BaseModel):
    id: str
    name: str
    phone: str
    age: int
    catId: int
    venueId: int
    date: str
    present: bool = False
    round: str = "audition"
    stageStatus: str = "waiting"
    scores: Dict[str, Dict[str, float]] = {}
    eventId: Optional[Any] = None

class Subject(BaseModel):
    id: int
    name: str
    maxMarks: int = 10
    desc: str = ""

class Venue(BaseModel):
    id: int
    name: str
    location: str = ""
    capacity: int = 100
    dates: List[str] = []
    eventId: Optional[Any] = None

class Judge(BaseModel):
    id: str
    name: str
    role: str = "Judge"
    present: bool = True
    color: str = "#4f46e5"

class JudgeAgreement(BaseModel):
    id: int
    name: str
    phone: str
    city: str = ""
    eventId: Any
    date: str = ""
    time: str = ""
    venueId: int
    spec: str = ""
    amount: int = 0
    advance: int = 0
    notes: str = ""
    status: str = "pending"
    submitted: bool = False
    paymentReceived: int = 0
    photoUrl: str = ""
    agreedTc: bool = False

class Event(BaseModel):
    id: Any
    name: str
    venue: str = ""
    date: str = ""
    time: str = ""
    organizer: str = "Kalikapur Nabin Sangha"
    tagline: str = ""

class GlobalState(BaseModel):
    activeEventId: Any = "ev-2026-05-09"
    eventName: str = "Dance Ignition Season 6"
    organizer: str = "Kalikapur Nabin Sangha"
    currentOnStage: Optional[str] = None
    lastUpdated: int = 0
    participants: List[Participant] = []
    categories: List[Category] = []
    judges: List[Judge] = []
    subjects: List[Subject] = []
    venues: List[Venue] = []
    judgeAgreements: List[JudgeAgreement] = []
    events: List[Event] = []
    switchStates: SwitchStates = SwitchStates()
    nxtId: Dict[str, int] = {"reg": 1, "cat": 1, "venue": 1, "subj": 1, "agr": 1}

# --- STATE MANAGEMENT ---

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async shadow_connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception:
                continue

manager = ConnectionManager()

def load_state() -> dict:
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, "r") as f:
                data = json.load(f)
                # Validate with model
                return GlobalState(**data).dict()
        except Exception as e:
            print(f"Error loading state: {e}")
    
    # Return default state if file missing or invalid
    default = GlobalState().dict()
    save_state(default)
    return default

def save_state(state: dict):
    # Ensure it matches model before saving
    validated = GlobalState(**state).dict()
    with open(DATA_FILE, "w") as f:
        json.dump(validated, f, indent=2)

# --- ENDPOINTS ---

@app.get("/state")
async def get_state():
    return load_state()

@app.post("/state")
async def update_state(state: dict):
    try:
        save_state(state)
        await manager.broadcast(json.dumps({"type": "UPDATE", "payload": state}))
        return {"status": "success"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.shadow_connect(websocket)
    try:
        # Send initial state on connection
        current_state = load_state()
        await websocket.send_text(json.dumps({"type": "INIT", "payload": current_state}))
        
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message.get("type") == "UPDATE":
                new_payload = message.get("payload")
                save_state(new_payload)
                # Broadcast to everyone else
                await manager.broadcast(json.dumps({"type": "UPDATE", "payload": new_payload}))
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        print(f"WS Error: {e}")
        manager.disconnect(websocket)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
