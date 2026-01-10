// 60 Career GPS V3.0 Questions
// Categories:
// 1. THE BUILDER (Q1-Q8) - Kỹ thuật, Công nghệ, Cơ khí
// 2. THE THINKER (Q9-Q16) - Tư duy, Nghiên cứu, Số liệu
// 3. THE CREATOR (Q17-Q24) - Nghệ thuật, Sáng tạo, Thẩm mỹ
// 4. THE HELPER (Q25-Q32) - Xã hội, Con người, Chăm sóc
// 5. THE LEADER (Q33-Q40) - Dẫn dắt, Kinh doanh, Quyền lực
// 6. THE ORGANIZER (Q41-Q48) - Quy trình, Chi tiết, Tổ chức
// 7. THE SPECIAL FILTER (Q49-Q60) - Giác quan & Môi trường

const CAREER_QUESTIONS = [
    // PHẦN 1: KỸ THUẬT - CÔNG NGHỆ - CƠ KHÍ (THE BUILDER)
    { id: 1, text: "Bạn có thích sửa chữa các thiết bị điện tử hỏng hóc như máy tính, điện thoại hay quạt không?", category: "🔧 THE BUILDER" },
    { id: 2, text: "Bạn có cảm thấy hứng thú khi lắp ráp các mô hình phức tạp như Lego Technic, Gundam hoặc đồ nội thất IKEA không?", category: "🔧 THE BUILDER" },
    { id: 3, text: "Bạn có muốn được vận hành các loại máy móc hạng nặng như xe tải, máy cẩu hay máy tiện CNC không?", category: "🔧 THE BUILDER" },
    { id: 4, text: "Bạn có thích viết code, lập trình phần mềm hoặc tự động hóa các quy trình trên máy tính không?", category: "🔧 THE BUILDER" },
    { id: 5, text: "Bạn có hay tò mò muốn tìm hiểu về cấu tạo bên trong của xe cộ và động cơ không?", category: "🔧 THE BUILDER" },
    { id: 6, text: "Bạn có thích làm việc với hệ thống mạng, server và bảo mật máy tính không?", category: "🔧 THE BUILDER" },
    { id: 7, text: "Bạn có khéo léo khi sử dụng các công cụ cơ khí như khoan, cưa, hàn hoặc đục không?", category: "🔧 THE BUILDER" },
    { id: 8, text: "Bạn có thường xuyên theo dõi và hứng thú với các công nghệ mới nhất như AI, Blockchain, VR/AR hay Smart Home không?", category: "🔧 THE BUILDER" },

    // PHẦN 2: TƯ DUY - NGHIÊN CỨU - SỐ LIỆU (THE THINKER)
    { id: 9, text: "Bạn có thích giải các bài toán đố mẹo, logic hoặc sudoku khó không?", category: "🧠 THE THINKER" },
    { id: 10, text: "Bạn có kiên nhẫn đọc các tài liệu nghiên cứu khoa học hoặc y học dài dòng, khô khan không?", category: "🧠 THE THINKER" },
    { id: 11, text: "Bạn có thích phân tích biểu đồ tài chính, chứng khoán và xu hướng thị trường không?", category: "🧠 THE THINKER" },
    { id: 12, text: "Bạn có cảm thấy hứng thú khi làm thí nghiệm hóa học hoặc sinh học như pha chế, quan sát kính hiển vi không?", category: "🧠 THE THINKER" },
    { id: 13, text: "Bạn có giỏi trong việc tìm nguyên nhân gốc rễ của một vấn đề, ví dụ như tại sao doanh số giảm hay tại sao máy bị lỗi không?", category: "🧠 THE THINKER" },
    { id: 14, text: "Bạn có thích làm việc với các con số thống kê, xác suất và Excel nâng cao không?", category: "🧠 THE THINKER" },
    { id: 15, text: "Bạn có đam mê tìm hiểu về thiên văn học, vũ trụ hoặc vật lý lượng tử không?", category: "🧠 THE THINKER" },
    { id: 16, text: "Bạn có thích nghiên cứu về lịch sử, khảo cổ và văn hóa các dân tộc không?", category: "🧠 THE THINKER" },

    // PHẦN 3: NGHỆ THUẬT - SÁNG TẠO - THẨM MỸ (THE CREATOR)
    { id: 17, text: "Bạn có thích vẽ tranh, phác thảo ý tưởng ra giấy hoặc thiết kế đồ họa không?", category: "🎨 THE CREATOR" },
    { id: 18, text: "Bạn có khả năng phối màu sắc tốt và thích trang trí nội thất hoặc thiết kế thời trang không?", category: "🎨 THE CREATOR" },
    { id: 19, text: "Bạn có thích viết truyện, làm thơ, viết kịch bản hoặc sáng tạo nội dung quảng cáo không?", category: "🎨 THE CREATOR" },
    { id: 20, text: "Bạn có thích chơi nhạc cụ, sáng tác nhạc hoặc mix nhạc không?", category: "🎨 THE CREATOR" },
    { id: 21, text: "Bạn có tự tin khi diễn xuất, đóng kịch hoặc biểu diễn trước ống kính máy quay không?", category: "🎨 THE CREATOR" },
    { id: 22, text: "Bạn có đam mê chụp ảnh nghệ thuật, quay phim và chỉnh sửa video không?", category: "🎨 THE CREATOR" },
    { id: 23, text: "Bạn có thích sáng tạo ra những món ăn mới và trang trí món ăn đẹp mắt không?", category: "🎨 THE CREATOR" },
    { id: 24, text: "Bạn có thường xuyên nghĩ ra những ý tưởng trừu tượng và thích phá vỡ các quy tắc truyền thống không?", category: "🎨 THE CREATOR" },

    // PHẦN 4: XÃ HỘI - CON NGƯỜI - CHĂM SÓC (THE HELPER)
    { id: 25, text: "Bạn có kiên nhẫn lắng nghe người khác than vãn hoặc tâm sự trong thời gian dài không?", category: "💚 THE HELPER" },
    { id: 26, text: "Bạn có thể chăm sóc vết thương, thay băng hoặc tiêm thuốc cho người bệnh được không?", category: "💚 THE HELPER" },
    { id: 27, text: "Bạn có thích dạy dỗ trẻ em, chơi đùa và chăm sóc trẻ nhỏ không?", category: "💚 THE HELPER" },
    { id: 28, text: "Bạn có khả năng giảng giải những kiến thức phức tạp thành dễ hiểu cho người khác không?", category: "💚 THE HELPER" },
    { id: 29, text: "Bạn có thể luôn mỉm cười phục vụ khách hàng dù họ có khó tính đến đâu không?", category: "💚 THE HELPER" },
    { id: 30, text: "Bạn có khả năng tư vấn tâm lý và hòa giải các cuộc cãi vã không?", category: "💚 THE HELPER" },
    { id: 31, text: "Bạn có thích tham gia các hoạt động từ thiện, công tác xã hội hoặc tổ chức phi chính phủ không?", category: "💚 THE HELPER" },
    { id: 32, text: "Bạn có sẵn sàng hỗ trợ người già hoặc người khuyết tật trong sinh hoạt hàng ngày không?", category: "💚 THE HELPER" },

    // PHẦN 5: DẪN DẮT - KINH DOANH - QUYỀN LỰC (THE LEADER)
    { id: 33, text: "Bạn có tự tin khi đứng trước đám đông để thuyết trình hoặc hùng biện không?", category: "👑 THE LEADER" },
    { id: 34, text: "Bạn có khả năng thuyết phục người khác mua một món hàng hoặc dịch vụ không?", category: "👑 THE LEADER" },
    { id: 35, text: "Bạn có giỏi đàm phán giá cả và hợp đồng để đạt được lợi ích tốt nhất không?", category: "👑 THE LEADER" },
    { id: 36, text: "Bạn có thể ra quyết định khó khăn như sa thải nhân sự hoặc cắt giảm ngân sách không?", category: "👑 THE LEADER" },
    { id: 37, text: "Bạn có sẵn sàng chịu trách nhiệm cho kết quả kinh doanh, dù lời hay lỗ không?", category: "👑 THE LEADER" },
    { id: 38, text: "Bạn có khả năng quản lý đội nhóm và phân chia công việc cho người khác hiệu quả không?", category: "👑 THE LEADER" },
    { id: 39, text: "Bạn có thích sự cạnh tranh gay gắt và luôn muốn đứng ở vị trí số 1 không?", category: "👑 THE LEADER" },
    { id: 40, text: "Bạn có ước mơ khởi nghiệp và tự xây dựng mô hình kinh doanh riêng của mình không?", category: "👑 THE LEADER" },

    // PHẦN 6: QUY TRÌNH - CHI TIẾT - TỔ CHỨC (THE ORGANIZER)
    { id: 41, text: "Bạn có thích sắp xếp hồ sơ và tài liệu theo thứ tự ngăn nắp, khoa học không?", category: "📋 THE ORGANIZER" },
    { id: 42, text: "Bạn có tỉ mỉ kiểm tra lỗi chính tả và lỗi định dạng văn bản từng chút một không?", category: "📋 THE ORGANIZER" },
    { id: 43, text: "Bạn có cảm thấy thoải mái khi làm việc theo một quy trình lặp đi lặp lại hàng ngày không?", category: "📋 THE ORGANIZER" },
    { id: 44, text: "Bạn có khả năng tính toán sổ sách kế toán, thuế và hóa đơn một cách chính xác tuyệt đối không?", category: "📋 THE ORGANIZER" },
    { id: 45, text: "Bạn có thích lập kế hoạch chi tiết và lịch trình cho các chuyến đi hoặc sự kiện không?", category: "📋 THE ORGANIZER" },
    { id: 46, text: "Bạn có nghiêm túc tuân thủ các quy định pháp luật và nội quy an toàn không?", category: "📋 THE ORGANIZER" },
    { id: 47, text: "Bạn có khả năng quản lý kho hàng và kiểm kê số lượng hàng hóa chính xác không?", category: "📋 THE ORGANIZER" },
    { id: 48, text: "Bạn có thể nhập liệu máy tính với tốc độ cao và độ chính xác cao không?", category: "📋 THE ORGANIZER" },

    // PHẦN 7: GIÁC QUAN & MÔI TRƯỜNG (THE SPECIAL FILTER)
    { id: 49, text: "Đôi tay của bạn có cực kỳ khéo léo và không run khi làm việc tinh xảo như xâu kim hay điêu khắc hạt gạo không?", category: "⭐ SPECIAL FILTER" },
    { id: 50, text: "Thị giác của bạn có tốt đến mức phân biệt được các sắc độ màu rất nhỏ như dân thiết kế hoặc in ấn không?", category: "⭐ SPECIAL FILTER" },
    { id: 51, text: "Thính giác của bạn có nhạy đến mức nghe được cao độ âm thanh chuẩn xác và phát hiện tiếng động lạ không?", category: "⭐ SPECIAL FILTER" },
    { id: 52, text: "Khứu giác và vị giác của bạn có cực thính, có thể ngửi ra mùi lạ hoặc nếm ra vị lạ dễ dàng không?", category: "⭐ SPECIAL FILTER" },
    { id: 53, text: "Thể lực của bạn có tốt đến mức có thể đứng hoặc đi lại liên tục 10 tiếng mỗi ngày không?", category: "⭐ SPECIAL FILTER" },
    { id: 54, text: "Bạn có thể làm việc mà không sợ máu, chất thải hoặc côn trùng không?", category: "⭐ SPECIAL FILTER" },
    { id: 55, text: "Bạn có thể làm việc một mình ở những nơi hoang vắng như biển, rừng hoặc phòng kín không?", category: "⭐ SPECIAL FILTER" },
    { id: 56, text: "Bạn có thích cảm giác mạnh và sẵn sàng làm các công việc mạo hiểm liên quan đến độ cao hoặc tốc độ không?", category: "⭐ SPECIAL FILTER" },
    { id: 57, text: "Bạn có tỉnh táo và làm việc hiệu quả nhất vào ban đêm không?", category: "⭐ SPECIAL FILTER" },
    { id: 58, text: "Bạn có thích đi công tác liên tục và không muốn ngồi một chỗ quá lâu không?", category: "⭐ SPECIAL FILTER" },
    { id: 59, text: "Bạn có đủ kiên nhẫn để ngồi gỡ rối một cuộn chỉ hoặc phân loại các hạt mè nhỏ không?", category: "⭐ SPECIAL FILTER" },
    { id: 60, text: "Bạn có khả năng bắt chước và học các ngôn ngữ nước ngoài mới rất nhanh không?", category: "⭐ SPECIAL FILTER" }
];

if (typeof module !== 'undefined' && module.exports) {
    module.exports = CAREER_QUESTIONS;
}
