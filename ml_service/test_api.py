import asyncio
import io
from PIL import Image
from starlette.datastructures import UploadFile
from main import health_check, classify_foliar, CLASSES

def test_health_check():
    res = health_check()
    assert res["status"] == "healthy"
    assert res["service"] == "FastAPI ML Engine"
    print("[OK] Health check endpoint passed:", res)

def test_classification():
    # Create synthetic test leaf image (green background with brown spot)
    img = Image.new("RGB", (256, 256), color=(34, 139, 34))
    for x in range(100, 150):
        for y in range(100, 150):
            img.putpixel((x, y), (139, 69, 19))

    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    buf.seek(0)

    upload_file = UploadFile(filename="leaf_sample.jpg", file=buf, headers={"content-type": "image/jpeg"})

    result = asyncio.run(classify_foliar(upload_file))

    assert result.predicted_class in CLASSES
    assert isinstance(result.confidence, float)
    assert result.confidence_band in ["HIGH", "MODERATE", "LOW"]
    assert len(result.top3_classes) == 3
    assert result.gradcam_heatmap_url.startswith("http://localhost:8000/static/heatmaps/")
    print(f"[OK] Classification passed: {result.predicted_class} (Confidence: {result.confidence}, Band: {result.confidence_band})")
    print(f"[OK] Top 3: {[c.model_dump() for c in result.top3_classes]}")
    print(f"[OK] Heatmap URL: {result.gradcam_heatmap_url}")

if __name__ == "__main__":
    test_health_check()
    test_classification()
    print("[OK] All ML Service tests passed successfully!")
