import sys
import os
import cv2
import numpy as np
import json
from ultralytics import YOLO

class OMR_Robust_Engine:
    def __init__(self, model_dir=None):
        if model_dir is None:
            model_dir = os.path.dirname(os.path.abspath(__file__))
        self.block_model = YOLO(os.path.join(model_dir, 'best.pt'))
        self.bubble_model = YOLO(os.path.join(model_dir, 'bubble.pt'))
        print(">> OMR ROBUST ENGINE READY.")

    def get_brightness(self, roi, box):
        x1, y1, x2, y2 = box
        crop = roi[y1:y2, x1:x2]
        if crop.size == 0: return 255
        gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
        h, w = gray.shape
        center = gray[int(h*0.2):int(h*0.8), int(w*0.2):int(w*0.8)]
        return np.mean(center) if center.size > 0 else 255

    def process(self, img_path):
        img = cv2.imread(img_path)
        if img is None: return {"success": False}
        
        vis_img = img.copy()
        
        results = self.block_model(img, conf=0.2, verbose=False)[0]
        blocks = {"phan_1": [], "phan_2": [], "phan_3": [], "sbd": [], "ma_de": []}
        for b in results.boxes:
            label = self.block_model.names[int(b.cls[0])].lower()
            x1, y1, x2, y2 = map(int, b.xyxy[0])
            if "phan 1" in label or "phan1" in label: blocks["phan_1"].append((x1,y1,x2,y2))
            elif "phan 2" in label or "phan2" in label: blocks["phan_2"].append((x1,y1,x2,y2))
            elif "phan 3" in label or "phan3" in label: blocks["phan_3"].append((x1,y1,x2,y2))
            elif "sbd" in label: blocks["sbd"].append((x1,y1,x2,y2))
            elif "ma de" in label: blocks["ma_de"].append((x1,y1,x2,y2))

        blocks["phan_1"].sort(key=lambda x: x[0]) 

        res = {"success": True, "sbd": "", "ma_de": "", "phan_1": [], "phan_2": [], "phan_3": []}

        for bx1, by1, bx2, by2 in blocks["phan_1"]:
            roi = img[by1:by2, bx1:bx2]
            bubble_results = self.bubble_model(roi, conf=0.1, verbose=False)[0]
            bubbles = []
            for b in bubble_results.boxes:
                x1, y1, x2, y2 = map(int, b.xyxy[0])
                bubbles.append({'cx': (x1+x2)/2, 'cy': (y1+y2)/2, 'box': (x1,y1,x2,y2)})
            
            if not bubbles:
                for _ in range(10): res["phan_1"].append("X")
                continue

            # Sort by Y
            bubbles.sort(key=lambda b: b['cy'])
            rows = []
            curr = [bubbles[0]]
            for i in range(1, len(bubbles)):
                if abs(bubbles[i]['cy'] - bubbles[i-1]['cy']) < 15: curr.append(bubbles[i])
                else: curr.sort(key=lambda b: b['cx']); rows.append(curr); curr = [bubbles[i]]
            curr.sort(key=lambda b: b['cx']); rows.append(curr)
            
            for row in rows:
                if len(row) >= 1:
                    # Filter: if first bubble is too close to left edge of ROI, it's a number
                    ans_bubbles = row[1:] if row[0]['cx'] < (bx2-bx1)*0.2 else row
                    if not ans_bubbles:
                        res["phan_1"].append("X")
                        continue
                    
                    # Among candidates, find the darkest
                    brights = [self.get_brightness(roi, b['box']) for b in ans_bubbles]
                    min_b = min(brights)
                    avg_b = np.mean(brights)
                    
                    if (avg_b - min_b) > 12 and min_b < 190:
                        # Which column is it?
                        idx = brights.index(min_b)
                        # Estimate char based on X position relative to ROI width
                        rel_x = ans_bubbles[idx]['cx'] / (bx2-bx1)
                        if rel_x < 0.4: char = 'A'
                        elif rel_x < 0.6: char = 'B'
                        elif rel_x < 0.8: char = 'C'
                        else: char = 'D'
                        res["phan_1"].append(char)
                        cv2.circle(vis_img, (bx1 + int(ans_bubbles[idx]['cx']), by1 + int(ans_bubbles[idx]['cy'])), 8, (0, 255, 0), -1)
                    else:
                        res["phan_1"].append("X")

        cv2.imwrite("OMR_ROBUST_RESULT.jpg", vis_img)
        return res

if __name__ == '__main__':
    img_path = sys.argv[1]
    engine = OMR_Robust_Engine()
    result = engine.process(img_path)
    print(json.dumps(result, ensure_ascii=False))
