import tempfile
import os
import pytest
from fastapi import HTTPException
from eda_service import health_check, process_dataset, ProcessRequest, load_dataframe_from_path


def test_health():
    res = health_check()
    assert res == {"status": "ok", "service": "python-eda"}


def test_process_with_valid_file_path():
    with tempfile.NamedTemporaryFile("w", suffix=".csv", delete=False) as f:
        f.write("name,age,salary\nAlice,25,50000\nBob,30,60000\nCharlie,35,70000\n")
        temp_path = f.name

    try:
        req = ProcessRequest(file_path=temp_path)
        data = process_dataset(req=req)
        assert "summary" in data
        assert "charts" in data
        assert "age" in data["summary"]["stats"]
        assert data["summary"]["stats"]["age"]["mean"] == 30.0
        assert "histogram" in data["charts"]
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


def test_process_missing_file_fails():
    req = ProcessRequest(file_path="non_existent_file.csv")
    with pytest.raises(HTTPException) as exc:
        process_dataset(req=req)
    assert exc.value.status_code == 404


def test_process_empty_request_fails():
    with pytest.raises(HTTPException) as exc:
        process_dataset(req=None, file=None)
    assert exc.value.status_code == 400


def test_unsupported_file_extension():
    with tempfile.NamedTemporaryFile("w", suffix=".txt", delete=False) as f:
        f.write("unsupported data")
        temp_path = f.name

    try:
        with pytest.raises(HTTPException) as exc:
            load_dataframe_from_path(temp_path)
        assert exc.value.status_code == 400
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)
