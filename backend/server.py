"""
AgriSense Computer Vision Inference Backend
Combines:
1. YOLOv8 Plant Leaf Object Detection (46 agricultural plant/leaf classes)
2. YOLOv8 COCO Object Detection (for Person and general object verification)
3. OpenCV for image decoding, preprocessing, BGR-to-RGB conversion, cropping & focus assessment
4. MobileNetV2 PlantVillage Pathology Classifier (38 validated healthy & diseased classes)
"""

import io
import re
import base64
import time
from typing import Optional, List, Dict, Any

import cv2
import numpy as np
import torch
from PIL import Image
from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Body, Request, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from ultralytics import YOLO
from transformers import MobileNetV2ForImageClassification, MobileNetV2ImageProcessor

try:
    from backend.hardware_service import hardware_manager
except ImportError:
    from hardware_service import hardware_manager


app = FastAPI(
    title="AgriSense Computer Vision Microservice",
    description="Real-time YOLO plant/leaf detection and MobileNetV2 plant pathology classification",
    version="2.0.0"
)

# Enable CORS for Vite frontend running locally on any port
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------------------------------------
# Global Model Instances & Initialization
# -------------------------------------------------------------
print("Initializing AgriSense Computer Vision Models...")

# 1. YOLO Plant Leaf Object Detector
LEAF_MODEL_PATH = "backend/models/plant_leaf_yolov8.pt"
print(f"Loading Plant Leaf YOLO model from {LEAF_MODEL_PATH}...")
leaf_detector = YOLO(LEAF_MODEL_PATH)

# 2. General Object / Person YOLO Detector
GENERAL_MODEL_PATH = "yolov8n.pt"
print(f"Loading General YOLO model from {GENERAL_MODEL_PATH}...")
general_detector = YOLO(GENERAL_MODEL_PATH)

# 3. MobileNetV2 Plant Disease Classifier
CLASSIFIER_MODEL_ID = "linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification"
print(f"Loading MobileNetV2 Pathology Classifier from {CLASSIFIER_MODEL_ID}...")
disease_classifier = MobileNetV2ForImageClassification.from_pretrained(CLASSIFIER_MODEL_ID)
disease_classifier.eval()
image_processor = MobileNetV2ImageProcessor()

print("All Computer Vision Models successfully initialized and ready for inference!")

