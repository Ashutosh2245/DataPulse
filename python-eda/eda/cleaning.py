"""
Data cleaning module for DataPulse EDA service.
Handles duplicate removal, missing value imputation, type casting,
and outlier detection.
"""
from typing import Tuple, Dict, Any
import pandas as pd
import numpy as np


def clean_dataset(df: pd.DataFrame) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    """
    Cleans the input DataFrame:
    1. Validates DataFrame structure.
    2. Drops exact duplicates.
    3. Converts data types where possible.
    4. Identifies and fills missing values.
    5. Detects outliers using IQR method.

    Returns:
        Tuple of (cleaned_df, cleaning_metadata)
    """
    if df is None or df.empty:
        raise ValueError("Dataset is empty or invalid.")

    # Validate header & column names
    if any(col is None or str(col).strip() == "" for col in df.columns):
        raise ValueError("Dataset contains invalid or empty column headers.")

    # Strip column names whitespace
    df.columns = [str(c).strip() for c in df.columns]

    initial_row_count = len(df)
    initial_column_count = len(df.columns)

    # 1. Drop duplicate rows
    df = df.drop_duplicates()
    duplicates_removed = initial_row_count - len(df)

    # 2. Drop rows that are completely empty
    df = df.dropna(how="all")

    # 3. Handle column data types and strip string columns
    for col in df.columns:
        if df[col].dtype == object:
            # Check if values can be converted to numeric
            try:
                converted = pd.to_numeric(df[col])
                df[col] = converted
            except (ValueError, TypeError):
                # Keep as string and strip whitespace
                try:
                    df[col] = df[col].astype(str).str.strip()
                except Exception:
                    pass

    # 4. Handle Missing Values
    null_counts = {}
    for col in df.columns:
        null_count = int(df[col].isnull().sum())
        null_counts[col] = null_count
        if null_count > 0:
            if pd.api.types.is_numeric_dtype(df[col]):
                # Fill null numeric values with column mean
                mean_val = df[col].mean()
                if pd.notnull(mean_val):
                    df[col] = df[col].fillna(mean_val)
                else:
                    df[col] = df[col].fillna(0)
            else:
                # Fill null categorical values with mode or 'Unknown'
                mode_series = df[col].mode()
                fill_val = mode_series.iloc[0] if not mode_series.empty else "Unknown"
                df[col] = df[col].fillna(fill_val)

    # 5. Outlier Detection using IQR (beyond 1.5 * IQR)
    outlier_counts = {}
    for col in df.select_dtypes(include=[np.number]).columns:
        series = df[col].dropna()
        if len(series) >= 4:
            q25, q75 = np.percentile(series, 25), np.percentile(series, 75)
            iqr = q75 - q25
            lower_bound = q25 - 1.5 * iqr
            upper_bound = q75 + 1.5 * iqr
            num_outliers = int(((series < lower_bound) | (series > upper_bound)).sum())
            outlier_counts[col] = num_outliers
        else:
            outlier_counts[col] = 0

    cleaning_metadata = {
        "initial_rows": initial_row_count,
        "cleaned_rows": len(df),
        "duplicates_removed": duplicates_removed,
        "null_counts": null_counts,
        "outlier_counts": outlier_counts,
        "total_columns": initial_column_count
    }

    return df, cleaning_metadata
