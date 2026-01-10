# 📚 HƯỚNG DẪN TÍCH HỢP HỆ THỐNG CHẤM THI TỰ ĐỘNG (OMR)

## 📁 Mô tả dự án

Đây là hệ thống nhận diện và chấm điểm phiếu thi trắc nghiệm (OMR - Optical Mark Recognition) sử dụng YOLO cho việc phát hiện vùng và bong bóng đáp án.

**Thư mục chứa code**: `c:\Users\nguye\Desktop\ChamThiTuDong`

---

## 🔧 Cách sử dụng

### Option 1: Import trực tiếp vào Python/Flask/FastAPI

```python
import sys
sys.path.append(r"c:\Users\nguye\Desktop\ChamThiTuDong")
from main import grade_single_image

# Chấm 1 ảnh phiếu thi
result = grade_single_image("đường/dẫn/đến/ảnh.jpg")

# result là một dictionary chứa tất cả thông tin
print(result)
```

### Option 2: Chạy command line và đọc file JSON

```bash
cd c:\Users\nguye\Desktop\ChamThiTuDong
python main.py "đường/dẫn/ảnh.jpg"
```

Kết quả sẽ được lưu tại: `result_<tên_ảnh>.json`

### Option 3: Xử lý cả folder ảnh

```python
from main import OMR_YOLO_Ultimate

app = OMR_YOLO_Ultimate()
results = app.process_folder("./folder_chua_anh", output_json="ket_qua_tong_hop.json")
```

---

## 📋 CẤU TRÚC JSON OUTPUT

### Ví dụ JSON đầy đủ:

```json
{
  "file": "bai_thi_001.jpg",
  "sbd": "123456",
  "ma_de": "001",
  "phan_1": ["A", "B", "C", "D", "A", "B", "X", "AB", "C", "D"],
  "phan_2": ["Đ", "S", "Đ", "S", "X", "Đ", "S", "S"],
  "phan_3": ["1", "2", "3", "X", "0"],
  "raw_detections": {},
  "success": true,
  "debug_image": "KET_QUA_FINAL.jpg"
}
```

### Giải thích các trường:

| Trường | Kiểu dữ liệu | Mô tả |
|--------|--------------|-------|
| `file` | string | Tên file ảnh đã xử lý |
| `sbd` | string \| null | Số báo danh học sinh (6 chữ số) |
| `ma_de` | string \| null | Mã đề thi (3 chữ số) |
| `phan_1` | array[string] | Đáp án phần 1 - Trắc nghiệm ABCD |
| `phan_2` | array[string] | Đáp án phần 2 - Đúng/Sai |
| `phan_3` | array[string] | Đáp án phần 3 - Điền số (nếu có) |
| `success` | boolean | Có xử lý thành công không |
| `debug_image` | string | Đường dẫn ảnh kết quả debug |

---

## 🎨 QUY TẮC MÀU SẮC CHO HIỂN THỊ TRÊN WEB

### Các trạng thái đáp án:

| Giá trị trong JSON | Ý nghĩa | Màu hiển thị | Mã màu gợi ý |
|--------------------|---------|--------------|--------------|
| `"X"` | Không có đáp án (bỏ trống) | 🔘 **XÁM** | `#9CA3AF` hoặc `gray-400` |
| `"A"`, `"B"`, `"C"`, `"D"` | Chọn 1 đáp án duy nhất | Xem logic dưới | - |
| `"AB"`, `"AC"`, `"BC"`, etc. | Chọn 2+ đáp án (LỖI) | 🟡 **VÀNG** | `#F59E0B` hoặc `amber-500` |
| `"Đ"` hoặc `"S"` | Đúng/Sai (phần 2) | Xem logic dưới | - |

### Logic so sánh với đáp án đúng:

```javascript
// Pseudo-code cho việc so sánh
function getAnswerStatus(studentAnswer, correctAnswer) {
    // Trường hợp 1: Bỏ trống
    if (studentAnswer === "X") {
        return "BLANK";  // Màu XÁM
    }
    
    // Trường hợp 2: Chọn nhiều đáp án (độ dài > 1 cho phần 1)
    if (studentAnswer.length > 1 && !["Đ", "S"].includes(studentAnswer)) {
        return "ERROR";  // Màu VÀNG
    }
    
    // Trường hợp 3: So sánh với đáp án đúng
    if (studentAnswer === correctAnswer) {
        return "CORRECT";  // Màu XANH
    } else {
        return "WRONG";  // Màu ĐỎ
    }
}
```

### Bảng màu chi tiết:

| Trạng thái | CSS Class gợi ý | Background Color | Text Color | Border |
|------------|-----------------|------------------|------------|--------|
| **BLANK** (Bỏ trống) | `.answer-blank` | `#E5E7EB` | `#6B7280` | `#9CA3AF` |
| **ERROR** (2+ đáp án) | `.answer-error` | `#FEF3C7` | `#92400E` | `#F59E0B` |
| **CORRECT** (Đúng) | `.answer-correct` | `#D1FAE5` | `#065F46` | `#10B981` |
| **WRONG** (Sai) | `.answer-wrong` | `#FEE2E2` | `#991B1B` | `#EF4444` |

---

## 📊 VÍ DỤ HIỂN THỊ TRÊN WEB

### HTML/CSS mẫu:

```html
<style>
/* Ô đáp án cơ bản */
.answer-cell {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    border: 2px solid;
}

/* Bỏ trống - XÁM */
.answer-blank {
    background-color: #E5E7EB;
    color: #6B7280;
    border-color: #9CA3AF;
}

/* Lỗi 2 đáp án - VÀNG */
.answer-error {
    background-color: #FEF3C7;
    color: #92400E;
    border-color: #F59E0B;
}

/* Đúng - XANH */
.answer-correct {
    background-color: #D1FAE5;
    color: #065F46;
    border-color: #10B981;
}

/* Sai - ĐỎ */
.answer-wrong {
    background-color: #FEE2E2;
    color: #991B1B;
    border-color: #EF4444;
}
</style>

<!-- Ví dụ hiển thị 1 câu hỏi -->
<div class="question-row">
    <span class="question-number">Câu 1:</span>
    <div class="answer-options">
        <span class="answer-cell answer-blank">A</span>      <!-- Không chọn -->
        <span class="answer-cell answer-correct">B</span>    <!-- Đáp án đúng, HS chọn đúng -->
        <span class="answer-cell answer-blank">C</span>      <!-- Không chọn -->
        <span class="answer-cell answer-blank">D</span>      <!-- Không chọn -->
    </div>
</div>

<div class="question-row">
    <span class="question-number">Câu 2:</span>
    <div class="answer-options">
        <span class="answer-cell answer-wrong">A</span>      <!-- HS chọn sai -->
        <span class="answer-cell answer-blank">B</span>      <!-- Đáp án đúng nhưng HS không chọn -->
        <span class="answer-cell answer-blank">C</span>
        <span class="answer-cell answer-blank">D</span>
    </div>
</div>

<div class="question-row">
    <span class="question-number">Câu 3:</span>
    <div class="answer-options">
        <span class="answer-cell answer-error">A</span>      <!-- LỖI: HS chọn 2 đáp án -->
        <span class="answer-cell answer-error">B</span>      <!-- LỖI: HS chọn 2 đáp án -->
        <span class="answer-cell answer-blank">C</span>
        <span class="answer-cell answer-blank">D</span>
    </div>
</div>
```

---

## 🔄 LOGIC XỬ LÝ TRONG JAVASCRIPT

### Hàm render kết quả chấm bài:

```javascript
/**
 * So sánh đáp án học sinh với đáp án đúng và trả về trạng thái
 * @param {string} studentAns - Đáp án học sinh từ JSON (vd: "A", "X", "AB")
 * @param {string} correctAns - Đáp án đúng (vd: "A", "B", "C", "D")
 * @param {string} section - Phần thi: "phan_1", "phan_2", "phan_3"
 * @returns {object} { status: string, className: string }
 */
function evaluateAnswer(studentAns, correctAns, section = "phan_1") {
    // Bỏ trống
    if (studentAns === "X" || studentAns === null || studentAns === "") {
        return { 
            status: "BLANK", 
            className: "answer-blank",
            score: 0 
        };
    }
    
    // Phần 1: Trắc nghiệm ABCD
    if (section === "phan_1") {
        // Lỗi: Chọn nhiều đáp án
        if (studentAns.length > 1) {
            return { 
                status: "ERROR", 
                className: "answer-error",
                score: 0,
                errorOptions: studentAns.split("") // ["A", "B"] để tô vàng cả 2
            };
        }
        
        // So sánh đúng/sai
        if (studentAns === correctAns) {
            return { 
                status: "CORRECT", 
                className: "answer-correct",
                score: 1 
            };
        } else {
            return { 
                status: "WRONG", 
                className: "answer-wrong",
                score: 0 
            };
        }
    }
    
    // Phần 2: Đúng/Sai
    if (section === "phan_2") {
        if (studentAns === correctAns) {
            return { 
                status: "CORRECT", 
                className: "answer-correct",
                score: 1 
            };
        } else {
            return { 
                status: "WRONG", 
                className: "answer-wrong",
                score: 0 
            };
        }
    }
    
    // Phần 3: Điền số
    if (section === "phan_3") {
        if (studentAns === correctAns) {
            return { 
                status: "CORRECT", 
                className: "answer-correct",
                score: 1 
            };
        } else {
            return { 
                status: "WRONG", 
                className: "answer-wrong",
                score: 0 
            };
        }
    }
}

/**
 * Tính điểm tổng từ kết quả JSON
 * @param {object} result - JSON kết quả từ OMR
 * @param {object} answerKey - Đáp án đúng
 * @returns {object} { score: number, total: number, details: array }
 */
function calculateScore(result, answerKey) {
    let totalScore = 0;
    let totalQuestions = 0;
    let details = [];
    
    // Chấm phần 1
    if (result.phan_1 && answerKey.phan_1) {
        result.phan_1.forEach((ans, idx) => {
            const correct = answerKey.phan_1[idx];
            const evaluation = evaluateAnswer(ans, correct, "phan_1");
            totalScore += evaluation.score;
            totalQuestions++;
            details.push({
                question: idx + 1,
                section: "phan_1",
                studentAnswer: ans,
                correctAnswer: correct,
                ...evaluation
            });
        });
    }
    
    // Chấm phần 2
    if (result.phan_2 && answerKey.phan_2) {
        result.phan_2.forEach((ans, idx) => {
            const correct = answerKey.phan_2[idx];
            const evaluation = evaluateAnswer(ans, correct, "phan_2");
            totalScore += evaluation.score;
            totalQuestions++;
            details.push({
                question: idx + 1,
                section: "phan_2",
                studentAnswer: ans,
                correctAnswer: correct,
                ...evaluation
            });
        });
    }
    
    return {
        score: totalScore,
        total: totalQuestions,
        percentage: ((totalScore / totalQuestions) * 100).toFixed(2),
        details: details
    };
}
```

---

## 📝 FORMAT ĐÁP ÁN ĐÚNG (ANSWER KEY)

Để chấm bài, bạn cần có file đáp án đúng với cấu trúc tương tự:

```json
{
  "ma_de": "001",
  "phan_1": ["A", "B", "C", "D", "A", "B", "C", "D", "A", "B"],
  "phan_2": ["Đ", "S", "Đ", "S", "Đ", "S", "Đ", "S"],
  "phan_3": ["1", "2", "3", "4", "5"],
  "diem_moi_cau": {
    "phan_1": 0.25,
    "phan_2": 0.25,
    "phan_3": 0.5
  }
}
```

---

## 🚀 VÍ DỤ TÍCH HỢP VÀO EXPRESS.JS / NODE.JS

```javascript
const express = require('express');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();

// API endpoint chấm bài
app.post('/api/grade-omr', async (req, res) => {
    const imagePath = req.body.imagePath; // Đường dẫn ảnh
    
    // Gọi Python script
    const pythonProcess = spawn('python', [
        'c:\\Users\\nguye\\Desktop\\ChamThiTuDong\\main.py',
        imagePath
    ]);
    
    let output = '';
    
    pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
    });
    
    pythonProcess.on('close', (code) => {
        // Đọc file JSON kết quả
        const baseName = path.basename(imagePath, path.extname(imagePath));
        const jsonPath = `c:\\Users\\nguye\\Desktop\\ChamThiTuDong\\result_${baseName}.json`;
        
        if (fs.existsSync(jsonPath)) {
            const result = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
            res.json(result);
        } else {
            res.status(500).json({ error: 'Không thể xử lý ảnh' });
        }
    });
});
```

---

## 🎯 TÓM TẮT

1. **Gọi hàm `grade_single_image()`** để chấm 1 ảnh → nhận JSON
2. **JSON chứa**: `sbd`, `ma_de`, `phan_1`, `phan_2`, `phan_3`
3. **Giá trị đặc biệt**:
   - `"X"` = bỏ trống → **XÁM**
   - `"AB"`, `"AC"`... = lỗi 2 đáp án → **VÀNG** (cả 2 ô)
   - Đúng đáp án → **XANH**
   - Sai đáp án → **ĐỎ**

---

## 📞 Liên hệ

Nếu có vấn đề, kiểm tra:
- Model files: `best.pt`, `bubble.pt` phải có trong thư mục
- Ảnh đầu vào phải rõ, không bị mờ/nghiêng quá nhiều
- Python đã cài `ultralytics`, `opencv-python`, `numpy`
