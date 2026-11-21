import pytest
import pandas as pd
import numpy as np
from eda.cleaning import clean_dataset


def test_clean_dataset_removes_duplicates():
    df = pd.DataFrame({
        "age": [20, 25, 20, 30],
        "salary": [50000, 60000, 50000, 75000],
        "dept": ["IT", "HR", "IT", "Sales"]
    })
    cleaned_df, meta = clean_dataset(df)
    assert len(cleaned_df) == 3
    assert meta["duplicates_removed"] == 1


def test_clean_dataset_handles_nulls():
    df = pd.DataFrame({
        "age": [20.0, None, 40.0],
        "name": ["Alice", "Bob", None]
    })
    cleaned_df, meta = clean_dataset(df)
    assert cleaned_df["age"].isnull().sum() == 0
    # Mean of 20 and 40 is 30
    assert cleaned_df["age"].iloc[1] == 30.0
    assert cleaned_df["name"].isnull().sum() == 0
    assert meta["null_counts"]["age"] == 1


def test_clean_dataset_outlier_detection():
    df = pd.DataFrame({
        "values": [10, 11, 12, 10, 11, 12, 1000]
    })
    cleaned_df, meta = clean_dataset(df)
    assert meta["outlier_counts"]["values"] >= 1


def test_clean_dataset_empty_fails():
    with pytest.raises(ValueError):
        clean_dataset(pd.DataFrame())
