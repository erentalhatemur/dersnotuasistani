"""
Local test aşaması için basit in-memory job store.

Production'a geçişte bunun yerine gerçek bir tabloya (SQLAlchemy modeli)
geçilecek - JobResponse şeması aynı kalacağı için üst katmanlarda (router)
değişiklik gerekmeyecek, sadece bu dosyanın implementasyonu değişecek.
"""

import threading
import uuid

from models.schemas import JobResponse, JobStatus

_lock = threading.Lock()
_jobs: dict[str, JobResponse] = {}


def create_job(filename: str) -> JobResponse:
    job = JobResponse(job_id=str(uuid.uuid4()), status=JobStatus.PROCESSING, filename=filename)
    with _lock:
        _jobs[job.job_id] = job
    return job


def get_job(job_id: str) -> JobResponse | None:
    with _lock:
        return _jobs.get(job_id)


def mark_done(job_id: str, result) -> None:
    with _lock:
        job = _jobs[job_id]
        job.status = JobStatus.DONE
        job.result = result


def mark_error(job_id: str, message: str) -> None:
    with _lock:
        job = _jobs[job_id]
        job.status = JobStatus.ERROR
        job.error_message = message
