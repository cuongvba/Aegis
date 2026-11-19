import os
import tempfile
from fastapi import FastAPI, File, UploadFile, HTTPException
from docling.datamodel.base_models import InputFormat
from docling.datamodel.pipeline_options import PdfPipelineOptions, TesseractCliOcrOptions
from docling.document_converter import DocumentConverter, PdfFormatOption
from docling_core.types.doc import ImageRefMode

app = FastAPI(title="Aegis Docling Document OCR Service", version="1.0.0")

_converter = None


def get_converter() -> DocumentConverter:
    global _converter
    if _converter is None:
        ocr_opts = TesseractCliOcrOptions(lang=["vie", "eng"])
        pdf_opts = PdfPipelineOptions(
            do_ocr=True,
            ocr_options=ocr_opts,
            do_table_structure=True,
            generate_picture_images=True,
            images_scale=2.0,
        )
        _converter = DocumentConverter(
            format_options={
                InputFormat.PDF: PdfFormatOption(pipeline_options=pdf_opts),
                InputFormat.IMAGE: PdfFormatOption(pipeline_options=pdf_opts),
            }
        )
    return _converter


@app.get("/health")
def health():
    return {"status": "ok", "engine": "ibm-docling"}


@app.post("/ocr")
async def ocr_document(file: UploadFile = File(...)):
    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Empty file")

    suffix = os.path.splitext(file.filename or "doc.png")[1] or ".png"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(data)
        tmp_path = tmp.name

    try:
        converter = get_converter()
        result = converter.convert(tmp_path)
        markdown = result.document.export_to_markdown(image_mode=ImageRefMode.EMBEDDED)
        return {"markdown": markdown, "engine": "ibm-docling"}
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
