"""
FastAPI EDA microservice for DataPulse Phase 1.
Listens on port 5000 and exposes endpoints for data processing, EDA, and AI Q&A.
"""
import os
import io
import re
from typing import Optional, Any, Dict
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import numpy as np

from eda.cleaning import clean_dataset
from eda.analysis import compute_summary, generate_chart_data

app = FastAPI(
    title="DataPulse EDA Microservice",
    description="Python data-processing service performing automated EDA and AI Q&A using Pandas",
    version="1.0.0"
)

# Enable CORS for internal and cross-origin communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ProcessRequest(BaseModel):
    file_path: Optional[str] = None


class AskRequest(BaseModel):
    file_path: Optional[str] = None
    question: str
    dataset_name: Optional[str] = "Dataset"


def load_dataframe_from_path(file_path: str) -> pd.DataFrame:
    """Reads a dataset from local path into a Pandas DataFrame."""
    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"File not found at path: {file_path}"
        )

    _, ext = os.path.splitext(file_path)
    ext = ext.lower()

    try:
        if ext == ".csv":
            return pd.read_csv(file_path, encoding="utf-8")
        elif ext in [".xlsx", ".xls"]:
            return pd.read_excel(file_path)
        elif ext == ".json":
            return pd.read_json(file_path)
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file format '{ext}'. Supported: .csv, .xlsx, .xls, .json"
            )
    except UnicodeDecodeError:
        try:
            return pd.read_csv(file_path, encoding="latin1")
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Failed to decode CSV: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Error reading dataset: {str(e)}")


def load_dataframe_from_bytes(content: bytes, filename: str) -> pd.DataFrame:
    """Reads a dataset from raw bytes into a Pandas DataFrame."""
    _, ext = os.path.splitext(filename)
    ext = ext.lower()

    try:
        buffer = io.BytesIO(content)
        if ext == ".csv":
            return pd.read_csv(buffer, encoding="utf-8")
        elif ext in [".xlsx", ".xls"]:
            return pd.read_excel(buffer)
        elif ext == ".json":
            return pd.read_json(buffer)
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file format '{ext}'."
            )
    except UnicodeDecodeError:
        buffer.seek(0)
        return pd.read_csv(buffer, encoding="latin1")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Error reading file bytes: {str(e)}")


def process_dataframe(df: pd.DataFrame) -> dict:
    """Runs data cleaning and analysis pipeline on a DataFrame."""
    if df is None or df.empty:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Dataset is empty or contains no valid rows."
        )

    # 1. Cleaning
    cleaned_df, cleaning_meta = clean_dataset(df)

    # 2. Descriptive statistics & Summary
    summary = compute_summary(cleaned_df, cleaning_meta)

    # 3. Chart data for visualizations
    charts = generate_chart_data(cleaned_df)

    return {
        "summary": summary,
        "charts": charts
    }


def process_dataset(req: Optional[ProcessRequest] = None, file: Any = None) -> dict:
    """Synchronous entrypoint for testing and direct Python invocation."""
    df = None
    if req is not None and req.file_path:
        df = load_dataframe_from_path(req.file_path)
    elif file is not None and hasattr(file, "filename") and file.filename:
        content = file.file.read() if hasattr(file, "file") else file.read()
        df = load_dataframe_from_bytes(content, file.filename)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either 'file_path' in JSON body or multipart 'file' must be provided."
        )
    return process_dataframe(df)


@app.get("/health")
def health_check():
    """Simple health check endpoint."""
    return {"status": "ok", "service": "python-eda"}


@app.post("/process")
async def process_dataset_endpoint(request: Request):
    """
    Main HTTP processing endpoint:
    Accepts application/json with {"file_path": "..."} OR multipart/form-data with file upload.
    """
    content_type = request.headers.get("content-type", "")
    df = None
    file_path = None

    if "application/json" in content_type:
        try:
            body = await request.json()
            if isinstance(body, dict) and "file_path" in body:
                file_path = body.get("file_path")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid JSON body: {str(e)}")

    elif "multipart/form-data" in content_type:
        try:
            form = await request.form()
            if "file" in form:
                upload_file = form["file"]
                if hasattr(upload_file, "filename") and upload_file.filename:
                    content = await upload_file.read()
                    df = load_dataframe_from_bytes(content, upload_file.filename)
            if df is None and "file_path" in form:
                file_path = str(form["file_path"])
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid multipart data: {str(e)}")

    if df is None and file_path:
        df = load_dataframe_from_path(file_path)

    if df is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either valid 'file_path' or multipart 'file' must be provided."
        )

    return process_dataframe(df)


