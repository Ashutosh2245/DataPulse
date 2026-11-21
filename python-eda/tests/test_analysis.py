import pytest
import pandas as pd
from eda.cleaning import clean_dataset
from eda.analysis import compute_summary, generate_chart_data


def test_compute_summary():
    df = pd.DataFrame({
        "score": [80.0, 90.0, 100.0],
        "category": ["A", "B", "A"]
    })
    cleaned_df, meta = clean_dataset(df)
    summary = compute_summary(cleaned_df, meta)

    assert "score" in summary["stats"]
    assert summary["stats"]["score"]["mean"] == 90.0
    assert summary["stats"]["score"]["min"] == 80.0
    assert summary["stats"]["score"]["max"] == 100.0
    assert "category" in summary["stats"]
    assert summary["stats"]["category"]["top_values"]["A"] == 2


def test_generate_chart_data():
    df = pd.DataFrame({
        "col1": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        "col2": [10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
        "category": ["X", "Y", "X", "Y", "X", "Y", "X", "Y", "X", "Y"]
    })
    charts = generate_chart_data(df)
    assert "histogram" in charts
    assert "col1" in charts["histogram"]
    assert len(charts["histogram"]["col1"]["counts"]) == 10

    assert "scatter" in charts
    assert len(charts["scatter"]["x"]) == 10
    assert len(charts["scatter"]["y"]) == 10

    assert "bar" in charts
    assert charts["bar"]["column"] == "category"
    assert "X" in charts["bar"]["category"]
