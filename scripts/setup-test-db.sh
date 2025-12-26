#!/bin/bash
# Create and initialize test database

# Connect to PostgreSQL and create test database
psql -U mindflow -h localhost -p 5432 -d postgres << SQL
DROP DATABASE IF EXISTS mindflow_test;
CREATE DATABASE mindflow_test;
SQL

# Run Prisma migrations to test database
DATABASE_URL="postgresql://mindflow:mindflow_dev@localhost:5432/mindflow_test" \
  npx prisma migrate deploy

echo "Test database initialized"
