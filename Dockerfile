# Use a lightweight version of Linux with Node.js pre-installed
FROM node:20-slim

# Install git and other basic tools usually missing from slim images
# Added build-essential and python3 for native module compilation (better-sqlite3)
# Added jq for ralph-loop plugin support
RUN apt-get update && apt-get install -y \
    git \
    curl \
    unzip \
    build-essential \
    python3 \
    jq \
    && rm -rf /var/lib/apt/lists/*

# Install Claude Code globally
RUN npm install -g @anthropic-ai/claude-code

# NEW: Install Google Gemini CLI globally
RUN npm install -g @google/gemini-cli

# Set the working directory inside the container
WORKDIR /app

# Install API dependencies
COPY api/package*.json api/
RUN cd api && npm install

# Copy the rest of the application code
COPY . .

# Expose ports for API and GUI
EXPOSE 3000 8080

# Make the start script executable
RUN chmod +x ./start.sh

# Start the API and GUI servers
CMD ["./start.sh"]