# -------------------------------------------------------------
# Class Mapping & Agronomic Knowledge Translation
# -------------------------------------------------------------
# Map the 38 PlantVillage classes to AgriSense database keys
PLANTVILLAGE_TO_AGRISENSE_KEY = {
    # 0: Apple Scab
    "Apple Scab": "apple_scab",
    "Apple___Apple_scab": "apple_scab",
    # 1: Apple with Black Rot
    "Apple with Black Rot": "apple_black_rot",
    "Apple___Black_rot": "apple_black_rot",
    # 2: Cedar Apple Rust
    "Cedar Apple Rust": "cedar_apple_rust",
    "Apple___Cedar_apple_rust": "cedar_apple_rust",
    # 3: Healthy Apple
    "Healthy Apple": "healthy_apple",
    "Healthy Apple Plant": "healthy_apple",
    "Apple___healthy": "healthy_apple",
    # 4: Healthy Blueberry Plant
    "Healthy Blueberry Plant": "healthy_blueberry",
    "Healthy Blueberry": "healthy_blueberry",
    "Blueberry___healthy": "healthy_blueberry",
    # 5: Cherry with Powdery Mildew
    "Cherry with Powdery Mildew": "cherry_powdery_mildew",
    "Cherry_(including_sour)___Powdery_mildew": "cherry_powdery_mildew",
    # 6: Healthy Cherry Plant
    "Healthy Cherry Plant": "healthy_cherry",
    "Healthy Cherry": "healthy_cherry",
    "Cherry_(including_sour)___healthy": "healthy_cherry",
    # 7: Corn (Maize) with Cercospora and Gray Leaf Spot
    "Corn (Maize) with Cercospora and Gray Leaf Spot": "corn_gray_leaf_spot",
    "Corn with Cercospora / Gray Leaf Spot": "corn_gray_leaf_spot",
    "Corn_(maize)___Cercospora_leaf_spot_Gray_leaf_spot": "corn_gray_leaf_spot",
    # 8: Corn (Maize) with Common Rust
    "Corn (Maize) with Common Rust": "corn_common_rust",
    "Corn with Common Rust": "corn_common_rust",
    "Corn_(maize)___Common_rust_": "corn_common_rust",
    # 9: Corn (Maize) with Northern Leaf Blight
    "Corn (Maize) with Northern Leaf Blight": "corn_leaf_blight",
    "Corn with Northern Leaf Blight": "corn_leaf_blight",
    "Corn_(maize)___Northern_Leaf_Blight": "corn_leaf_blight",
    # 10: Healthy Corn (Maize) Plant
    "Healthy Corn (Maize) Plant": "healthy_corn",
    "Healthy Corn Plant": "healthy_corn",
    "Healthy Corn": "healthy_corn",
    "Corn_(maize)___healthy": "healthy_corn",
    # 11: Grape with Black Rot
    "Grape with Black Rot": "grape_black_rot",
    "Grape___Black_rot": "grape_black_rot",
    # 12: Grape with Esca (Black Measles)
    "Grape with Esca (Black Measles)": "grape_esca",
    "Grape___Esca_(Black_Measles)": "grape_esca",
    # 13: Grape with Isariopsis Leaf Spot
    "Grape with Isariopsis Leaf Spot": "grape_leaf_blight",
    "Grape with Leaf Blight": "grape_leaf_blight",
    "Grape___Leaf_blight_(Isariopsis_Leaf_Spot)": "grape_leaf_blight",
    # 14: Healthy Grape Plant
    "Healthy Grape Plant": "healthy_grape",
    "Healthy Grape": "healthy_grape",
    "Grape___healthy": "healthy_grape",
    # 15: Orange with Citrus Greening
    "Orange with Citrus Greening": "citrus_greening",
    "Orange___Haunglongbing_(Citrus_greening)": "citrus_greening",
    # 16: Peach with Bacterial Spot
    "Peach with Bacterial Spot": "peach_bacterial_spot",
    "Peach___Bacterial_spot": "peach_bacterial_spot",
    # 17: Healthy Peach Plant
    "Healthy Peach Plant": "healthy_peach",
    "Healthy Peach": "healthy_peach",
    "Peach___healthy": "healthy_peach",
    # 18: Bell Pepper with Bacterial Spot
    "Bell Pepper with Bacterial Spot": "pepper_bacterial_spot",
    "Pepper,_bell___Bacterial_spot": "pepper_bacterial_spot",
    # 19: Healthy Bell Pepper Plant
    "Healthy Bell Pepper Plant": "healthy_bell_pepper",
    "Healthy Pepper Plant": "healthy_bell_pepper",
    "Pepper,_bell___healthy": "healthy_bell_pepper",
    # 20: Potato with Early Blight
    "Potato with Early Blight": "potato_early_blight",
    "Potato___Early_blight": "potato_early_blight",
    # 21: Potato with Late Blight
    "Potato with Late Blight": "potato_late_blight",
    "Potato___Late_blight": "potato_late_blight",
    # 22: Healthy Potato Plant
    "Healthy Potato Plant": "healthy_potato",
    "Healthy Potato": "healthy_potato",
    "Potato___healthy": "healthy_potato",
    # 23: Healthy Raspberry Plant
    "Healthy Raspberry Plant": "healthy_raspberry",
    "Healthy Raspberry": "healthy_raspberry",
    "Raspberry___healthy": "healthy_raspberry",
    # 24: Healthy Soybean Plant
    "Healthy Soybean Plant": "healthy_soybean",
    "Healthy Soybean": "healthy_soybean",
    "Soybean___healthy": "healthy_soybean",
    # 25: Squash with Powdery Mildew
    "Squash with Powdery Mildew": "squash_powdery_mildew",
    "Squash___Powdery_mildew": "squash_powdery_mildew",
    # 26: Strawberry with Leaf Scorch
    "Strawberry with Leaf Scorch": "strawberry_leaf_scorch",
    "Strawberry___Leaf_scorch": "strawberry_leaf_scorch",
    # 27: Healthy Strawberry Plant
    "Healthy Strawberry Plant": "healthy_strawberry",
    "Healthy Strawberry": "healthy_strawberry",
    "Strawberry___healthy": "healthy_strawberry",
    # 28: Tomato with Bacterial Spot
    "Tomato with Bacterial Spot": "tomato_bacterial_spot",
    "Tomato___Bacterial_spot": "tomato_bacterial_spot",
    # 29: Tomato with Early Blight
    "Tomato with Early Blight": "tomato_early_blight",
    "Tomato___Early_blight": "tomato_early_blight",
    # 30: Tomato with Late Blight
    "Tomato with Late Blight": "tomato_late_blight",
    "Tomato___Late_blight": "tomato_late_blight",
    # 31: Tomato with Leaf Mold
    "Tomato with Leaf Mold": "tomato_leaf_mold",
    "Tomato___Leaf_Mold": "tomato_leaf_mold",
    # 32: Tomato with Septoria Leaf Spot
    "Tomato with Septoria Leaf Spot": "tomato_septoria_leaf_spot",
    "Tomato___Septoria_leaf_spot": "tomato_septoria_leaf_spot",
    # 33: Tomato with Spider Mites or Two-spotted Spider Mite
    "Tomato with Spider Mites or Two-spotted Spider Mite": "tomato_spider_mites",
    "Tomato with Two-spotted Spider Mite": "tomato_spider_mites",
    "Tomato___Spider_mites_Two_spotted_spider_mite": "tomato_spider_mites",
    # 34: Tomato with Target Spot
    "Tomato with Target Spot": "tomato_target_spot",
    "Tomato___Target_Spot": "tomato_target_spot",
    # 35: Tomato Yellow Leaf Curl Virus
    "Tomato Yellow Leaf Curl Virus": "tomato_yellow_leaf_curl",
    "Tomato___Tomato_Yellow_Leaf_Curl_Virus": "tomato_yellow_leaf_curl",
    # 36: Tomato Mosaic Virus
    "Tomato Mosaic Virus": "tomato_mosaic_virus",
    "Tomato___Tomato_mosaic_virus": "tomato_mosaic_virus",
    # 37: Healthy Tomato Plant
    "Healthy Tomato Plant": "healthy_tomato",
    "Healthy Tomato": "healthy_tomato",
    "Tomato___healthy": "healthy_tomato",
}


def decode_image_bytes(image_data: bytes) -> np.ndarray:
    """Use OpenCV to decode raw bytes into BGR numpy matrix."""
    nparr = np.frombuffer(image_data, np.uint8)
    img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img_bgr is None:
        raise ValueError("OpenCV failed to decode image buffer. Invalid image format.")
    return img_bgr


def decode_base64_or_bytes(image_str_or_bytes: str) -> np.ndarray:
    """Decode data URL or base64 string using OpenCV."""
    if isinstance(image_str_or_bytes, bytes):
        return decode_image_bytes(image_str_or_bytes)
    
    if image_str_or_bytes.startswith("data:"):
        image_str_or_bytes = re.sub(r"^data:image/.+;base64,", "", image_str_or_bytes)
    
    raw_bytes = base64.b64decode(image_str_or_bytes)
    return decode_image_bytes(raw_bytes)


