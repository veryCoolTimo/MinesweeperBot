import asyncio
import os
from pathlib import Path

from aiogram import Bot, Dispatcher, F
from aiogram.filters import CommandStart
from aiogram.types import Message, WebAppInfo, InlineKeyboardMarkup, InlineKeyboardButton
from dotenv import load_dotenv

# Load .env from parent directory
env_path = Path(__file__).parent.parent / ".env"
load_dotenv(env_path)

BOT_TOKEN = os.getenv("MEMORY_BOT_TOKEN")
WEBAPP_URL = os.getenv("WEBAPP_URL", "https://your-webapp-url.com")

bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()


@dp.message(CommandStart())
async def start(message: Message):
    """Handle /start command - show game button"""
    keyboard = InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="🧠 Play Memory",
                    web_app=WebAppInfo(url=f"{WEBAPP_URL}/memory")
                )
            ]
        ]
    )

    await message.answer(
        "Welcome to Memory Game! 🧠\n\n"
        "Test your memory by repeating sequences.\n"
        "Tap the button below to start playing.",
        reply_markup=keyboard
    )


@dp.message(F.web_app_data)
async def handle_webapp_data(message: Message):
    """Handle data received from WebApp"""
    import json
    data = json.loads(message.web_app_data.data)

    # Handle game results
    if data.get("action") == "game_complete":
        score = data.get("score", 0)
        level = data.get("level", 1)
        difficulty = data.get("difficulty", "easy")

        await message.answer(
            f"🎉 Great game!\n\n"
            f"Difficulty: {difficulty.title()}\n"
            f"Level reached: {level}\n"
            f"Score: {score}"
        )


async def main():
    print("Memory Bot is starting...")
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())
