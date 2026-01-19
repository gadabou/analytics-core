"""
Kendeya Analytics Core - Scheduler
Handles periodic synchronization with DHIS2
"""

import os
import json
import time
from datetime import datetime

import httpx
from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.cron import CronTrigger


# Configuration from environment
BACKEND_HOST = os.getenv("BACKEND_HOST", "ih-cht-manage-backend")
BACKEND_PORT = os.getenv("BACKEND_PORT", "8000")
BACKEND_USE_SSL = os.getenv("BACKEND_USE_SSL", "false").lower() == "true"

DHIS2_URL = os.getenv("DHIS2_URL", "")
DHIS2_USER = os.getenv("DHIS2_USER", "")
DHIS2_PASS = os.getenv("DHIS2_PASS", "")
PROGRAM_TRACKER_ID = os.getenv("PROGRAM_TRACKER_ID", "")

LAST_SYNC_FILE = os.getenv("LAST_SYNC_FILE", "/app/data/last_sync.json")
TIMEOUT = int(os.getenv("TIMEOUT", "30"))
DEBUG = os.getenv("DEBUG", "0") == "1"

# Backend URL
PROTOCOL = "https" if BACKEND_USE_SSL else "http"
BACKEND_URL = f"{PROTOCOL}://{BACKEND_HOST}:{BACKEND_PORT}"


def log(message: str):
    """Simple logging function"""
    timestamp = datetime.utcnow().isoformat()
    print(f"[{timestamp}] {message}")


def save_sync_status(status: dict):
    """Save synchronization status to file"""
    try:
        os.makedirs(os.path.dirname(LAST_SYNC_FILE), exist_ok=True)
        with open(LAST_SYNC_FILE, "w") as f:
            json.dump(status, f, indent=2)
    except Exception as e:
        log(f"Error saving sync status: {e}")


def sync_dhis2_data():
    """
    Synchronize data from DHIS2
    This is the main sync job that runs periodically
    """
    log("Starting DHIS2 synchronization...")

    if not DHIS2_URL or not DHIS2_USER:
        log("DHIS2 configuration missing. Skipping sync.")
        return

    try:
        # Trigger sync via backend API
        with httpx.Client(timeout=TIMEOUT) as client:
            response = client.post(f"{BACKEND_URL}/api/sync/trigger")

            if response.status_code == 200:
                log("Sync triggered successfully")
                save_sync_status({
                    "last_sync": datetime.utcnow().isoformat(),
                    "status": "success",
                    "message": "Synchronization completed"
                })
            else:
                log(f"Sync failed with status: {response.status_code}")
                save_sync_status({
                    "last_sync": datetime.utcnow().isoformat(),
                    "status": "error",
                    "message": f"HTTP {response.status_code}"
                })

    except httpx.ConnectError:
        log("Cannot connect to backend. Retrying later...")
    except Exception as e:
        log(f"Sync error: {e}")
        save_sync_status({
            "last_sync": datetime.utcnow().isoformat(),
            "status": "error",
            "message": str(e)
        })


def wait_for_backend():
    """Wait for backend to be available before starting scheduler"""
    log("Waiting for backend to be available...")

    max_retries = 30
    retry_interval = 5

    for i in range(max_retries):
        try:
            with httpx.Client(timeout=5) as client:
                response = client.get(f"{BACKEND_URL}/api/main/health")
                if response.status_code == 200:
                    log("Backend is available!")
                    return True
        except Exception:
            pass

        log(f"Backend not ready. Retry {i + 1}/{max_retries}...")
        time.sleep(retry_interval)

    log("Backend not available after maximum retries")
    return False


def main():
    """Main entry point for the scheduler"""
    log("Kendeya Analytics Core - Scheduler starting...")
    log(f"Backend URL: {BACKEND_URL}")
    log(f"DHIS2 URL: {DHIS2_URL}")

    # Wait for backend
    if not wait_for_backend():
        log("Exiting due to backend unavailability")
        return

    # Create scheduler
    scheduler = BlockingScheduler()

    # Add sync job - runs every hour at minute 0
    scheduler.add_job(
        sync_dhis2_data,
        CronTrigger(minute=0),  # Every hour
        id="dhis2_sync",
        name="DHIS2 Data Synchronization",
        replace_existing=True
    )

    # Run initial sync
    log("Running initial synchronization...")
    sync_dhis2_data()

    log("Scheduler started. Press Ctrl+C to exit.")

    try:
        scheduler.start()
    except (KeyboardInterrupt, SystemExit):
        log("Scheduler stopped.")


if __name__ == "__main__":
    main()
