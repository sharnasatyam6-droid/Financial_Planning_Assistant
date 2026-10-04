import os
import sqlite3
from pathlib import Path

import psycopg
from psycopg.rows import dict_row


database_path = Path(__file__).resolve().parent.parent.parent / "finora.db"


class DatabaseConnection:

    def __init__(self, connection, postgres=False):
        self.connection = connection
        self.postgres = postgres

    def execute(self, query, params=()):
        if self.postgres:
            query = query.replace("?", "%s")
            query = query.replace(
                "strftime('%Y-%m', expense_date)",
                "TO_CHAR(expense_date::date, 'YYYY-MM')"
            )
            query = query.replace(
                "strftime('%Y-%m', 'now')",
                "TO_CHAR(CURRENT_DATE, 'YYYY-MM')"
            )

        return self.connection.execute(query, params)

    def commit(self):
        self.connection.commit()

    def close(self):
        self.connection.close()


def get_connection():
    database_url = os.getenv("DATABASE_URL")

    if database_url:
        connection = psycopg.connect(
            database_url,
            row_factory=dict_row
        )
        return DatabaseConnection(connection, postgres=True)

    connection = sqlite3.connect(database_path)
    connection.row_factory = sqlite3.Row

    return DatabaseConnection(connection)


def create_tables():
    connection = get_connection()

    if connection.postgres:
        connection.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                mobile TEXT NOT NULL UNIQUE,
                email TEXT NOT NULL UNIQUE,
                password TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        connection.execute("""
            CREATE TABLE IF NOT EXISTS financial_profiles (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL UNIQUE,
                monthly_income DOUBLE PRECISION NOT NULL,
                current_savings DOUBLE PRECISION NOT NULL,
                fixed_expenses DOUBLE PRECISION NOT NULL,
                financial_priority TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        """)

        connection.execute("""
            CREATE TABLE IF NOT EXISTS expenses (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                amount DOUBLE PRECISION NOT NULL,
                category TEXT NOT NULL,
                description TEXT NOT NULL,
                payment_mode TEXT NOT NULL,
                transaction_id TEXT,
                expense_date TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        """)

        connection.execute("""
            CREATE TABLE IF NOT EXISTS savings_goals (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL UNIQUE,
                goal_name TEXT NOT NULL,
                target_amount DOUBLE PRECISION NOT NULL,
                target_date TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        """)

    else:
        connection.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                mobile TEXT NOT NULL UNIQUE,
                email TEXT NOT NULL UNIQUE,
                password TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        connection.execute("""
            CREATE TABLE IF NOT EXISTS financial_profiles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL UNIQUE,
                monthly_income REAL NOT NULL,
                current_savings REAL NOT NULL,
                fixed_expenses REAL NOT NULL,
                financial_priority TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        """)

        connection.execute("""
            CREATE TABLE IF NOT EXISTS expenses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                amount REAL NOT NULL,
                category TEXT NOT NULL,
                description TEXT NOT NULL,
                payment_mode TEXT NOT NULL,
                transaction_id TEXT,
                expense_date TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        """)

        connection.execute("""
            CREATE TABLE IF NOT EXISTS savings_goals (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL UNIQUE,
                goal_name TEXT NOT NULL,
                target_amount REAL NOT NULL,
                target_date TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        """)

    connection.commit()
    connection.close()
