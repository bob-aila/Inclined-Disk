# Inclined-Disk — Deploying the Flask app

Quick files added to help deployment:

- [requirements.txt](requirements.txt) — pip deps
- [Procfile](Procfile) — start command for Render/Heroku-style hosts
- [Dockerfile](Dockerfile) — container for Cloud Run / Fly.io

Recommended deploy options

1) Render (easy, automatic):
   - Push your repo to GitHub.
   - Sign in to Render, "New -> Web Service", connect the repo and branch.
   - Use the default build (it will run `pip install -r requirements.txt`). Render will use `Procfile` start command.
   - Set the port (Render provides `$PORT`).

2) Google Cloud Run (container):
   - Build and push image:
     ```bash
     gcloud builds submit --tag gcr.io/PROJECT-ID/inclined-disk
     gcloud run deploy inclined-disk --image gcr.io/PROJECT-ID/inclined-disk --platform managed --region us-central1 --allow-unauthenticated
     ```

3) Fly.io / Railway / DigitalOcean App Platform: similar container or Git-based deploy. Use the `Dockerfile` or the `Procfile`-based build.

Local notes

- Run locally with `python app.py` or inside venv with `gunicorn app:app`.

If you want, I can:
- commit and push these files for you (you must provide repo access/credentials), or
- walk through connecting to Render or Cloud Run step-by-step.
