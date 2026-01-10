import sys
import os

# Set encoding to UTF-8 for Windows Console
if sys.platform.startswith('win'):
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

import cv2
import numpy as np
import json
from ultralytics import YOLO

class OMR_YOLO_Ultimate:
    def __init__(self, model_dir=None):
        """
        Khởi tạo hệ thống OMR.
        
        Args:
            model_dir: Thư mục chứa model (mặc định là thư mục hiện tại)
        """
        print(">> ĐANG TẢI HỆ THỐNG (2-STAGE)...")
        
        if model_dir is None:
            model_dir = os.path.dirname(os.path.abspath(__file__))
        
        block_model_path = os.path.join(model_dir, 'best.pt')
        bubble_model_path = os.path.join(model_dir, 'bubble.pt')
        
        self.block_model = YOLO(block_model_path)    # Model tìm khung
        self.bubble_model = YOLO(bubble_model_path)  # Model tìm bong bóng

    def sort_bubbles(self, bubbles):
        if not bubbles: return []
        # Sort theo Y để chia dòng
        bubbles.sort(key=lambda b: b['cy'])
        rows = []
        current_row = [bubbles[0]]
        ROW_THRESH = 20 
        
        for i in range(1, len(bubbles)):
            bubble = bubbles[i]
            prev_bubble = bubbles[i-1]
            if abs(bubble['cy'] - prev_bubble['cy']) < ROW_THRESH:
                current_row.append(bubble)
            else:
                current_row.sort(key=lambda b: b['cx']) # Sort theo X
                rows.append(current_row)
                current_row = [bubble]
        
        if current_row:
            current_row.sort(key=lambda b: b['cx'])
            rows.append(current_row)
        return rows

    def _read_sbd_or_made(self, bubbles_data, num_digits=5):
        """
        Đọc SBD hoặc Mã đề từ các bong bóng.
        Mỗi cột là một chữ số (0-9), mỗi hàng là một vị trí digit.
        """
        sorted_rows = self.sort_bubbles(bubbles_data)
        result = ""
        
        for row in sorted_rows:
            digit_found = None
            for idx, b in enumerate(row):
                if b['filled'] and idx < 10:  # 0-9
                    digit_found = str(idx)
                    break
            result += digit_found if digit_found else "?"
        
        return result

    def process_block(self, img_path, save_debug_image=True, answer_key=None):
        """
        Xử lý ảnh phiếu thi và trích xuất đáp án.
        Visualize màu sắc dùng Overlay Blending (trong suốt).
        """
        print(f"\n📄 Đang xử lý: {img_path}")
        original_img = cv2.imread(img_path)
        
        if original_img is None:
            return {"error": f"Không thể đọc ảnh: {img_path}"}
        
        vis_img = original_img.copy() # Ảnh kết quả cuối cùng
        overlay = original_img.copy() # Layer để vẽ màu trong suốt
        
        # Kết quả trả về
        result = {
            "file": os.path.basename(img_path),
            "sbd": None,           # Số báo danh
            "ma_de": None,         # Mã đề thi
            "phan_1": [],          # Đáp án phần 1 (A/B/C/D)
            "phan_2": [],          # Đáp án phần 2 (Đ/S)
            "phan_3": [],          # Đáp án phần 3 (nếu có)
            "raw_detections": {},  # Lưu chi tiết detection
            "success": True
        }
        
        # 1. CẮT KHUNG VÀ GOM NHÓM
        results = self.block_model(original_img, conf=0.15)[0] 
        
        boxes_by_label = {
            "sbd": [], "ma_de": [], 
            "phan_1": [], "phan_2": [], "phan_3": []
        }
        
        for box in results.boxes:
            label = self.block_model.names[int(box.cls[0])].lower()
            if "goc" in label: continue 

            x1, y1, x2, y2 = map(int, box.xyxy[0])
            item = {'label': label, 'coords': (x1, y1, x2, y2)}
            
            print(f"   🔍 Soi: {label.upper()} at {x1},{y1}")
            cv2.rectangle(vis_img, (x1, y1), (x2, y2), (255, 0, 0), 2)
            
            if "phan 1" in label or "phan1" in label: boxes_by_label["phan_1"].append(item)
            elif "phan 2" in label or "phan2" in label: boxes_by_label["phan_2"].append(item)
            elif "phan 3" in label or "phan3" in label: boxes_by_label["phan_3"].append(item)
            elif "sbd" in label or "so bao danh" in label: boxes_by_label["sbd"].append(item)
            elif "ma de" in label or "made" in label: boxes_by_label["ma_de"].append(item)

        def get_bubbles_data(item):
            x1, y1, x2, y2 = item['coords']
            roi = original_img[y1:y2, x1:x2]
            
            bubble_results = self.bubble_model(roi, conf=0.25, iou=0.5, verbose=False)[0]
            
            data = []
            for b in bubble_results.boxes:
                cls_id = int(b.cls[0])
                label_name = self.bubble_model.names[cls_id]
                is_filled = (label_name == 'filled')
                
                bx1, by1, bx2, by2 = map(int, b.xyxy[0])
                cx, cy = (bx1+bx2)/2, (by1+by2)/2
                
                real_cx, real_cy = x1 + cx, y1 + cy
                data.append({'filled': is_filled, 'cx': cx, 'cy': cy, 'real_cx': real_cx, 'real_cy': real_cy})
            return data

        # === SBD ===
        for item in boxes_by_label['sbd']:
            bubbles_data = get_bubbles_data(item)
            sbd = self._read_sbd_or_made(bubbles_data, num_digits=6)
            result["sbd"] = sbd
            print(f"      📝 SBD: {sbd}")
            for b in bubbles_data:
                color = (0, 255, 255) if b['filled'] else (150, 150, 150)
                cv2.circle(overlay, (int(b['real_cx']), int(b['real_cy'])), 8, color, -1)

        # === MA DE ===
        for item in boxes_by_label['ma_de']:
            bubbles_data = get_bubbles_data(item)
            ma_de = self._read_sbd_or_made(bubbles_data, num_digits=3)
            result["ma_de"] = ma_de
            print(f"      📝 Mã đề: {ma_de}")
            for b in bubbles_data:
                color = (0, 255, 255) if b['filled'] else (150, 150, 150)
                cv2.circle(overlay, (int(b['real_cx']), int(b['real_cy'])), 8, color, -1)

        # === PHAN 1 ===
        boxes_by_label["phan_1"].sort(key=lambda i: i['coords'][0])
        global_q_idx = 1 
        map_char = ['A', 'B', 'C', 'D']
        block_ans_p1 = []
        
        for item in boxes_by_label['phan_1']:
            bubbles_data = get_bubbles_data(item)
            sorted_rows = self.sort_bubbles(bubbles_data)
            
            for row in sorted_rows:
                ans_chars = []
                for c_idx, b in enumerate(row):
                    if b['filled'] and c_idx < 4:
                        ans_chars.append(map_char[c_idx])
                
                student_ans = "".join(ans_chars) if ans_chars else "X"
                block_ans_p1.append(student_ans)
                
                expected_key = answer_key.get(str(global_q_idx)) if answer_key else None
                is_error = len(ans_chars) > 1
                
                for c_idx, b in enumerate(row):
                    if c_idx >= 4: continue
                    char = map_char[c_idx]
                    
                    # COLOR LOGIC FOR OVERLAY
                    color = (150, 150, 150) # Empty -> Light Gray Highlight
                    
                    if b['filled']:
                        if is_error:
                            color = (0, 255, 255) # Yellow
                        elif expected_key:
                            if char == expected_key: color = (0, 255, 0) # Green
                            else: color = (0, 0, 255) # Red
                        else:
                             color = (0, 255, 255) # Yellow (No Key)
                    
                    # Vẽ Filled lên Overlay
                    cv2.circle(overlay, (int(b['real_cx']), int(b['real_cy'])), 9, color, -1)

                global_q_idx += 1
        
        result["phan_1"] = block_ans_p1
        print(f"      👉 Phần 1 ({len(block_ans_p1)} câu): {block_ans_p1}")

        # === PHAN 2 ===
        boxes_by_label["phan_2"].sort(key=lambda i: i['coords'][0])
        block_ans_p2 = []
        for item in boxes_by_label['phan_2']:
            bubbles_data = get_bubbles_data(item)
            sorted_rows = self.sort_bubbles(bubbles_data)
            for row in sorted_rows:
                if len(row) >= 2:
                    if row[0]['filled']: block_ans_p2.append("Đ")
                    elif row[1]['filled']: block_ans_p2.append("S")
                    else: block_ans_p2.append("X")
                for b in row:
                    color = (0, 255, 255) if b['filled'] else (150, 150, 150)
                    cv2.circle(overlay, (int(b['real_cx']), int(b['real_cy'])), 9, color, -1) # size 9 for better fill

        result["phan_2"] = block_ans_p2
        print(f"      👉 Phần 2: {block_ans_p2}")

        # === PHAN 3 ===
        boxes_by_label["phan_3"].sort(key=lambda i: i['coords'][0])
        block_ans_p3 = []
        for item in boxes_by_label['phan_3']:
            bubbles_data = get_bubbles_data(item)
            sorted_rows = self.sort_bubbles(bubbles_data)
            for row in sorted_rows:
                filled_indices = []
                for c_idx, b in enumerate(row):
                    if b['filled']: filled_indices.append(str(c_idx))
                block_ans_p3.append("".join(filled_indices) if filled_indices else "X")
                for b in row:
                    color = (0, 255, 255) if b['filled'] else (150, 150, 150)
                    cv2.circle(overlay, (int(b['real_cx']), int(b['real_cy'])), 9, color, -1)

        result["phan_3"] = block_ans_p3
        print(f"      👉 Phần 3: {block_ans_p3}")


        # BLEND OVERLAY & SAVE
        if save_debug_image:
            out_name = "KET_QUA_FINAL.jpg"
            
            # Alpha Blend: result = overlay * 0.4 + vis_img * 0.6
            # vis_img chứa các box xanh đã vẽ
            cv2.addWeighted(overlay, 0.4, vis_img, 0.6, 0, vis_img)
            
            cv2.imwrite(out_name, vis_img)
            print(f"\n✅ Đã lưu ảnh debug tại: {out_name}")
            result["debug_image"] = out_name

        return result

    def export_json(self, img_path, output_path=None, save_debug_image=True, answer_key=None):
        """
        Xử lý ảnh và xuất kết quả ra file JSON.
        """
        result = self.process_block(img_path, save_debug_image, answer_key)
        
        if output_path is None:
            base_name = os.path.splitext(os.path.basename(img_path))[0]
            output_path = f"result_{base_name}.json"
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(result, f, ensure_ascii=False, indent=2)
        
        print(f"\n📁 Đã xuất JSON: {output_path}")
        return output_path

    def process_folder(self, folder_path, output_json="all_results.json"):
        all_results = []
        valid_extensions = ('.jpg', '.jpeg', '.png', '.bmp')
        
        for filename in os.listdir(folder_path):
            if filename.lower().endswith(valid_extensions):
                img_path = os.path.join(folder_path, filename)
                result = self.process_block(img_path, save_debug_image=False)
                all_results.append(result)
        
        with open(output_json, 'w', encoding='utf-8') as f:
            json.dump(all_results, f, ensure_ascii=False, indent=2)
        
        print(f"\n📁 Đã xuất {len(all_results)} kết quả vào: {output_json}")
        return all_results


# ============ HÀM TIỆN ÍCH ĐỂ IMPORT TỪ WEB APP ============

def grade_single_image(img_path, model_dir=None, answer_key=None):
    if model_dir is None:
        model_dir = os.path.dirname(os.path.abspath(__file__))
    
    app = OMR_YOLO_Ultimate(model_dir=model_dir)
    return app.process_block(img_path, save_debug_image=False, answer_key=answer_key)



if __name__ == '__main__':
    if len(sys.argv) > 1:
        img_path = sys.argv[1]
        answer_key = None
        if len(sys.argv) > 2:
            try:
                answer_key = json.loads(sys.argv[2])
            except:
                pass
        
        try:
            model_dir = os.path.dirname(os.path.abspath(__file__))
            app = OMR_YOLO_Ultimate(model_dir=model_dir)
            app.export_json(img_path, answer_key=answer_key, save_debug_image=False)
        except Exception as e:
            print(f'Error: {e}')

