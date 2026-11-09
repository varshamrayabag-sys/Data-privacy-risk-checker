import pytest
import io
import fitz
import docx
from fastapi import UploadFile
from app.utils.file_extractor import document_extractor, DocumentExtractionError


@pytest.mark.asyncio
async def test_txt_extraction():
    content = b"Sample text with sensitive info: user@test.com"
    file = UploadFile(filename="sample.txt", file=io.BytesIO(content))
    extracted, name, char_count = await document_extractor.extract_text(file)
    assert name == "sample.txt"
    assert "user@test.com" in extracted
    assert char_count == len(extracted)


@pytest.mark.asyncio
async def test_pdf_extraction():
    # Create in-memory PDF using PyMuPDF
    doc = fitz.open()
    page = doc.new_page()
    page.insert_text((50, 50), "PDF Document Content: Aadhaar 9999 4105 1548")
    pdf_bytes = doc.write()
    doc.close()

    file = UploadFile(filename="test_doc.pdf", file=io.BytesIO(pdf_bytes))
    extracted, name, _ = await document_extractor.extract_text(file)
    assert name == "test_doc.pdf"
    assert "9999 4105 1548" in extracted


@pytest.mark.asyncio
async def test_docx_extraction():
    # Create in-memory DOCX
    doc = docx.Document()
    doc.add_paragraph("DOCX Contract for Rahul Sharma.")
    doc.add_paragraph("PAN: ABCDE1234F")
    docx_io = io.BytesIO()
    doc.save(docx_io)
    docx_io.seek(0)

    file = UploadFile(filename="contract.docx", file=docx_io)
    extracted, name, _ = await document_extractor.extract_text(file)
    assert name == "contract.docx"
    assert "ABCDE1234F" in extracted

