import os
import tempfile
from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, HTTPException, UploadFile

from extractors.base import ExtractionError
from extractors.registry import SUPPORTED_EXTENSIONS, extract_from_file
from models.schemas import JobResponse
from services import job_store
from services.llm_service import generate_study_material

router = APIRouter(prefix="/api", tags=["documents"])

MAX_FILE_SIZE_MB = 25


@router.post("/upload", response_model=JobResponse)
async def upload_document(file: UploadFile, background_tasks: BackgroundTasks):
    extension = Path(file.filename).suffix.lower()
    if extension not in SUPPORTED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Desteklenmeyen dosya türü. Desteklenenler: {', '.join(SUPPORTED_EXTENSIONS)}",
        )

    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"Dosya {MAX_FILE_SIZE_MB}MB sınırını aşıyor.")

    # Local test: geçici dosyaya yaz, işlendikten sonra sil.
    with tempfile.NamedTemporaryFile(delete=False, suffix=extension) as tmp:
        tmp.write(contents)
        tmp_path = tmp.name

    job = job_store.create_job(filename=file.filename)
    background_tasks.add_task(_process_document, tmp_path, extension, file.filename, job.job_id)
    return job


def _process_document(tmp_path: str, extension: str, filename: str, job_id: str) -> None:
    try:
        extraction = extract_from_file(tmp_path, extension)
        result = generate_study_material(extraction, filename)
        job_store.mark_done(job_id, result)
    except ExtractionError as e:
        job_store.mark_error(job_id, str(e))
    except Exception as e:  # LLM hataları, beklenmeyen durumlar
        job_store.mark_error(job_id, f"İşlem sırasında hata: {e}")
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)


@router.get("/status/{job_id}", response_model=JobResponse)
async def get_status(job_id: str):
    job = job_store.get_job(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job bulunamadı.")
    return job


@router.get("/result/{job_id}", response_model=JobResponse)
async def get_result(job_id: str):
    job = job_store.get_job(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job bulunamadı.")
    return job