class DetectRequest(BaseModel):
    image: str
    confidence_threshold: Optional[float] = 0.20


# -------------------------------------------------------------
# API Endpoints
# -------------------------------------------------------------

@app.get("/api/health")
def health_check():
    """Health check endpoint confirming model status, classes, and device."""
    return {
        "status": "online",
        "service": "AgriSense Computer Vision Engine",
        "device": "cpu",
        "models": {
            "yolo_leaf_detector": {
                "name": "YOLOv8s Plant Leaf Model",
                "classes_count": len(leaf_detector.names),
                "supported_classes": list(leaf_detector.names.values())
            },
            "yolo_general_detector": {
                "name": "YOLOv8n COCO Object Detector",
                "classes_count": len(general_detector.names),
                "supports_person": True
            },
            "disease_classifier": {
                "name": "MobileNetV2 PlantVillage Pathology Model",
                "classes_count": len(disease_classifier.config.id2label),
                "classes": list(disease_classifier.config.id2label.values())
            }
        },
        "uptime": "operational"
    }


@app.post("/api/detect")
async def detect_objects(
    file: Optional[UploadFile] = File(None),
    image: Optional[str] = Form(None)
):
    """
    Real-time YOLO Leaf and Plant Object Detection Endpoint.
    Uses OpenCV for decoding and image processing.
    Runs YOLOv8 leaf detection and checks for person presence.
    Returns normalized bounding boxes, class names, and confidences.
    """
    try:
        if file is not None:
            content = await file.read()
            img_bgr = decode_image_bytes(content)
        elif image is not None:
            img_bgr = decode_base64_or_bytes(image)
        else:
            raise HTTPException(status_code=400, detail="No image provided.")

        h, w, c = img_bgr.shape

        # 1. Run YOLO Plant Leaf Model
        # conf=0.15 gives high recall for partial or shadowed leaves
        leaf_results = leaf_detector.predict(source=img_bgr, conf=0.18, verbose=False)

        leaf_detections = []
        for r in leaf_results:
            for box in r.boxes:
                cls_id = int(box.cls[0].item())
                cls_name = leaf_detector.names[cls_id]
                conf = float(box.conf[0].item())
                xyxy = box.xyxy[0].tolist()

                # Calculate normalized coordinates (0 to 100 percentage)
                x1, y1, x2, y2 = xyxy
                norm_x = max(0.0, (x1 / w) * 100)
                norm_y = max(0.0, (y1 / h) * 100)
                norm_w = min(100.0, ((x2 - x1) / w) * 100)
                norm_h = min(100.0, ((y2 - y1) / h) * 100)

                leaf_detections.append({
                    "id": f"det-leaf-{len(leaf_detections) + 1}",
                    "class_id": cls_id,
                    "class_name": cls_name,
                    "label": f"{cls_name.capitalize()} Leaf",
                    "confidence": round(conf * 100, 1),
                    "confidence_ratio": round(conf, 3),
                    "box_pixels": [round(x1, 1), round(y1, 1), round(x2, 1), round(y2, 1)],
                    "box_percent": {
                        "x": round(norm_x, 1),
                        "y": round(norm_y, 1),
                        "width": round(norm_w, 1),
                        "height": round(norm_h, 1)
                    },
                    "is_plant": True,
                    "is_person": False
                })

        # 2. Run General YOLO Model to check for person presence
        general_results = general_detector.predict(source=img_bgr, conf=0.35, verbose=False)
        person_detections = []
        for r in general_results:
            for box in r.boxes:
                cls_id = int(box.cls[0].item())
                cls_name = general_detector.names[cls_id]
                if cls_name == "person":
                    conf = float(box.conf[0].item())
                    xyxy = box.xyxy[0].tolist()
                    x1, y1, x2, y2 = xyxy
                    person_detections.append({
                        "id": f"det-person-{len(person_detections) + 1}",
                        "class_id": cls_id,
                        "class_name": "person",
                        "label": "Person",
                        "confidence": round(conf * 100, 1),
                        "confidence_ratio": round(conf, 3),
                        "box_pixels": [round(x1, 1), round(y1, 1), round(x2, 1), round(y2, 1)],
                        "box_percent": {
                            "x": round((x1 / w) * 100, 1),
                            "y": round((y1 / h) * 100, 1),
                            "width": round(((x2 - x1) / w) * 100, 1),
                            "height": round(((y2 - y1) / h) * 100, 1)
                        },
                        "is_plant": False,
                        "is_person": True
                    })

        all_detections = leaf_detections + person_detections
        has_leaves = len(leaf_detections) > 0
        has_person = len(person_detections) > 0

        # Primary leaf: highest confidence leaf
        primary_leaf = max(leaf_detections, key=lambda d: d["confidence"]) if has_leaves else None

        return {
            "success": True,
            "image_size": {"width": w, "height": h},
            "detections_count": len(all_detections),
            "leaf_count": len(leaf_detections),
            "person_count": len(person_detections),
            "has_leaves": has_leaves,
            "has_person": has_person,
            "primary_leaf": primary_leaf,
            "detections": all_detections,
            "status_message": (
                f"Detected {len(leaf_detections)} plant leaf object(s)" if has_leaves
                else ("Person detected in frame. Please aim camera at a crop leaf." if has_person
                      else "No plant foliage detected. Center leaf in viewfinder.")
            )
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "detections": []
        }


