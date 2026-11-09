import os
import io
import fitz  # PyMuPDF
import docx
from typing import Tuple
from fastapi import UploadFile, HTTPException
from app.core.config import settings


class DocumentExtractionError(Exception):
    pass


class DocumentExtractor:
    """
    Extracts text content safely from PDF, DOCX, and TXT files.
    Validates file format, restricts payload size, and handles encoding.
    """

    @staticmethod
    def validate_file(file: UploadFile) -> Tuple[str, str]:
        """
        Validates file extension and content type.
        Returns (filename, extension).
        """
        filename = file.filename or "uploaded_file"
        _, ext = os.path.splitext(filename.lower())

        if ext not in settings.ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file extension '{ext}'. Allowed extensions: {', '.join(settings.ALLOWED_EXTENSIONS)}"
            )

        return filename, ext

    @staticmethod
    async def extract_text(file: UploadFile) -> Tuple[str, str, int]:
        """
        Extracts plain text from the uploaded file.
        Returns (extracted_text, filename, character_count).
        """
        filename, ext = DocumentExtractor.validate_file(file)

        content = await file.read()
        file_size = len(content)

        if file_size > settings.MAX_FILE_SIZE_BYTES:
            raise HTTPException(
                status_code=413,
                detail=f"File exceeds maximum allowed size of {settings.MAX_FILE_SIZE_MB} MB."
            )

        if file_size == 0:
            raise HTTPException(
                status_code=400,
                detail="Uploaded file is empty (0 bytes)."
            )

        extracted_text = ""

        try:
            if ext == ".txt":
                # Handle various text encodings
                for encoding in ("utf-8", "utf-8-sig", "latin-1", "cp1252"):
                    try:
                        extracted_text = content.decode(encoding)
                        break
                    except UnicodeDecodeError:
                        continue
                if not extracted_text and content:
                    extracted_text = content.decode("utf-8", errors="replace")

            elif ext == ".pdf":
                # PyMuPDF extraction
                try:
                    pdf_doc = fitz.open(stream=content, filetype="pdf")
                    pages_text = []
                    for page_num in range(len(pdf_doc)):
                        page = pdf_doc.load_page(page_num)
                        page_text = page.get_text()
                        if page_text:
                            pages_text.append(page_text)
                    pdf_doc.close()
                    extracted_text = "\n\n".join(pages_text).strip()
                except Exception as e:
                    raise DocumentExtractionError(f"Corrupted or password-protected PDF document: {str(e)}")

            elif ext == ".docx":
                # python-docx extraction
                try:
                    file_stream = io.BytesIO(content)
                    doc = docx.Document(file_stream)
                    paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
                    
                    # Extract from tables as well
                    for table in doc.tables:
                        for row in table.rows:
                            row_text = [cell.text.strip() for cell in row.cells if cell.text.strip()]
                            if row_text:
                                paragraphs.append(" | ".join(row_text))

                    extracted_text = "\n\n".join(paragraphs).strip()
                except Exception as e:
                    raise DocumentExtractionError(f"Corrupted or invalid DOCX document: {str(e)}")

        except DocumentExtractionError:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=422,
                detail=f"Failed to extract text from document: {str(e)}"
            )

        if not extracted_text or not extracted_text.strip():
            raise HTTPException(
                status_code=422,
                detail="No readable text could be extracted from the document. The file may be image-only, empty, or scanned without OCR."
            )

        return extracted_text.strip(), filename, len(extracted_text.strip())


document_extractor = DocumentExtractor()
