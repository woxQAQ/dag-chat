#!/bin/bash
# Create and initialize test database
# 检查 psql 是否存在，不存在则退出
if ! command -v psql &> /dev/null; then
    echo "错误：未找到 psql 命令，请确保 PostgreSQL 客户端已安装并配置在 PATH 中。" >&2
    exit 1
fi

# Connect to PostgreSQL and create test database
psql -U mindflow -h localhost -p 5432 -d postgres << SQL
DROP DATABASE IF EXISTS mindflow_test;
CREATE DATABASE mindflow_test;
SQL

# Run Prisma migrations to test database
# TODO: do not hardcode DATABASE_URL
DATABASE_URL="postgresql://mindflow:mindflow_dev@localhost:5432/mindflow_test" \
  npx prisma migrate deploy

echo "Test database initialized"
