docker build -t triple-think .
pause
docker run -it ^
  -e IS_SANDBOX=1 ^
  -v "C:\Users\facra\OneDrive\Documents\AI Agent\claude\TripleThink:/app" ^
  -v "C:\Users\facra\OneDrive\Documents\AI Agent\claude\claude-config:/root/.config/claude-code" ^
  -p 3000:3000 ^
  -p 8080:8080 ^
  triple-think