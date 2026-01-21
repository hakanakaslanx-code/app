from fastapi import FastAPI, APIRouter, HTTPException, Depends, Query, Response
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
import bcrypt
import jwt
import asyncio
import json

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET', 'restaurant-secret-key-change-in-production')
JWT_ALGORITHM = 'HS256'

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# SSE clients for real-time notifications
admin_sse_clients: List[asyncio.Queue] = []
order_sse_clients: Dict[str, List[asyncio.Queue]] = {}

# ============ Models ============

class TableModel(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    number: int
    label: Optional[str] = None
    active: bool = True

class CategoryModel(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    sortOrder: int = 0
    icon: Optional[str] = None

class MenuItemModel(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    categoryId: str
    name: str
    description: Optional[str] = None
    price: float
    imageUrl: Optional[str] = None
    isAvailable: bool = True
    allergens: List[str] = []
    modifiers: List[Dict[str, Any]] = []
    sortOrder: int = 0

class OrderItemModel(BaseModel):
    menuItemId: str
    name: str
    price: float
    quantity: int
    notes: Optional[str] = None
    modifiers: List[Dict[str, Any]] = []

class OrderModel(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tableId: str
    tableNumber: int
    status: str = "pending"  # pending, accepted, preparing, ready, completed, cancelled
    customerName: Optional[str] = None
    customerPhone: Optional[str] = None
    notes: Optional[str] = None
    items: List[OrderItemModel] = []
    subtotal: float = 0
    tax: float = 0
    total: float = 0
    createdAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updatedAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class AdminUserModel(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    passwordHash: str
    role: str = "admin"
    createdAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class SettingsModel(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = "settings"
    restaurantName: str = "Café Delight"
    currency: str = "$"
    taxRate: float = 0.08
    serviceFee: float = 0
    openHours: str = "8:00 AM - 10:00 PM"
    logoUrl: Optional[str] = None
    bannerText: Optional[str] = "Welcome! Scan QR to order"

# ============ Request/Response Models ============

class TableCreate(BaseModel):
    number: int
    label: Optional[str] = None
    active: bool = True

class CategoryCreate(BaseModel):
    name: str
    sortOrder: int = 0
    icon: Optional[str] = None

class MenuItemCreate(BaseModel):
    categoryId: str
    name: str
    description: Optional[str] = None
    price: float
    imageUrl: Optional[str] = None
    isAvailable: bool = True
    allergens: List[str] = []
    modifiers: List[Dict[str, Any]] = []
    sortOrder: int = 0

class OrderCreate(BaseModel):
    tableId: str
    tableNumber: int
    customerName: Optional[str] = None
    customerPhone: Optional[str] = None
    notes: Optional[str] = None
    items: List[OrderItemModel]

class StatusUpdate(BaseModel):
    status: str

class AdminLogin(BaseModel):
    email: str
    password: str

class AdminRegister(BaseModel):
    email: str
    password: str

class SettingsUpdate(BaseModel):
    restaurantName: Optional[str] = None
    currency: Optional[str] = None
    taxRate: Optional[float] = None
    serviceFee: Optional[float] = None
    openHours: Optional[str] = None
    logoUrl: Optional[str] = None
    bannerText: Optional[str] = None

# ============ Auth Helpers ============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, email: str) -> str:
    payload = {
        'user_id': user_id,
        'email': email,
        'exp': datetime.now(timezone.utc).timestamp() + 86400  # 24 hours
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_admin(authorization: str = None) -> dict:
    if not authorization or not authorization.startswith('Bearer '):
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = authorization.split(' ')[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.admin_users.find_one({"id": payload['user_id']}, {"_id": 0, "passwordHash": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ============ SSE Helpers ============

async def notify_admin_clients(event_type: str, data: dict):
    message = f"event: {event_type}\ndata: {json.dumps(data)}\n\n"
    for queue in admin_sse_clients:
        await queue.put(message)

async def notify_order_clients(order_id: str, data: dict):
    if order_id in order_sse_clients:
        message = f"event: status_update\ndata: {json.dumps(data)}\n\n"
        for queue in order_sse_clients[order_id]:
            await queue.put(message)

# ============ Public Routes ============

@api_router.get("/")
async def root():
    return {"message": "Restaurant API"}

@api_router.get("/settings")
async def get_public_settings():
    settings = await db.settings.find_one({"id": "settings"}, {"_id": 0})
    if not settings:
        settings = SettingsModel().model_dump()
    return settings

@api_router.get("/tables")
async def get_tables():
    tables = await db.tables.find({"active": True}, {"_id": 0}).sort("number", 1).to_list(100)
    return tables

@api_router.get("/tables/{table_id}")
async def get_table(table_id: str):
    table = await db.tables.find_one({"id": table_id, "active": True}, {"_id": 0})
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")
    return table

@api_router.get("/menu")
async def get_menu():
    categories = await db.categories.find({}, {"_id": 0}).sort("sortOrder", 1).to_list(100)
    items = await db.menu_items.find({"isAvailable": True}, {"_id": 0}).sort("sortOrder", 1).to_list(500)
    return {"categories": categories, "items": items}

@api_router.get("/menu/all")
async def get_all_menu():
    categories = await db.categories.find({}, {"_id": 0}).sort("sortOrder", 1).to_list(100)
    items = await db.menu_items.find({}, {"_id": 0}).sort("sortOrder", 1).to_list(500)
    return {"categories": categories, "items": items}

@api_router.post("/orders")
async def create_order(order_data: OrderCreate):
    # Validate table exists
    table = await db.tables.find_one({"id": order_data.tableId}, {"_id": 0})
    if not table:
        raise HTTPException(status_code=400, detail="Invalid table")
    
    # Get settings for tax calculation
    settings = await db.settings.find_one({"id": "settings"}, {"_id": 0})
    if not settings:
        settings = SettingsModel().model_dump()
    
    # Calculate totals
    subtotal = sum(item.price * item.quantity for item in order_data.items)
    tax = subtotal * settings.get('taxRate', 0.08)
    service_fee = settings.get('serviceFee', 0)
    total = subtotal + tax + service_fee
    
    order = OrderModel(
        tableId=order_data.tableId,
        tableNumber=order_data.tableNumber,
        customerName=order_data.customerName,
        customerPhone=order_data.customerPhone,
        notes=order_data.notes,
        items=[item.model_dump() for item in order_data.items],
        subtotal=round(subtotal, 2),
        tax=round(tax, 2),
        total=round(total, 2)
    )
    
    await db.orders.insert_one(order.model_dump())
    
    # Notify admin clients
    await notify_admin_clients("new_order", order.model_dump())
    
    return {"id": order.id, "orderNumber": order.id[:8].upper()}

@api_router.get("/orders/{order_id}")
async def get_order(order_id: str):
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@api_router.get("/sse/orders/{order_id}")
async def order_sse(order_id: str):
    async def event_generator():
        queue = asyncio.Queue()
        if order_id not in order_sse_clients:
            order_sse_clients[order_id] = []
        order_sse_clients[order_id].append(queue)
        
        try:
            # Send initial connection message
            yield f"event: connected\ndata: {json.dumps({'orderId': order_id})}\n\n"
            
            while True:
                try:
                    message = await asyncio.wait_for(queue.get(), timeout=30)
                    yield message
                except asyncio.TimeoutError:
                    yield f"event: ping\ndata: {json.dumps({'time': datetime.now(timezone.utc).isoformat()})}\n\n"
        finally:
            order_sse_clients[order_id].remove(queue)
            if not order_sse_clients[order_id]:
                del order_sse_clients[order_id]
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

# ============ Admin Auth Routes ============

@api_router.post("/admin/login")
async def admin_login(data: AdminLogin):
    user = await db.admin_users.find_one({"email": data.email}, {"_id": 0})
    if not user or not verify_password(data.password, user['passwordHash']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(user['id'], user['email'])
    return {"token": token, "user": {"id": user['id'], "email": user['email'], "role": user['role']}}

@api_router.post("/admin/register")
async def admin_register(data: AdminRegister):
    # Check if user exists
    existing = await db.admin_users.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user = AdminUserModel(
        email=data.email,
        passwordHash=hash_password(data.password)
    )
    await db.admin_users.insert_one(user.model_dump())
    
    token = create_token(user.id, user.email)
    return {"token": token, "user": {"id": user.id, "email": user.email, "role": user.role}}

@api_router.get("/admin/me")
async def get_admin_me(authorization: str = None):
    from fastapi import Header
    user = await get_current_admin(authorization)
    return user

# ============ Admin Orders Routes ============

@api_router.get("/admin/orders")
async def get_admin_orders(
    status: Optional[str] = None,
    authorization: str = None
):
    await get_current_admin(authorization)
    
    query = {}
    if status and status != "all":
        query["status"] = status
    
    orders = await db.orders.find(query, {"_id": 0}).sort("createdAt", -1).to_list(500)
    return orders

@api_router.patch("/admin/orders/{order_id}/status")
async def update_order_status(order_id: str, data: StatusUpdate, authorization: str = None):
    await get_current_admin(authorization)
    
    valid_statuses = ["pending", "accepted", "preparing", "ready", "completed", "cancelled"]
    if data.status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    result = await db.orders.update_one(
        {"id": order_id},
        {"$set": {"status": data.status, "updatedAt": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    
    # Notify order-specific SSE clients
    await notify_order_clients(order_id, {"status": data.status, "order": order})
    # Notify admin clients
    await notify_admin_clients("order_updated", order)
    
    return order

@api_router.get("/admin/sse/orders")
async def admin_orders_sse(authorization: str = None):
    async def event_generator():
        queue = asyncio.Queue()
        admin_sse_clients.append(queue)
        
        try:
            yield f"event: connected\ndata: {json.dumps({'message': 'Connected to admin orders stream'})}\n\n"
            
            while True:
                try:
                    message = await asyncio.wait_for(queue.get(), timeout=30)
                    yield message
                except asyncio.TimeoutError:
                    yield f"event: ping\ndata: {json.dumps({'time': datetime.now(timezone.utc).isoformat()})}\n\n"
        finally:
            admin_sse_clients.remove(queue)
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

# ============ Admin Categories Routes ============

@api_router.get("/admin/categories")
async def get_admin_categories(authorization: str = None):
    await get_current_admin(authorization)
    categories = await db.categories.find({}, {"_id": 0}).sort("sortOrder", 1).to_list(100)
    return categories

@api_router.post("/admin/categories")
async def create_category(data: CategoryCreate, authorization: str = None):
    await get_current_admin(authorization)
    category = CategoryModel(**data.model_dump())
    await db.categories.insert_one(category.model_dump())
    return category.model_dump()

@api_router.put("/admin/categories/{category_id}")
async def update_category(category_id: str, data: CategoryCreate, authorization: str = None):
    await get_current_admin(authorization)
    result = await db.categories.update_one(
        {"id": category_id},
        {"$set": data.model_dump()}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    return await db.categories.find_one({"id": category_id}, {"_id": 0})

@api_router.delete("/admin/categories/{category_id}")
async def delete_category(category_id: str, authorization: str = None):
    await get_current_admin(authorization)
    result = await db.categories.delete_one({"id": category_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"message": "Category deleted"}

# ============ Admin Menu Items Routes ============

@api_router.get("/admin/menu-items")
async def get_admin_menu_items(authorization: str = None):
    await get_current_admin(authorization)
    items = await db.menu_items.find({}, {"_id": 0}).sort("sortOrder", 1).to_list(500)
    return items

@api_router.post("/admin/menu-items")
async def create_menu_item(data: MenuItemCreate, authorization: str = None):
    await get_current_admin(authorization)
    item = MenuItemModel(**data.model_dump())
    await db.menu_items.insert_one(item.model_dump())
    return item.model_dump()

@api_router.put("/admin/menu-items/{item_id}")
async def update_menu_item(item_id: str, data: MenuItemCreate, authorization: str = None):
    await get_current_admin(authorization)
    result = await db.menu_items.update_one(
        {"id": item_id},
        {"$set": data.model_dump()}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Menu item not found")
    return await db.menu_items.find_one({"id": item_id}, {"_id": 0})

@api_router.delete("/admin/menu-items/{item_id}")
async def delete_menu_item(item_id: str, authorization: str = None):
    await get_current_admin(authorization)
    result = await db.menu_items.delete_one({"id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Menu item not found")
    return {"message": "Menu item deleted"}

# ============ Admin Tables Routes ============

@api_router.get("/admin/tables")
async def get_admin_tables(authorization: str = None):
    await get_current_admin(authorization)
    tables = await db.tables.find({}, {"_id": 0}).sort("number", 1).to_list(100)
    return tables

@api_router.post("/admin/tables")
async def create_table(data: TableCreate, authorization: str = None):
    await get_current_admin(authorization)
    table = TableModel(**data.model_dump())
    await db.tables.insert_one(table.model_dump())
    return table.model_dump()

@api_router.put("/admin/tables/{table_id}")
async def update_table(table_id: str, data: TableCreate, authorization: str = None):
    await get_current_admin(authorization)
    result = await db.tables.update_one(
        {"id": table_id},
        {"$set": data.model_dump()}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Table not found")
    return await db.tables.find_one({"id": table_id}, {"_id": 0})

@api_router.delete("/admin/tables/{table_id}")
async def delete_table(table_id: str, authorization: str = None):
    await get_current_admin(authorization)
    result = await db.tables.delete_one({"id": table_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Table not found")
    return {"message": "Table deleted"}

# ============ Admin Settings Routes ============

@api_router.get("/admin/settings")
async def get_admin_settings(authorization: str = None):
    await get_current_admin(authorization)
    settings = await db.settings.find_one({"id": "settings"}, {"_id": 0})
    if not settings:
        settings = SettingsModel().model_dump()
    return settings

@api_router.put("/admin/settings")
async def update_settings(data: SettingsUpdate, authorization: str = None):
    await get_current_admin(authorization)
    
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    
    await db.settings.update_one(
        {"id": "settings"},
        {"$set": update_data},
        upsert=True
    )
    
    settings = await db.settings.find_one({"id": "settings"}, {"_id": 0})
    return settings

# ============ Seed Data Route ============

@api_router.post("/admin/seed")
async def seed_database(authorization: str = None):
    await get_current_admin(authorization)
    
    # Clear existing data
    await db.tables.delete_many({})
    await db.categories.delete_many({})
    await db.menu_items.delete_many({})
    
    # Seed tables (1-20)
    tables = [TableModel(number=i, label=f"Table {i}").model_dump() for i in range(1, 21)]
    await db.tables.insert_many(tables)
    
    # Seed categories
    categories_data = [
        {"name": "Burgers", "sortOrder": 1, "icon": "🍔"},
        {"name": "Sandwiches", "sortOrder": 2, "icon": "🥪"},
        {"name": "Coffee", "sortOrder": 3, "icon": "☕"},
        {"name": "Drinks", "sortOrder": 4, "icon": "🥤"},
        {"name": "Desserts", "sortOrder": 5, "icon": "🍰"},
    ]
    categories = []
    for cat in categories_data:
        c = CategoryModel(**cat)
        categories.append(c)
        await db.categories.insert_one(c.model_dump())
    
    # Seed menu items
    menu_items_data = [
        # Burgers
        {"categoryId": categories[0].id, "name": "Classic Burger", "description": "Juicy beef patty with lettuce, tomato, and our special sauce", "price": 12.99, "imageUrl": "https://images.unsplash.com/photo-1627378378955-a3f4e406c5de?w=400", "allergens": ["gluten", "dairy"], "modifiers": [{"name": "Size", "options": [{"label": "Regular", "price": 0}, {"label": "Large", "price": 3}]}, {"name": "Extras", "options": [{"label": "Cheese", "price": 1.5}, {"label": "Bacon", "price": 2}]}], "sortOrder": 1},
        {"categoryId": categories[0].id, "name": "Double Cheeseburger", "description": "Two beef patties with melted cheddar cheese", "price": 15.99, "imageUrl": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400", "allergens": ["gluten", "dairy"], "sortOrder": 2},
        {"categoryId": categories[0].id, "name": "Veggie Burger", "description": "Plant-based patty with fresh vegetables", "price": 13.99, "imageUrl": "https://images.unsplash.com/photo-1520072959219-c595dc870360?w=400", "allergens": ["gluten"], "sortOrder": 3},
        {"categoryId": categories[0].id, "name": "BBQ Bacon Burger", "description": "Beef patty with crispy bacon and tangy BBQ sauce", "price": 14.99, "imageUrl": "https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400", "allergens": ["gluten", "dairy"], "sortOrder": 4},
        # Sandwiches
        {"categoryId": categories[1].id, "name": "Club Sandwich", "description": "Triple-decker with turkey, bacon, lettuce, and tomato", "price": 11.99, "imageUrl": "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400", "allergens": ["gluten", "eggs"], "sortOrder": 1},
        {"categoryId": categories[1].id, "name": "Grilled Cheese", "description": "Melted cheddar and mozzarella on sourdough", "price": 8.99, "imageUrl": "https://images.unsplash.com/photo-1528736235302-52922df5c122?w=400", "allergens": ["gluten", "dairy"], "sortOrder": 2},
        {"categoryId": categories[1].id, "name": "BLT", "description": "Crispy bacon, lettuce, tomato, mayo on toasted bread", "price": 9.99, "imageUrl": "https://images.unsplash.com/photo-1619096252214-ef06c45683e3?w=400", "allergens": ["gluten", "eggs"], "sortOrder": 3},
        {"categoryId": categories[1].id, "name": "Chicken Caesar Wrap", "description": "Grilled chicken, romaine, parmesan in a flour tortilla", "price": 10.99, "imageUrl": "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400", "allergens": ["gluten", "dairy", "eggs"], "sortOrder": 4},
        # Coffee
        {"categoryId": categories[2].id, "name": "Espresso", "description": "Rich, bold single shot espresso", "price": 3.50, "imageUrl": "https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?w=400", "modifiers": [{"name": "Shots", "options": [{"label": "Single", "price": 0}, {"label": "Double", "price": 1.5}]}], "sortOrder": 1},
        {"categoryId": categories[2].id, "name": "Latte", "description": "Espresso with steamed milk and light foam", "price": 4.99, "imageUrl": "https://images.unsplash.com/photo-1630040995437-80b01c5dd52d?w=400", "allergens": ["dairy"], "modifiers": [{"name": "Milk", "options": [{"label": "Whole", "price": 0}, {"label": "Oat", "price": 0.75}, {"label": "Almond", "price": 0.75}]}], "sortOrder": 2},
        {"categoryId": categories[2].id, "name": "Cappuccino", "description": "Equal parts espresso, steamed milk, and foam", "price": 4.50, "imageUrl": "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400", "allergens": ["dairy"], "sortOrder": 3},
        {"categoryId": categories[2].id, "name": "Iced Americano", "description": "Espresso shots over ice with cold water", "price": 4.25, "imageUrl": "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=400", "sortOrder": 4},
        # Drinks
        {"categoryId": categories[3].id, "name": "Fresh Lemonade", "description": "House-made with fresh lemons and mint", "price": 4.50, "imageUrl": "https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=400", "sortOrder": 1},
        {"categoryId": categories[3].id, "name": "Iced Tea", "description": "Refreshing black tea over ice", "price": 3.50, "imageUrl": "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400", "sortOrder": 2},
        {"categoryId": categories[3].id, "name": "Mango Smoothie", "description": "Blended mango, yogurt, and honey", "price": 5.99, "imageUrl": "https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=400", "allergens": ["dairy"], "sortOrder": 3},
        {"categoryId": categories[3].id, "name": "Sparkling Water", "description": "Refreshing carbonated mineral water", "price": 2.99, "imageUrl": "https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=400", "sortOrder": 4},
        # Desserts
        {"categoryId": categories[4].id, "name": "Chocolate Cake", "description": "Rich, moist chocolate cake with ganache", "price": 7.99, "imageUrl": "https://images.unsplash.com/photo-1586985289906-406988974504?w=400", "allergens": ["gluten", "dairy", "eggs"], "sortOrder": 1},
        {"categoryId": categories[4].id, "name": "Cheesecake", "description": "Creamy New York style with berry compote", "price": 8.50, "imageUrl": "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400", "allergens": ["gluten", "dairy", "eggs"], "sortOrder": 2},
        {"categoryId": categories[4].id, "name": "Ice Cream Sundae", "description": "Vanilla ice cream, hot fudge, whipped cream", "price": 6.99, "imageUrl": "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400", "allergens": ["dairy"], "sortOrder": 3},
        {"categoryId": categories[4].id, "name": "Apple Pie", "description": "Warm apple pie with cinnamon and vanilla ice cream", "price": 7.50, "imageUrl": "https://images.unsplash.com/photo-1568571780765-9276ac8b75a2?w=400", "allergens": ["gluten", "dairy", "eggs"], "sortOrder": 4},
    ]
    
    for item in menu_items_data:
        menu_item = MenuItemModel(**item)
        await db.menu_items.insert_one(menu_item.model_dump())
    
    # Seed settings
    settings = SettingsModel()
    await db.settings.update_one(
        {"id": "settings"},
        {"$set": settings.model_dump()},
        upsert=True
    )
    
    return {"message": "Database seeded successfully", "tables": 20, "categories": 5, "menuItems": len(menu_items_data)}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
