import os
import sys

print("\n" + "="*50)
print("4. BACKEND API STATE")
print("="*50)
import subprocess

try:
    routes_output = subprocess.check_output(
        ["python3", "-c", "import sys; sys.path.append(os.path.join(os.getcwd(), 'backend')); from app.main import app; print([route.path for route in app.routes])"]
    )
    print("FastAPI Routes Registered:")
    print(routes_output.decode('utf-8'))
except Exception as e:
    print(f"Error loading FastAPI routes: {e}")

print("\nCurl /api/universes:")
os.system("curl -s http://localhost:8000/api/universes || echo 'Failed to curl'")

print("\nCurl /api/universes/1/overlap:")
os.system("curl -s http://localhost:8000/api/universes/1/overlap || echo 'Failed to curl'")

print("\nCurl /api/universes/1/conflicts:")
os.system("curl -s http://localhost:8000/api/universes/1/conflicts || echo 'Failed to curl'")

print("\nCurl /api/universes/1/conflicts/random:")
os.system("curl -s http://localhost:8000/api/universes/1/conflicts/random || echo 'Failed to curl'")


print("\n" + "="*50)
print("5. FRONTEND STATE")
print("="*50)

print("\nFiles in frontend/app/:")
os.system("ls -la frontend/app/ || echo 'Directory missing'")

print("\nFiles in frontend/components/:")
os.system("ls -la frontend/components/ || echo 'Directory missing'")