def query_dataset_intelligence(df: pd.DataFrame, question: str) -> Dict[str, str]:
    """
    Intelligent data answering engine for voice and text QA.
    Analyzes intent (English, Hindi, Hinglish), matches columns, and generates both formatted Markdown
    and clean Speech-to-Text sentences.
    """
    q = question.strip().lower()
    cols = list(df.columns)
    num_cols = list(df.select_dtypes(include=[np.number]).columns)
    cat_cols = [c for c in cols if c not in num_cols]

    # Column name fuzzy/substring match
    matched_col = None
    for c in cols:
        c_low = c.lower()
        if c_low in q or re.search(r'\b' + re.escape(c_low) + r'\b', q):
            matched_col = c
            break

    # 1. Total Rows / Shape / Count (English and Hindi/Hinglish)
    if any(k in q for k in [
        "how many row", "row count", "how many record", "dataset size", "total rows", 
        "dimensions", "how many col", "kitne row", "kitna data", "kitne record", 
        "kul kitne", "kitne column", "data size", "shape"
    ]):
        col_list = ', '.join(cols[:8])
        ans = f"📊 The dataset contains **{len(df):,} total rows** across **{len(df.columns)} columns** (`{col_list}`)."
        speech = f"This dataset has {len(df)} rows and {len(df.columns)} columns."
        return {"answer": ans, "speech_text": speech}

    # 2. Highest / Maximum (English and Hindi/Hinglish)
    if any(k in q for k in [
        "highest", "maximum", "max", "top value", "largest", "biggest", "peak",
        "sabse jyada", "sabse bada", "sabse adhik", "jyada", "bada", "sabse high", "highest value"
    ]):
        target = matched_col if (matched_col and matched_col in num_cols) else (num_cols[0] if num_cols else None)
        if target:
            mx_val = df[target].max()
            idx = df[target].idxmax()
            row_dict = df.iloc[idx].to_dict()
            first_cols = [f"- **{k}**: {v}" for k, v in list(row_dict.items())[:3]]
            items_str = "\n".join(first_cols)
            ans = f"🔝 The highest value for **{target}** is **{mx_val}**.\n\n📍 **Associated Record Info:**\n{items_str}"
            speech = f"The maximum value for {target} is {mx_val}."
            return {"answer": ans, "speech_text": speech}
        elif matched_col and matched_col in cat_cols:
            top_cat = df[matched_col].value_counts().head(1)
            ans = f"🔝 The most frequent category in **{matched_col}** is **{top_cat.index[0]}** with {int(top_cat.values[0])} occurrences."
            speech = f"The top category in {matched_col} is {top_cat.index[0]} with {int(top_cat.values[0])} items."
            return {"answer": ans, "speech_text": speech}

    # 3. Lowest / Minimum (English and Hindi/Hinglish)
    if any(k in q for k in [
        "lowest", "minimum", "min", "bottom value", "smallest",
        "sabse kam", "sabse chhota", "sabse low", "chhota", "kam value"
    ]):
        target = matched_col if (matched_col and matched_col in num_cols) else (num_cols[0] if num_cols else None)
        if target:
            mn_val = df[target].min()
            idx = df[target].idxmin()
            row_dict = df.iloc[idx].to_dict()
            first_cols = [f"- **{k}**: {v}" for k, v in list(row_dict.items())[:3]]
            items_str = "\n".join(first_cols)
            ans = f"📉 The lowest value for **{target}** is **{mn_val}**.\n\n📍 **Associated Record Info:**\n{items_str}"
            speech = f"The minimum value for {target} is {mn_val}."
            return {"answer": ans, "speech_text": speech}

    # 4. Average / Mean (English and Hindi/Hinglish)
    if any(k in q for k in [
        "average", "mean", "avg", "ausat", "average value", "mean value", "madhya"
    ]):
        target = matched_col if (matched_col and matched_col in num_cols) else (num_cols[0] if num_cols else None)
        if target:
            avg_val = round(float(df[target].mean()), 2)
            med_val = round(float(df[target].median()), 2)
            ans = f"📐 The average (mean) value for **{target}** is **{avg_val:,}** (Median: **{med_val:,}**)."
            speech = f"The average for {target} is {avg_val}, and the median is {med_val}."
            return {"answer": ans, "speech_text": speech}

    # 5. Outliers / Anomalies (English and Hindi/Hinglish)
    if any(k in q for k in [
        "outlier", "anomaly", "anomalies", "abnormal", "kharab", "gadbad", "extreme"
    ]):
        outliers_found = []
        for col in num_cols:
            s = df[col].dropna()
            if len(s) >= 4:
                q25, q75 = np.percentile(s, [25, 75])
                iqr = q75 - q25
                cnt = int(((s < (q25 - 1.5 * iqr)) | (s > (q75 + 1.5 * iqr))).sum())
                if cnt > 0:
                    outliers_found.append(f"**{col}**: {cnt} outlier(s)")
        if outliers_found:
            out_str = "\n- ".join(outliers_found)
            ans = f"⚠️ **Detected statistical outliers (1.5×IQR boundary):**\n\n- {out_str}"
            speech = f"Outliers were detected in {len(outliers_found)} numeric columns."
        else:
            ans = "✅ No significant statistical outliers detected in numeric features using the 1.5×IQR method."
            speech = "No outliers were detected in your dataset."
        return {"answer": ans, "speech_text": speech}

    # 6. Correlation / Relationship (English and Hindi/Hinglish)
    if any(k in q for k in [
        "correlation", "relationship", "correlated", "relation", "sambandh", "kiske sath"
    ]):
        if len(num_cols) >= 2:
            corr_mat = df[num_cols].corr(method="pearson").abs()
            np.fill_diagonal(corr_mat.values, 0)
            c1 = corr_mat.max().idxmax()
            c2 = corr_mat[c1].idxmax()
            r_val = round(float(df[c1].corr(df[c2])), 4)
            strength = "Strong" if abs(r_val) > 0.7 else "Moderate" if abs(r_val) > 0.4 else "Weak"
            ans = f"🔗 The strongest correlation is between **{c1}** and **{c2}** with a Pearson coefficient of **{r_val}** ({strength} relationship)."
            speech = f"The strongest correlation is between {c1} and {c2} with a coefficient of {r_val}."
            return {"answer": ans, "speech_text": speech}
        else:
            return {
                "answer": "⚠️ Correlation requires at least two numeric columns in the dataset.",
                "speech_text": "Correlation requires at least two numeric columns."
            }

    # 7. Distribution / Common categories (English and Hindi/Hinglish)
    if any(k in q for k in [
        "common", "frequent", "popular", "categories", "distribution", "bar chart",
        "kaunsa category", "top category", "bhed", "vibhajan"
    ]):
        target = matched_col if (matched_col and matched_col in cat_cols) else (cat_cols[0] if cat_cols else None)
        if target:
            top_vals = df[target].value_counts().head(5).to_dict()
            items_str = "\n".join([f"- **{k}**: {v:,} records" for k, v in top_vals.items()])
            most_freq = list(top_vals.keys())[0]
            ans = f"📊 Top category distribution for **{target}**:\n\n{items_str}"
            speech = f"The most frequent category in {target} is {most_freq}."
            return {"answer": ans, "speech_text": speech}

    # 8. Data Cleanliness / Missing values / Nulls (English and Hindi/Hinglish)
    if any(k in q for k in [
        "null", "missing", "clean", "duplicate", "quality", "khali", "khali values",
        "missing value", "safai", "duplicate rows"
    ]):
        null_counts = df.isnull().sum()
        null_cols = {col: int(cnt) for col, cnt in null_counts.items() if cnt > 0}
        total_nulls = int(null_counts.sum())
        dups = int(df.duplicated().sum())
        
        detail_msg = "\n".join([f"- **{k}**: {v} missing values" for k, v in null_cols.items()]) if null_cols else "None (all fields complete)"
        rating = "🌟 Excellent (100% complete)" if total_nulls == 0 and dups == 0 else "⚠️ Acceptable with minor gaps"
        ans = f"🧹 **Data Integrity and Quality Audit:**\n- **Total Nulls / Missing**: {total_nulls}\n{detail_msg}\n- **Duplicate Rows**: {dups}\n\nOverall data cleanliness rating: **{rating}**."
        speech = f"Found {total_nulls} missing values and {dups} duplicate rows in the dataset."
        return {"answer": ans, "speech_text": speech}

    # 9. Targeted Column Deep Dive
    if matched_col:
        if matched_col in num_cols:
            s = df[matched_col].dropna()
            avg = round(float(s.mean()), 2)
            med = round(float(s.median()), 2)
            mn = round(float(s.min()), 2)
            mx = round(float(s.max()), 2)
            nulls = int(df[matched_col].isnull().sum())
            pct = round((nulls / len(df)) * 100, 1)
            ans = (
                f"📋 **Statistical Profile for column '{matched_col}':**\n"
                f"- **Data Type**: Numeric\n"
                f"- **Average (Mean)**: {avg:,}\n"
                f"- **Median**: {med:,}\n"
                f"- **Range**: {mn:,} to {mx:,}\n"
                f"- **Missing / Nulls**: {nulls} ({pct}%)\n"
            )
            speech = f"Column {matched_col} has an average of {avg}, ranging from {mn} to {mx}."
            return {"answer": ans, "speech_text": speech}
        elif matched_col in cat_cols:
            top_vals = df[matched_col].value_counts().head(5).to_dict()
            unique_cnt = df[matched_col].nunique()
            nulls = int(df[matched_col].isnull().sum())
            top_str = ", ".join([f"{k} ({v})" for k, v in list(top_vals.items())[:3]])
            ans = (
                f"📋 **Categorical Profile for column '{matched_col}':**\n"
                f"- **Data Type**: Categorical (Text/Dimension)\n"
                f"- **Unique Classes**: {unique_cnt}\n"
                f"- **Top Classes**: {top_str}\n"
                f"- **Missing / Nulls**: {nulls}\n"
            )
            speech = f"Column {matched_col} has {unique_cnt} unique values. Top items are {top_str}."
            return {"answer": ans, "speech_text": speech}

    # 10. Intelligent Varied Fallback / Suggested Explorations
    num_summary = []
    for c in num_cols[:3]:
        num_summary.append(f"• **{c}**: Mean = {round(float(df[c].mean()), 2)}, Range = [{round(float(df[c].min()), 2)} to {round(float(df[c].max()), 2)}]")
    cat_summary = f"Categorical features: {', '.join(cat_cols[:3])}." if cat_cols else "All numeric dataset."
    suggested_q = [
        f"What is the average {num_cols[0]}?" if num_cols else "How many rows are there?",
        f"What is the highest {num_cols[0]}?" if num_cols else "Are there missing values?",
        f"Are there any outliers in {num_cols[-1]}?" if num_cols else "Show categories."
    ]
    num_str = "\n".join(num_summary)
    sug_str = "\n".join([f"- *\"{sq}\"* " for sq in suggested_q])
    ans = (
        f"💡 **AI Data Insights for '{question}':**\n\n"
        f"The dataset contains **{len(df):,} records** across **{len(cols)} columns**.\n"
        f"{num_str}\n\n{cat_summary}\n\n"
        f"🎯 **Try asking:**\n{sug_str}"
    )
    speech = f"This dataset has {len(df)} records. You can ask about averages, outliers, or maximum values."
    return {"answer": ans, "speech_text": speech}


@app.post("/ask")
async def ask_question_endpoint(req: AskRequest):
    """
    Natural language Q&A endpoint for the dataset.
    Returns structured answer and text-to-speech representation.
    """
    if not req.file_path or not os.path.exists(req.file_path):
        raise HTTPException(status_code=404, detail="Dataset file not found.")

    try:
        df = load_dataframe_from_path(req.file_path)
        response = query_dataset_intelligence(df, req.question)
        return {
            "question": req.question,
            "answer": response["answer"],
            "speech_text": response["speech_text"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to query dataset: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("eda_service:app", host="0.0.0.0", port=5000, reload=True)

