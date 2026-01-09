# psql

A skill for running PostgreSQL queries using psql against the Bergvlei database.

## Usage

When invoked, this skill allows you to run SQL queries or psql commands against the database configured in `.env`.

## Instructions

When the user invokes `/psql` or requests to run database queries:

1. **Read the DATABASE_URL** from `/Users/burger/Projects/bergvlei/backend/.env` to get the database connection string

2. **Execute psql commands** using the Bash tool with the format:
   ```bash
   psql "$DATABASE_URL" -c "YOUR_SQL_QUERY_HERE"
   ```

3. **Common operations**:
   - List tables: `psql "$DATABASE_URL" -c "\dt"`
   - Describe table: `psql "$DATABASE_URL" -c "\d table_name"`
   - Run query: `psql "$DATABASE_URL" -c "SELECT * FROM users LIMIT 10;"`
   - Interactive mode: `psql "$DATABASE_URL"` (not recommended in Claude Code)

4. **For multi-line queries**, use heredoc format:
   ```bash
   psql "$DATABASE_URL" <<EOF
   SELECT id, email, created_at
   FROM users
   WHERE "isPremium" = true
   LIMIT 5;
   EOF
   ```

5. **Best practices**:
   - Always use double quotes for PostgreSQL identifiers with capital letters (e.g., `"isPremium"`, `"createdAt"`)
   - Use `-t` flag for tuple-only output (no headers)
   - Use `-A` flag for unaligned output
   - Use `-c` for single commands
   - Avoid destructive operations (DROP, TRUNCATE) without explicit user confirmation

6. **Safety**:
   - Always ask for confirmation before running UPDATE, DELETE, or DROP commands
   - Show the SQL query to the user before executing destructive operations
   - Use transactions for multiple related operations

## Examples

**List all tables:**
```bash
psql "$DATABASE_URL" -c "\dt"
```

**Show user count:**
```bash
psql "$DATABASE_URL" -c "SELECT COUNT(*) as user_count FROM users;"
```

**Get premium users:**
```bash
psql "$DATABASE_URL" -c "SELECT id, email, \"isPremium\" FROM users WHERE \"isPremium\" = true LIMIT 10;"
```

**Describe a table schema:**
```bash
psql "$DATABASE_URL" -c "\d+ users"
```
