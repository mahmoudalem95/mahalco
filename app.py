"""שירות המרה עבור כלי ה-CAD של MAHALCO.
   POST /dxf2dwg  – מקבל DXF ומחזיר DWG אמיתי (LibreDWG dxf2dwg, R2000)
   POST /dwg2dxf  – מקבל DWG (מדידה, מסגרת שרטוט) ומחזיר DXF לקריאה בדפדפן
"""
import os
import pathlib
import subprocess
import tempfile

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response

ALLOW = [o.strip() for o in os.environ.get("ALLOW_ORIGINS", "*").split(",") if o.strip()]
MAX_BYTES = 60 * 1024 * 1024

app = FastAPI(title="mahalco cad convert")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOW,
    allow_methods=["POST", "GET", "OPTIONS"],
    allow_headers=["*"],
)


@app.get("/")
@app.head("/")          # בדיקת הבריאות של Render שולחת HEAD
def health():
    return {"ok": True, "service": "mahalco-cad", "endpoints": ["/dxf2dwg", "/dwg2dxf"],
            "dwg_version": "r2000"}


async def _body(req: Request) -> bytes:
    data = await req.body()
    if not data:
        raise HTTPException(400, "empty body")
    if len(data) > MAX_BYTES:
        raise HTTPException(413, "file too large")
    return data


def _run(cmd, timeout=240):
    try:
        return subprocess.run(cmd, capture_output=True, timeout=timeout)
    except subprocess.TimeoutExpired:
        raise HTTPException(504, "conversion timeout")
    except FileNotFoundError:
        raise HTTPException(500, f"missing tool: {cmd[0]}")


@app.post("/dxf2dwg")
async def dxf_to_dwg(req: Request):
    data = await _body(req)
    with tempfile.TemporaryDirectory() as d:
        src = pathlib.Path(d) / "in.dxf"
        dst = pathlib.Path(d) / "out.dwg"
        src.write_bytes(data)
        p = _run(["dxf2dwg", "-y", "--as", "r2000", "-o", str(dst), str(src)])
        if not dst.exists() or dst.stat().st_size < 512:
            msg = (p.stderr[-400:] or b"conversion failed").decode("utf-8", "replace")
            raise HTTPException(502, msg)
        return Response(dst.read_bytes(), media_type="image/vnd.dwg",
                        headers={"Content-Disposition": 'attachment; filename="drawing.dwg"'})


@app.post("/dwg2dxf")
async def dwg_to_dxf(req: Request):
    """קריאת DWG של מדידה או של מסגרת שרטוט, והחזרתו כ-DXF טקסטואלי."""
    data = await _body(req)
    with tempfile.TemporaryDirectory() as d:
        src = pathlib.Path(d) / "in.dwg"
        dst = pathlib.Path(d) / "out.dxf"
        src.write_bytes(data)
        p = _run(["dwg2dxf", "-y", "-o", str(dst), str(src)])
        if not dst.exists() or dst.stat().st_size < 128:
            msg = (p.stderr[-400:] or b"conversion failed").decode("utf-8", "replace")
            raise HTTPException(502, msg)
        return Response(dst.read_bytes(), media_type="application/dxf",
                        headers={"Content-Disposition": 'attachment; filename="survey.dxf"'})
