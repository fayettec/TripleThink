# Use a lightweight version of Linux with Node.js pre-installed
FROM node:20-slim

# Install git and other basic tools usually missing from slim images
RUN apt-get update && apt-get install -y \
    git \
    curl \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# Install Claude Code globally
RUN npm install -g @anthropic-ai/claude-code

# Set the working directory inside the container
WORKDIR /app

# (Optional) Set a default command to keep the container running or drop into shell
CMD ["/bin/bash"]