"""Kiểm tra runtime, thư viện và schema trước khi gọi VNStock."""

import platform
import struct
import sys


def main():
    errors = []
    if sys.version_info[:2] != (3, 12):
        errors.append(f"Cần Python 3.12, hiện tại là {platform.python_version()}")
    if struct.calcsize("P") * 8 != 64:
        errors.append("Cần Python x64")

    for package in ("dotenv", "pandas", "psycopg2", "vnstock"):
        try:
            __import__(package)
        except ImportError:
            errors.append(f"Thiếu thư viện {package}")

    if not errors:
        try:
            from db import get_connection, verify_schema

            with get_connection() as connection, connection.cursor() as cursor:
                verify_schema(cursor)
        except Exception as error:
            errors.append(f"Database chưa sẵn sàng: {error}")

    if errors:
        print("CHƯA SẴN SÀNG")
        for error in errors:
            print(f"- {error}")
        return 1
    print("SẴN SÀNG: Python 3.12 x64, thư viện và schema đều hợp lệ.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
