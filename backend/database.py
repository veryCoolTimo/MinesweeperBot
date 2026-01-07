import aiosqlite
from pathlib import Path
from typing import List, Tuple, Optional

DB_PATH = Path(__file__).parent / "leaderboard.db"


async def init_db():
    """Initialize the database with required tables"""
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS scores (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                username TEXT,
                first_name TEXT,
                difficulty TEXT NOT NULL,
                time_ms INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        await db.execute("""
            CREATE INDEX IF NOT EXISTS idx_difficulty_time
            ON scores(difficulty, time_ms)
        """)
        await db.commit()


async def save_score(
    user_id: int,
    username: Optional[str],
    first_name: str,
    difficulty: str,
    time_ms: int
) -> int:
    """Save a new score and return its rank"""
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            """
            INSERT INTO scores (user_id, username, first_name, difficulty, time_ms)
            VALUES (?, ?, ?, ?, ?)
            """,
            (user_id, username, first_name, difficulty, time_ms)
        )
        await db.commit()

        # Get rank for this score
        cursor = await db.execute(
            """
            SELECT COUNT(*) + 1 FROM scores
            WHERE difficulty = ? AND time_ms < ?
            """,
            (difficulty, time_ms)
        )
        row = await cursor.fetchone()
        return row[0]


async def get_leaderboard(
    difficulty: str,
    limit: int = 10
) -> List[Tuple[int, str, str, int]]:
    """Get top scores for a difficulty level"""
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute(
            """
            SELECT user_id, username, first_name, MIN(time_ms) as best_time
            FROM scores
            WHERE difficulty = ?
            GROUP BY user_id
            ORDER BY best_time ASC
            LIMIT ?
            """,
            (difficulty, limit)
        )
        return await cursor.fetchall()


async def get_user_best(user_id: int, difficulty: str) -> Optional[int]:
    """Get user's best time for a difficulty"""
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute(
            """
            SELECT MIN(time_ms) FROM scores
            WHERE user_id = ? AND difficulty = ?
            """,
            (user_id, difficulty)
        )
        row = await cursor.fetchone()
        return row[0] if row and row[0] else None
