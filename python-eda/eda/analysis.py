"""
Data analysis module for DataPulse EDA service.
Calculates descriptive statistics, correlation matrices,
and prepares visualization data (histogram, scatter, bar, boxplot, donut, line charts).
"""
from typing import Dict, Any, List
import pandas as pd
import numpy as np


def compute_summary(df: pd.DataFrame, cleaning_meta: Dict[str, Any] = None) -> Dict[str, Any]:
    """
    Computes descriptive statistics, data types, and correlation matrix.
    """
    if df is None or df.empty:
        raise ValueError("Cannot analyze empty DataFrame.")

    columns = list(df.columns)
    stats: Dict[str, Any] = {}

    numeric_cols = list(df.select_dtypes(include=[np.number]).columns)
    categorical_cols = [c for c in columns if c not in numeric_cols]

    # Compute stats for numeric columns
    for col in numeric_cols:
        series = df[col].dropna()
        if len(series) > 0:
            mode_val = series.mode().iloc[0] if not series.mode().empty else float(series.iloc[0])
            stats[col] = {
                "type": "numeric",
                "count": int(len(series)),
                "mean": round(float(series.mean()), 4),
                "median": round(float(series.median()), 4),
                "mode": round(float(mode_val), 4) if isinstance(mode_val, (int, float, np.number)) else str(mode_val),
                "std": round(float(series.std()), 4) if len(series) > 1 else 0.0,
                "min": round(float(series.min()), 4),
                "max": round(float(series.max()), 4),
                "nulls": int(cleaning_meta["null_counts"].get(col, 0)) if cleaning_meta else 0,
                "outliers": int(cleaning_meta["outlier_counts"].get(col, 0)) if cleaning_meta else 0
            }
        else:
            stats[col] = {
                "type": "numeric",
                "count": 0,
                "mean": 0,
                "median": 0,
                "mode": 0,
                "std": 0,
                "min": 0,
                "max": 0,
                "nulls": 0,
                "outliers": 0
            }

    # Compute stats for categorical columns
    for col in categorical_cols:
        series = df[col].astype(str)
        top_counts = series.value_counts().head(10).to_dict()
        stats[col] = {
            "type": "categorical",
            "count": int(len(series)),
            "unique": int(series.nunique()),
            "top_values": top_counts,
            "nulls": int(cleaning_meta["null_counts"].get(col, 0)) if cleaning_meta else 0
        }

    # Pearson correlation matrix
    correlation_data: Dict[str, Any] = {"columns": [], "matrix": []}
    if len(numeric_cols) >= 2:
        corr_df = df[numeric_cols].corr(method="pearson").fillna(0)
        corr_matrix = [[round(float(val), 4) for val in row] for row in corr_df.values]
        correlation_data = {
            "columns": numeric_cols,
            "matrix": corr_matrix
        }

    return {
        "columns": columns,
        "numeric_columns": numeric_cols,
        "categorical_columns": categorical_cols,
        "total_rows": int(len(df)),
        "metadata": cleaning_meta or {},
        "stats": stats,
        "correlation": correlation_data
    }