@app.post("/api/classify")
async def classify_disease(
    file: Optional[UploadFile] = File(None),
    image: Optional[str] = Form(None)
):
    """
    Genuine Plant Pathology Classification Endpoint.
    1. Runs YOLO object detection via OpenCV to verify leaf presence.
    2. Crops to leaf region if localized.
    3. Feeds preprocessed RGB tensor into fine-tuned MobileNetV2 (PlantVillage 38-class).
    4. Evaluates prediction confidence and returns honest diagnosis or uncertainty warning.
    """
    try:
        if file is not None:
            content = await file.read()
            img_bgr = decode_image_bytes(content)
        elif image is not None:
            img_bgr = decode_base64_or_bytes(image)
        else:
            raise HTTPException(status_code=400, detail="No image provided.")

        h, w, c = img_bgr.shape

        # Check optical focus / featureless image (e.g. blank canvas, out-of-focus blur)
        gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
        laplacian_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())
        if laplacian_var < 0.5:
            return {
                "success": False,
                "is_plant": False,
                "is_uncertain": True,
                "errorType": "blurry_image",
                "error": "The captured leaf photo appears blurry, blank or out of focus. Please stabilize your camera 15-25cm away and capture a crisp image of the leaf blade."
            }

        # Step 1: Real YOLO detection
        leaf_results = leaf_detector.predict(source=img_bgr, conf=0.18, verbose=False)
        leaf_detections = []
        for r in leaf_results:
            for box in r.boxes:
                cls_id = int(box.cls[0].item())
                cls_name = leaf_detector.names[cls_id]
                conf = float(box.conf[0].item())
                xyxy = box.xyxy[0].tolist()
                x1, y1, x2, y2 = xyxy
                leaf_detections.append({
                    "id": f"lesion-box-{len(leaf_detections)+1}",
                    "class_name": cls_name,
                    "label": f"{cls_name.capitalize()} Leaf Specimen",
                    "confidence": round(conf * 100, 1),
                    "x": max(2.0, min(90.0, round((x1 / w) * 100, 1))),
                    "y": max(2.0, min(90.0, round((y1 / h) * 100, 1))),
                    "width": max(8.0, min(96.0, round(((x2 - x1) / w) * 100, 1))),
                    "height": max(8.0, min(96.0, round(((y2 - y1) / h) * 100, 1))),
                    "box_pixels": [int(x1), int(y1), int(x2), int(y2)]
                })

        # Check for person in frame using general detector
        gen_results = general_detector.predict(source=img_bgr, conf=0.35, verbose=False)
        person_found = any(general_detector.names[int(b.cls[0].item())] == "person" for r in gen_results for b in r.boxes)

        if person_found and len(leaf_detections) == 0:
            return {
                "success": False,
                "is_plant": False,
                "is_uncertain": True,
                "error": "Person detected in frame. Please hold the camera 15-25cm above a plant leaf or crop specimen.",
                "detections": []
            }

        # Step 2: Crop focal leaf region using OpenCV bounding box
        eval_img_bgr = img_bgr
        cropped_leaf_b64 = None
        crop_box = None
        has_leaf = len(leaf_detections) > 0

        if has_leaf:
            best_det = max(leaf_detections, key=lambda d: d["confidence"])
            bx1, by1, bx2, by2 = best_det["box_pixels"]
            # Add 8% padding around box while clamping to image boundaries
            pad_x = int((bx2 - bx1) * 0.08)
            pad_y = int((by2 - by1) * 0.08)
            crop_x1 = max(0, bx1 - pad_x)
            crop_y1 = max(0, by1 - pad_y)
            crop_x2 = min(w, bx2 + pad_x)
            crop_y2 = min(h, by2 + pad_y)
            if (crop_x2 - crop_x1) > 25 and (crop_y2 - crop_y1) > 25:
                eval_img_bgr = img_bgr[crop_y1:crop_y2, crop_x1:crop_x2]
                crop_box = {
                    "x1": crop_x1,
                    "y1": crop_y1,
                    "x2": crop_x2,
                    "y2": crop_y2,
                    "width": crop_x2 - crop_x1,
                    "height": crop_y2 - crop_y1
                }
                # Encode cropped leaf to base64 jpeg thumbnail
                _, buffer = cv2.imencode(".jpg", eval_img_bgr, [int(cv2.IMWRITE_JPEG_QUALITY), 88])
                cropped_leaf_b64 = "data:image/jpeg;base64," + base64.b64encode(buffer).decode()

        # Convert OpenCV BGR to RGB for PyTorch MobileNetV2
        eval_img_rgb = cv2.cvtColor(eval_img_bgr, cv2.COLOR_BGR2RGB)
        pil_img = Image.fromarray(eval_img_rgb)

        # Step 3: Run MobileNetV2 PlantVillage Pathology Model
        inputs = image_processor(images=pil_img, return_tensors="pt")
        with torch.no_grad():
            outputs = disease_classifier(**inputs)
            logits = outputs.logits
            probs = torch.nn.functional.softmax(logits, dim=-1)[0]
            top_k = torch.topk(probs, k=5)

        top_predictions = []
        for p, idx in zip(top_k.values, top_k.indices):
            raw_label = disease_classifier.config.id2label[idx.item()]
            top_predictions.append({
                "label": raw_label,
                "probability": round(p.item(), 4),
                "confidence_percent": round(p.item() * 100, 1)
            })

        best_pred = top_predictions[0]
        top_label = best_pred["label"]
        top_confidence = best_pred["confidence_percent"]

        # Check uncertainty: if no leaf localized and classification confidence is low
        is_uncertain = False
        clarity_warning = None
        if not has_leaf and top_confidence < 45.0:
            is_uncertain = True
            clarity_warning = (
                f"No clear plant or leaf structure localized (Model confidence: {top_confidence}%). "
                "Please hold the camera 15-25cm directly above a crop leaf and ensure good daylight."
            )

        # Map to AgriSense database key
        matched_key = PLANTVILLAGE_TO_AGRISENSE_KEY.get(top_label, "healthy_leaf")

        # Robustly extract crop / plant name from raw model label
        clean_name = top_label.replace("Healthy ", "")
        if " with " in clean_name:
            detected_plant = clean_name.split(" with ")[0].strip()
        elif " Plant" in clean_name:
            detected_plant = clean_name.replace(" Plant", "").strip()
        elif clean_name.startswith("Apple"):
            detected_plant = "Apple"
        elif clean_name.startswith("Cedar Apple"):
            detected_plant = "Apple"
        elif clean_name.startswith("Bell Pepper"):
            detected_plant = "Bell Pepper"
        else:
            detected_plant = clean_name.split(" ")[0].strip()

        is_healthy = "healthy" in top_label.lower()

        # Compute tissue metrics via OpenCV HSV segmentation
        hsv = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2HSV)
        # Green mask for chlorophyll
        lower_green = np.array([25, 40, 40])
        upper_green = np.array([85, 255, 255])
        green_mask = cv2.inRange(hsv, lower_green, upper_green)
        chlorophyll_coverage = round(float(np.sum(green_mask > 0) / (w * h)) * 100, 1)

        # Necrotic mask (brown/black)
        lower_brown = np.array([10, 40, 20])
        upper_brown = np.array([25, 255, 180])
        brown_mask = cv2.inRange(hsv, lower_brown, upper_brown)
        necrotic_lesion_area = round(float(np.sum(brown_mask > 0) / (w * h)) * 100, 1)

        # Chlorotic mask (yellow)
        lower_yellow = np.array([18, 50, 100])
        upper_yellow = np.array([35, 255, 255])
        yellow_mask = cv2.inRange(hsv, lower_yellow, upper_yellow)
        chlorosis_yellowing = round(float(np.sum(yellow_mask > 0) / (w * h)) * 100, 1)

        # Prepare Hotspots from YOLO leaf bounding boxes
        hotspots = []
        for idx, det in enumerate(leaf_detections):
            hotspots.append({
                "id": det["id"],
                "x": det["x"],
                "y": det["y"],
                "width": det["width"],
                "height": det["height"],
                "label": f"{det['class_name'].capitalize()} Leaf ({det['confidence']}%)"
            })

        # If no YOLO boxes but pathology detected a disease, place center inspection reticle
        if len(hotspots) == 0 and not is_healthy:
            hotspots.append({
                "id": "lesion-center-1",
                "x": 25,
                "y": 25,
                "width": 50,
                "height": 50,
                "label": f"Primary Diagnostic Zone: {top_label}"
            })

        return {
            "success": True,
            "is_plant": True,
            "has_leaf_detection": has_leaf,
            "leaf_count": len(leaf_detections),
            "is_healthy": is_healthy,
            "is_uncertain": is_uncertain,
            "clarity_warning": clarity_warning,
            "matchedKey": matched_key,
            "raw_class": top_label,
            "detected_plant": detected_plant,
            "confidence": top_confidence,
            "confidence_ratio": best_pred["probability"],
            "top_predictions": top_predictions,
            "detections": leaf_detections,
            "cropped_leaf_base64": cropped_leaf_b64,
            "crop_box": crop_box,
            "hotspots": hotspots,
            "metrics": {
                "chlorophyllCoverage": max(1, min(100, int(chlorophyll_coverage * 2))),
                "necroticLesionArea": min(100, int(necrotic_lesion_area * 3)),
                "chlorosisYellowing": min(100, int(chlorosis_yellowing * 3))
            },
            "modelProvider": "AgriSense Dual-Model AI (YOLOv8 Leaf Detector + MobileNetV2 PlantVillage Pathology)",
            "analyzedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        }

    except Exception as e:
        return {
            "success": False,
            "is_plant": False,
            "is_uncertain": True,
            "error": f"Pathology inference error: {str(e)}"
        }


# =============================================================
# AgriSense AI Animal Sound Recognition & Farm Repellent Engine
# =============================================================
from fastapi import Request

try:
    from backend.audio_service import audio_engine, CLASS_INFO, SPECIES_DETERRENT_MAP, DEFAULT_FARMER_RULES
except ImportError:
    from audio_service import audio_engine, CLASS_INFO, SPECIES_DETERRENT_MAP, DEFAULT_FARMER_RULES


class SpeciesConfigModel(BaseModel):
    species: str
    category: str


class RepellentConfigModel(BaseModel):
    enabled: Optional[bool] = None
    mode: Optional[str] = None
    confidence_threshold: Optional[float] = None
    cooldown_period_sec: Optional[int] = None
    persistence_required_samples: Optional[int] = None


class RepellentTriggerModel(BaseModel):
    species: Optional[str] = "wild_boar"


@app.get("/api/audio/status")
def get_audio_system_status():
    """Return live status of the AI audio classification engine and farm repellent guard."""
    now = time.time()
    cooldown_rem = max(0, int(audio_engine.cooldown_period_sec - (now - audio_engine.last_repellent_trigger_time)))
    return {
        "success": True,
        "is_model_ready": audio_engine.is_ready,
        "classes_count": len(audio_engine.classes),
        "supported_classes": audio_engine.classes,
        "system_enabled": audio_engine.system_enabled,
        "response_mode": audio_engine.response_mode,
        "confidence_threshold": audio_engine.confidence_threshold,
        "persistence_required_samples": audio_engine.persistence_required_samples,
        "cooldown_period_sec": audio_engine.cooldown_period_sec,
        "cooldown_remaining_sec": cooldown_rem,
        "in_cooldown": cooldown_rem > 0,
        "active_deterrent": audio_engine.active_deterrent,
        "recent_buffer_count": len(audio_engine.recent_detections_buffer),
        "total_events_logged": len(audio_engine.history_events)
    }


@app.get("/api/audio/species")
def get_species_profiles():
    """Return all recognized animal species, bio-acoustic profiles, and current farmer rules."""
    species_list = []
    for s_key in audio_engine.classes:
        info = CLASS_INFO.get(s_key, {})
        current_rule = audio_engine.farmer_rules.get(s_key, info.get("category", "ignore"))
        species_list.append({
            "key": s_key,
            "name": info.get("name", s_key.replace("_", " ").title()),
            "scientific_name": info.get("scientific_name", "Unknown"),
            "description": info.get("description", ""),
            "min_freq": info.get("min_freq", 100),
            "max_freq": info.get("max_freq", 5000),
            "default_category": info.get("category", "ignore"),
            "farmer_category": current_rule,
            "is_protected": current_rule == "beneficial",
            "deterrent": SPECIES_DETERRENT_MAP.get(s_key, None)
        })
    return {
        "success": True,
        "species": species_list,
        "farmer_rules": audio_engine.farmer_rules
    }


@app.post("/api/audio/species/configure")
def configure_species_rule(config: SpeciesConfigModel):
    """Allow farmer to categorize an animal as beneficial, harmful, or ignore."""
    if config.category not in ["beneficial", "harmful", "ignore"]:
        raise HTTPException(status_code=400, detail="Invalid category. Must be 'beneficial', 'harmful', or 'ignore'.")
    if config.species not in audio_engine.classes and config.species != "all":
        raise HTTPException(status_code=404, detail=f"Species '{config.species}' not found in supported classes.")

    audio_engine.farmer_rules[config.species] = config.category
    return {
        "success": True,
        "message": f"Updated category for '{config.species}' to '{config.category}'.",
        "farmer_rules": audio_engine.farmer_rules
    }


@app.post("/api/audio/classify")
async def classify_audio(
    request: Request,
    file: Optional[UploadFile] = File(None),
    audio_base64: Optional[str] = Form(None),
    sample_rate: Optional[int] = Form(16000),
    source_label: Optional[str] = Form("Live Farm Microphone")
):
    """
    Bio-Acoustic Audio Inference Endpoint.
    Accepts audio via multipart file upload, form data, or JSON payload.
    """
    raw_audio_bytes = None
    target_sr = sample_rate or 16000
    target_label = source_label or "Live Farm Microphone"

    # 1. Check if application/json body
    content_type = request.headers.get("content-type", "")
    if "application/json" in content_type:
        try:
            body = await request.json()
            if "audio_base64" in body and body["audio_base64"]:
                b64_data = body["audio_base64"]
                if "," in b64_data:
                    b64_data = b64_data.split(",", 1)[1]
                raw_audio_bytes = base64.b64decode(b64_data)
            if "sample_rate" in body:
                target_sr = int(body["sample_rate"])
            if "source_label" in body:
                target_label = str(body["source_label"])
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid JSON payload: {e}")

    # 2. Check if multipart file upload
    elif file is not None:
        raw_audio_bytes = await file.read()
        target_label = file.filename or target_label

    # 3. Check if form field
    elif audio_base64:
        b64_data = audio_base64
        if "," in b64_data:
            b64_data = b64_data.split(",", 1)[1]
        raw_audio_bytes = base64.b64decode(b64_data)

    if not raw_audio_bytes or len(raw_audio_bytes) == 0:
        raise HTTPException(status_code=400, detail="No audio data provided. Submit audio file or base64 stream.")

    try:
        # Decode audio waveform
        audio_array, detected_sr = audio_engine.decode_audio_bytes(raw_audio_bytes)
        # Classify and evaluate decision logic
        result = audio_engine.classify_audio(audio_array, sample_rate=detected_sr, source_label=target_label)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Audio classification error: {str(e)}")


@app.get("/api/repellent/status")
def get_repellent_status():
    """Return status of farm repellent response system, modes, and cooldowns."""
    now = time.time()
    cooldown_rem = max(0, int(audio_engine.cooldown_period_sec - (now - audio_engine.last_repellent_trigger_time)))
    return {
        "success": True,
        "enabled": audio_engine.system_enabled,
        "mode": audio_engine.response_mode,
        "confidence_threshold": audio_engine.confidence_threshold,
        "cooldown_period_sec": audio_engine.cooldown_period_sec,
        "cooldown_remaining_sec": cooldown_rem,
        "in_cooldown": cooldown_rem > 0,
        "persistence_required_samples": audio_engine.persistence_required_samples,
        "active_deterrent": audio_engine.active_deterrent
    }


@app.post("/api/repellent/configure")
def configure_repellent_system(config: RepellentConfigModel):
    """Configure repellent response mode, sensitivity threshold, and cooldown timer."""
    if config.enabled is not None:
        audio_engine.system_enabled = config.enabled
    if config.mode is not None:
        if config.mode not in ["monitoring", "alert", "audio_deterrent", "manual"]:
            raise HTTPException(status_code=400, detail="Mode must be 'monitoring', 'alert', 'audio_deterrent', or 'manual'.")
        audio_engine.response_mode = config.mode
    if config.confidence_threshold is not None:
        audio_engine.confidence_threshold = max(30.0, min(95.0, config.confidence_threshold))
    if config.cooldown_period_sec is not None:
        audio_engine.cooldown_period_sec = max(5, min(300, config.cooldown_period_sec))
    if config.persistence_required_samples is not None:
        audio_engine.persistence_required_samples = max(1, min(5, config.persistence_required_samples))

    return {
        "success": True,
        "message": "Repellent system configuration updated.",
        "settings": {
            "enabled": audio_engine.system_enabled,
            "mode": audio_engine.response_mode,
            "confidence_threshold": audio_engine.confidence_threshold,
            "cooldown_period_sec": audio_engine.cooldown_period_sec,
            "persistence_required_samples": audio_engine.persistence_required_samples
        }
    }


@app.post("/api/repellent/trigger")
def trigger_repellent_manually(payload: RepellentTriggerModel):
    """Manually activate safe deterrent or approve pending manual detection."""
    species = payload.species or "wild_boar"
    result = audio_engine.manual_trigger_repellent(species)
    return result


@app.post("/api/repellent/stop")
def stop_all_repellents_emergency():
    """Emergency Killswitch: Halts all audio deterrents instantly."""
    result = audio_engine.stop_all_repellents()
    return result


@app.get("/api/audio/history")
def get_detection_history(
    species: Optional[str] = None,
    category: Optional[str] = None,
    action: Optional[str] = None,
    limit: Optional[int] = 50
):
    """Retrieve filtered bio-acoustic event history log."""
    events = audio_engine.history_events
    if species:
        events = [e for e in events if e.get("predicted_class") == species]
    if category:
        events = [e for e in events if e.get("category") == category]
    if action:
        events = [e for e in events if e.get("action_taken") == action]

    return {
        "success": True,
        "count": len(events[:limit]),
        "total_available": len(audio_engine.history_events),
        "events": events[:limit]
    }


@app.post("/api/audio/history")
def record_detection_event(payload: Dict[str, Any] = Body(...)):
    """Record an audio detection event (live or simulated) into history."""
    result = audio_engine.record_event(payload)
    return result


@app.delete("/api/audio/history")
def clear_detection_history():
    """Clear historical audio detection records."""
    audio_engine.history_events.clear()
    return {"success": True, "message": "Detection history cleared."}


@app.get("/api/audio/hardware-spec")
def get_hardware_specification():
    """Returns complete ESP32 audio acquisition schematic, pinout, and firmware details."""
    return {
        "success": True,
        "architecture": {
            "title": "ESP32 Distributed Bio-Acoustic Acquisition & Edge Inference Architecture",
            "microcontroller": "ESP32-WROOM-32 / ESP32-S3 (Dual-Core 240MHz, 520KB SRAM, Wi-Fi 802.11 b/g/n)",
            "audio_sensor": "INMP441 Omnidirectional MEMS Microphone (I2S 24-bit, 61dB SNR, 60Hz-15kHz)",
            "alternative_analog_sensor": "MAX9814 Electret Mic with Automatic Gain Control (AGC)",
            "audio_output_dac_amp": "MAX98357A I2S 3.2W Mono Class D Audio Amplifier (Efficiency > 92%)",
            "speaker": "4-Ohm 3W Moisture-Resistant Outdoor Mylar Horn Speaker (SPL capped to 75dB)",
            "power_supply": "12V 10W Solar Panel + TP4056 / MPPT Lithium Battery Shield (18650 Cell)"
        },
        "i2s_pinouts": {
            "inmp441_microphone": {
                "SCK_BCLK": "GPIO 14 (Bit Clock)",
                "WS_LRCL": "GPIO 15 (Word Select / Left-Right Clock)",
                "SD_DOUT": "GPIO 32 (Serial Audio Data Output into ESP32)",
                "L_R_CHANNEL": "GND (Select Left Channel)",
                "VDD": "3.3V",
                "GND": "GND"
            },
            "max98357a_amplifier": {
                "BCLK": "GPIO 26 (Bit Clock)",
                "LRC": "GPIO 25 (Word Select)",
                "DIN": "GPIO 22 (Serial Audio Data Input from ESP32)",
                "GAIN": "GND (Configures safe 9dB fixed gain)",
                "SD_MODE": "100k pull-up to 3.3V (Stereo Mix to Mono)",
                "VIN": "5V DC (From Li-Ion Step-Up or Farm Rail)",
                "GND": "GND"
            }
        },
        "esp32_firmware_sample_code": """// AgriSense ESP32 Bio-Acoustic Acquisition & Repellent Node
#include <driver/i2s.h>
#include <WiFi.h>
#include <HTTPClient.h>

#define I2S_MIC_PORT I2S_NUM_0
#define I2S_MIC_SCK  14
#define I2S_MIC_WS   15
#define I2S_MIC_SD   32

#define I2S_SPK_PORT I2S_NUM_1
#define I2S_SPK_BCLK 26
#define I2S_SPK_LRC  25
#define I2S_SPK_DIN  22

const char* ssid = "AgriSense_Farm_AP";
const char* password = "FarmSmartPassword";
const char* serverUrl = "http://192.168.1.100:8000/api/audio/classify";

void setupI2SMic() {
  i2s_config_t i2s_config = {
    .mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_RX),
    .sample_rate = 16000,
    .bits_per_sample = I2S_BITS_PER_SAMPLE_16BIT,
    .channel_format = I2S_CHANNEL_FMT_ONLY_LEFT,
    .communication_format = I2S_COMM_FORMAT_STAND_I2S,
    .intr_alloc_flags = ESP_INTR_FLAG_LEVEL1,
    .dma_buf_count = 4,
    .dma_buf_len = 512,
    .use_apll = false
  };
  i2s_driver_install(I2S_MIC_PORT, &i2s_config, 0, NULL);
  i2s_pin_config_t pin_config = {
    .bck_io_num = I2S_MIC_SCK,
    .ws_io_num = I2S_MIC_WS,
    .data_out_num = I2S_PIN_NO_CHANGE,
    .data_in_num = I2S_MIC_SD
  };
  i2s_set_pin(I2S_MIC_PORT, &pin_config);
}

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  setupI2SMic();
  Serial.println("AgriSense ESP32 Audio Node Online.");
}

void loop() {
  size_t bytes_read = 0;
  int16_t sample_buffer[512];
  i2s_read(I2S_MIC_PORT, (void*)sample_buffer, sizeof(sample_buffer), &bytes_read, portMAX_DELAY);
  // Calculate RMS energy locally to detect audio activity
  float sum_sq = 0;
  for(int i = 0; i < bytes_read / 2; i++) {
    sum_sq += sample_buffer[i] * sample_buffer[i];
  }
  float rms = sqrt(sum_sq / (bytes_read / 2));
  if (rms > 800.0 && WiFi.status() == WL_CONNECTED) {
    // Transmit audio frame to AgriSense Edge backend
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/octet-stream");
    int httpResponseCode = http.POST((uint8_t*)sample_buffer, bytes_read);
    http.end();
  }
  delay(100);
}
"""
    }


# =============================================================
# ESP32 Hardware Integration & Telemetry Endpoints
# =============================================================
class HardwareModeModel(BaseModel):
    mode: str  # 'live' | 'simulated'

class BuzzerCommandModel(BaseModel):
    command: str  # 'ON' | 'OFF'
    duration_sec: Optional[float] = 3.0
    auth_token: Optional[str] = None
    source: Optional[str] = "web_manual"


@app.get("/api/telemetry/soil")
def get_soil_telemetry():
    """Returns real-time soil moisture telemetry for all 4 zones, connection status, and device diagnostics."""
    return {
        "success": True,
        "mode": hardware_manager.mode,
        "connection_status": hardware_manager.connection_status,
        "data": hardware_manager.last_soil_telemetry
    }


@app.post("/api/telemetry/soil")
def post_soil_telemetry(payload: Dict[str, Any] = Body(...)):
    """Ingests soil moisture telemetry sent directly from the ESP32 node via HTTP POST."""
    return hardware_manager.process_soil_telemetry(payload, source="http_post")


@app.get("/api/hardware/status")
def get_hardware_status():
    """Returns comprehensive ESP32 hardware status, MQTT broker health, and sensor diagnostics."""
    return hardware_manager.get_hardware_status()


@app.post("/api/hardware/mode")
def set_hardware_mode(payload: HardwareModeModel):
    """Explicitly switch between Live hardware data and Simulated virtual twin demo data."""
    try:
        return hardware_manager.set_mode(payload.mode)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/hardware/buzzer/command")
def issue_buzzer_command(payload: BuzzerCommandModel):
    """Dispatches validated buzzer command to physical Active Buzzer on GPIO 25."""
    result = hardware_manager.issue_buzzer_command(
        command=payload.command,
        duration_sec=payload.duration_sec or 3.0,
        auth_token=payload.auth_token,
        source=payload.source or "web_manual"
    )
    if not result.get("success"):
        raise HTTPException(status_code=400 if result.get("error") == "INVALID_COMMAND" else 403, detail=result.get("message"))
    return result


@app.get("/api/hardware/buzzer/status")
def get_buzzer_status():
    """Returns confirmed state of the physical buzzer, last ACK timestamp, and command history."""
    with hardware_manager.lock:
        return {
            "success": True,
            "state": hardware_manager.buzzer_state,
            "gpio": hardware_manager.buzzer_gpio,
            "type": hardware_manager.buzzer_type,
            "last_command_id": hardware_manager.last_buzzer_command_id,
            "last_ack_timestamp": hardware_manager.last_buzzer_ack_timestamp,
            "last_ack_latency_ms": hardware_manager.last_buzzer_ack_latency_ms,
            "is_pending_ack": hardware_manager.pending_buzzer_command is not None,
            "command_history": hardware_manager.buzzer_command_history[:10]
        }


@app.get("/api/hardware/audio/mic-status")
def get_inmp441_mic_status():
    """Returns live audio level, RMS, peak dB, and spectrum bands for INMP441 I2S microphone."""
    return hardware_manager.get_microphone_status()


@app.websocket("/ws/live-telemetry")
async def websocket_telemetry_endpoint(websocket: WebSocket):
    """Real-time bi-directional WebSocket connection streaming soil telemetry, buzzer ACKs, and audio levels."""
    await websocket.accept()
    hardware_manager.register_websocket(websocket)
    try:
        hardware_manager.broadcast_telemetry()
        while True:
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
                if msg.get("type") == "BUZZER_COMMAND":
                    hardware_manager.issue_buzzer_command(
                        command=msg.get("command", "OFF"),
                        duration_sec=msg.get("duration_sec", 3.0),
                        auth_token=msg.get("auth_token"),
                        source="websocket_client"
                    )
                elif msg.get("type") == "SET_MODE":
                    hardware_manager.set_mode(msg.get("mode", "live"))
            except Exception:
                pass
    except WebSocketDisconnect:
        hardware_manager.unregister_websocket(websocket)
    except Exception:
        hardware_manager.unregister_websocket(websocket)


from backend.assistant_service import get_assistant_status, process_assistant_chat


class AssistantChatModel(BaseModel):
    message: str
    conversation_history: Optional[List[Dict[str, str]]] = []
    language: Optional[str] = "en"
    farm_context: Optional[Dict[str, Any]] = None
    api_key_override: Optional[str] = None
    provider_override: Optional[str] = None
    force_error_test: Optional[str] = None


@app.get("/api/assistant/status")
def get_ai_assistant_status():
    """Returns LLM configuration status, active provider, and supported languages."""
    return get_assistant_status()


@app.post("/api/assistant/chat")
async def chat_with_assistant(payload: AssistantChatModel):
    """Processes farmer questions using Gemini/OpenAI or contextual agronomic engine."""
    result = await process_assistant_chat(
        message=payload.message,
        conversation_history=payload.conversation_history,
        language=payload.language or "en",
        farm_context=payload.farm_context,
        api_key_override=payload.api_key_override,
        provider_override=payload.provider_override,
        force_error_test=payload.force_error_test
    )
    return result


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.server:app", host="0.0.0.0", port=8000, reload=False)


