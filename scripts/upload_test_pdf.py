#!/usr/bin/env python3
"""
upload_test_pdf.py — Upload a sample PDF to the GCS ingestion bucket.

Usage:
  # Against a real GCS bucket:
  python scripts/upload_test_pdf.py --bucket my-doc-bucket --file path/to/doc.pdf

  # Generate a synthetic PDF and upload it:
  python scripts/upload_test_pdf.py --bucket my-doc-bucket

  # Local mode: POST a fake Pub/Sub message directly to the processor:
  python scripts/upload_test_pdf.py --local --processor-url http://localhost:8080
"""
from __future__ import annotations

import argparse
import base64
import io
import json
import os
import time

import requests


def _make_synthetic_pdf() -> bytes:
    """Create a minimal syntehtic PDF without requiring reportlab."""
    # Minimal valid PDF with a content stream containing some text
    content_stream = (
        b"BT /F1 12 Tf 50 700 Td "
        b"(Serverless pipeline document processing on Google Cloud. "
        b"This file tests the OCR extraction pipeline. Keywords: "
        b"serverless cloud pipeline bigquery pubsub storage document "
        b"processing metadata extraction python fastapi cloudrun terraform) "
        b"Tj ET"
    )
    pdf = (
        b"%PDF-1.4\n"
        b"1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n"
        b"2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n"
        b"3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792]\n"
        b"   /Contents 4 0 R /Resources << /Font << /F1 << /Type /Font "
        b"   /Subtype /Type1 /BaseFont /Helvetica >> >> >> >>\nendobj\n"
        b"4 0 obj\n<< /Length " + str(len(content_stream)).encode() + b" >>\nstream\n"
        + content_stream +
        b"\nendstream\nendobj\n"
        b"xref\n0 5\n"
        b"0000000000 65535 f \n"
        b"0000000009 00000 n \n"
        b"0000000058 00000 n \n"
        b"0000000115 00000 n \n"
        b"0000000274 00000 n \n"
        b"trailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n"
        + str(274 + len(content_stream) + 20).encode() +
        b"\n%%EOF\n"
    )
    return pdf


def upload_to_gcs(bucket_name: str, file_path: str | None) -> None:
    from google.cloud import storage

    client = storage.Client()
    bucket = client.bucket(bucket_name)

    if file_path:
        object_name = os.path.basename(file_path)
        with open(file_path, "rb") as f:
            data = f.read()
    else:
        object_name = f"synthetic-test-{int(time.time())}.pdf"
        data = _make_synthetic_pdf()
        print(f"Generated synthetic PDF ({len(data)} bytes)")

    blob = bucket.blob(object_name)
    blob.upload_from_string(data, content_type="application/pdf")
    print(f"✅ Uploaded gs://{bucket_name}/{object_name}")
    print("   Watch Cloud Run logs and BigQuery for the processed record.")


def send_local_push(processor_url: str) -> None:
    """POST a fake Pub/Sub push message directly to the local processor."""
    pdf_bytes = _make_synthetic_pdf()
    object_name = f"synthetic-local-{int(time.time())}.pdf"

    # Simulate a GCS notification payload
    gcs_event = {
        "bucket": "local-test-bucket",
        "name": object_name,
        "contentType": "application/pdf",
        "size": str(len(pdf_bytes)),
    }
    data_b64 = base64.b64encode(json.dumps(gcs_event).encode()).decode()

    envelope = {
        "message": {
            "data": data_b64,
            "messageId": "local-test-123",
            "publishTime": "2026-07-03T22:00:00Z",
            "attributes": {},
        },
        "subscription": "projects/local-project/subscriptions/doc-uploads-push-sub",
    }

    url = f"{processor_url.rstrip('/')}/push"
    print(f"POSTing fake Pub/Sub message to {url} ...")
    resp = requests.post(url, json=envelope, timeout=30)
    print(f"Response {resp.status_code}: {resp.text}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Upload a test PDF to the pipeline.")
    parser.add_argument("--bucket", help="GCS bucket name (required for GCS mode)")
    parser.add_argument("--file", help="Path to a local PDF file (optional; generates synthetic if omitted)")
    parser.add_argument("--local", action="store_true", help="Local mode: POST directly to processor")
    parser.add_argument("--processor-url", default="http://localhost:8080", help="Processor URL for --local mode")
    args = parser.parse_args()

    if args.local:
        send_local_push(args.processor_url)
    elif args.bucket:
        upload_to_gcs(args.bucket, args.file)
    else:
        parser.error("Provide --bucket for GCS mode or --local for local mode.")


if __name__ == "__main__":
    main()