def generate_chart_data(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Generates structured chart payloads:
    1. Histogram (distribution bins & counts)
    2. Scatter plot (X vs Y correlation coordinates)
    3. Category Bar Chart (top frequencies)
    4. Box Plot (Min, Q1, Median, Q3, Max, Outliers)
    5. Donut / Pie Chart (Class percentages)
    6. Line Chart (Value progression across observations)
    """
    charts: Dict[str, Any] = {
        "histogram": {},
        "scatter": {},
        "bar": {},
        "boxplot": {},
        "donut": {},
        "line": {}
    }

    numeric_cols = list(df.select_dtypes(include=[np.number]).columns)
    categorical_cols = [c for c in df.columns if c not in numeric_cols]

    # 1. Histogram (up to 5 numeric columns)
    for col in numeric_cols[:5]:
        series = df[col].dropna()
        if len(series) > 1 and series.min() != series.max():
            counts, bin_edges = np.histogram(series, bins=10)
            bins_formatted = [round(float(b), 2) for b in bin_edges]
            charts["histogram"][col] = {
                "bins": bins_formatted,
                "counts": [int(c) for c in counts]
            }

    # 2. Scatter Plot
    if len(numeric_cols) >= 2:
        x_col = numeric_cols[0]
        y_col = numeric_cols[1]
        sample_df = df[[x_col, y_col]].dropna()
        if len(sample_df) > 250:
            sample_df = sample_df.sample(n=250, random_state=42)
        charts["scatter"] = {
            "x_column": x_col,
            "y_column": y_col,
            "x": [round(float(v), 4) for v in sample_df[x_col].tolist()],
            "y": [round(float(v), 4) for v in sample_df[y_col].tolist()]
        }
    elif len(numeric_cols) == 1:
        x_col = "Index"
        y_col = numeric_cols[0]
        sample_df = df[[y_col]].dropna()
        if len(sample_df) > 250:
            sample_df = sample_df.sample(n=250, random_state=42)
        charts["scatter"] = {
            "x_column": x_col,
            "y_column": y_col,
            "x": list(range(len(sample_df))),
            "y": [round(float(v), 4) for v in sample_df[y_col].tolist()]
        }

    # 3. Bar Chart
    if categorical_cols:
        cat_col = categorical_cols[0]
        counts_series = df[cat_col].astype(str).value_counts().head(10)
        charts["bar"] = {
            "column": cat_col,
            "category": list(counts_series.index),
            "counts": [int(v) for v in counts_series.values]
        }
    elif numeric_cols:
        first_num = numeric_cols[0]
        counts, bin_edges = np.histogram(df[first_num].dropna(), bins=5)
        labels = [f"{round(bin_edges[i],1)}-{round(bin_edges[i+1],1)}" for i in range(len(counts))]
        charts["bar"] = {
            "column": f"{first_num} (Ranges)",
            "category": labels,
            "counts": [int(c) for c in counts]
        }

    # 4. Box Plot (Quartile distribution for numeric columns)
    for col in numeric_cols[:5]:
        series = df[col].dropna()
        if len(series) >= 4:
            q25, med, q75 = np.percentile(series, [25, 50, 75])
            iqr = q75 - q25
            lower_bound = q25 - 1.5 * iqr
            upper_bound = q75 + 1.5 * iqr
            outlier_vals = [round(float(x), 2) for x in series[(series < lower_bound) | (series > upper_bound)].tolist()][:20]
            charts["boxplot"][col] = {
                "min": round(float(series.min()), 2),
                "q25": round(float(q25), 2),
                "median": round(float(med), 2),
                "q75": round(float(q75), 2),
                "max": round(float(series.max()), 2),
                "outliers": outlier_vals
            }

    # 5. Donut Chart (Proportions for categorical column)
    if categorical_cols:
        cat_col = categorical_cols[0]
        counts_series = df[cat_col].astype(str).value_counts().head(8)
        tot = counts_series.sum()
        pcts = [round(float(v / tot * 100), 1) for v in counts_series.values]
        charts["donut"] = {
            "column": cat_col,
            "category": list(counts_series.index),
            "counts": [int(v) for v in counts_series.values],
            "percentages": pcts
        }

    # 6. Line Trend Chart (Sampled progression for primary numeric column)
    if numeric_cols:
        primary_col = numeric_cols[0]
        series = df[primary_col].dropna()
        if len(series) > 60:
            step = len(series) // 50
            sampled = series.iloc[::step].head(50)
        else:
            sampled = series
        charts["line"] = {
            "column": primary_col,
            "labels": [str(i) for i in sampled.index],
            "values": [round(float(v), 2) for v in sampled.values]
        }

    return charts
