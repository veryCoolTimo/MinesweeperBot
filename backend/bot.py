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

BOT_TOKEN = os.getenv("BOT_TOKEN")
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
                    text="🎮 Play Minesweeper",
                    web_app=WebAppInfo(url=WEBAPP_URL)
                )
            ]
        ]
    )

    await message.answer(
        "Welcome to Minesweeper! 💣\n\n"
        "Tap the button below to start playing.",
        reply_markup=keyboard
    )


@dp.message(F.web_app_data)
async def handle_webapp_data(message: Message):
    """Handle data received from WebApp"""
    import json
    data = json.loads(message.web_app_data.data)

    # Handle game results (score submission, etc.)
    if data.get("action") == "game_won":
        time_ms = data.get("time", 0)
        difficulty = data.get("difficulty", "easy")
        seconds = time_ms / 1000

        await message.answer(
            f"🎉 Congratulations!\n\n"
            f"You won on {difficulty} in {seconds:.1f} seconds!"
        )


async def main():
    print("Bot is starting...")
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())
