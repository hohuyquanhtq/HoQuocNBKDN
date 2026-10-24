import { Document, Paragraph, TextRun, Packer, HeadingLevel, AlignmentType } from 'docx';

export async function generateSampleDocxBlob(): Promise<Blob> {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: 'BỘ GIÁO DỤC VÀ ĐÀO TẠO - EDUCHEM STUDIO',
            heading: HeadingLevel.HEADING_2,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            text: 'HƯỚNG DẪN MẪU NHẬP ĐỀ THI VÀ NGÂN HÀNG CÂU HỎI',
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'Lưu ý khi soạn thảo: ',
                bold: true,
                color: 'C00000',
              }),
              new TextRun({
                text: 'Hệ thống hỗ trợ nhận diện tự động 3 dạng câu hỏi chuẩn Bộ GD&ĐT (Trắc nghiệm 4 lựa chọn, Đúng/Sai 4 phát biểu, Trả lời ngắn). Có thể đặt đáp án ngay sau câu hỏi hoặc bảng đáp án ở cuối văn bản.',
                italics: true,
              }),
            ],
          }),
          new Paragraph({ text: '' }),

          // Phần 1
          new Paragraph({
            children: [
              new TextRun({
                text: 'PHẦN I: TRẮC NGHIỆM 4 LỰA CHỌN',
                bold: true,
                size: 26,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: '[BIẾT] ', bold: true, color: '0070C0' }),
              new TextRun({ text: 'Câu 1. Kim loại nào sau đây phản ứng với nước ở điều kiện thường?' }),
            ],
          }),
          new Paragraph({ text: 'A. Na' }),
          new Paragraph({ text: 'B. Fe' }),
          new Paragraph({ text: 'C. Cu' }),
          new Paragraph({ text: 'D. Ag' }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Đáp án: ', bold: true }),
              new TextRun({ text: 'A' }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Lời giải: ', bold: true, italics: true }),
              new TextRun({ text: 'Natri (Na) là kim loại kiềm có tính khử rất mạnh, phản ứng mãnh liệt với nước ở nhiệt độ thường tạo NaOH và khí H₂.', italics: true }),
            ],
          }),
          new Paragraph({ text: '' }),

          new Paragraph({
            children: [
              new TextRun({ text: '[HIỂU] ', bold: true, color: '0070C0' }),
              new TextRun({ text: 'Câu 2. Biểu thức hằng số cân bằng KC của phản ứng thuận nghịch: N₂(g) + 3H₂(g) ⇌ 2NH₃(g) là' }),
            ],
          }),
          new Paragraph({ text: 'A. KC = [NH₃]² / ([N₂] · [H₂]³)' }),
          new Paragraph({ text: 'B. KC = ([N₂] · [H₂]³) / [NH₃]²' }),
          new Paragraph({ text: 'C. KC = 2[NH₃] / ([N₂] + 3[H₂])' }),
          new Paragraph({ text: 'D. KC = [NH₃] / ([N₂] · [H₂])' }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Đáp án: ', bold: true }),
              new TextRun({ text: 'A' }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Lời giải: ', bold: true, italics: true }),
              new TextRun({ text: 'Theo định luật tác dụng khối lượng, hằng số cân bằng KC bằng tích nồng độ sản phẩm chia tích nồng độ chất tham gia với số mũ là hệ số tỉ lượng.', italics: true }),
            ],
          }),
          new Paragraph({ text: '' }),

          // Phần 2
          new Paragraph({
            children: [
              new TextRun({
                text: 'PHẦN II: ĐÚNG SAI',
                bold: true,
                size: 26,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: '[HIỂU – VẬN DỤNG] ', bold: true, color: '0070C0' }),
              new TextRun({ text: 'Câu 3. Xét các phát biểu sau về kim loại và tính chất hóa học:' }),
            ],
          }),
          new Paragraph({ text: 'a) Natri phản ứng với nước ở điều kiện thường giải phóng H₂.' }),
          new Paragraph({ text: 'b) Đồng phản ứng mạnh với nước lạnh.' }),
          new Paragraph({ text: 'c) Sắt có thể tác dụng với dung dịch HCl tạo muối FeCl₂ và H₂.' }),
          new Paragraph({ text: 'd) Bạc phản ứng với dung dịch HCl loãng giải phóng H₂.' }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Đáp án:', bold: true }),
            ],
          }),
          new Paragraph({ text: 'a) Đúng' }),
          new Paragraph({ text: 'b) Sai' }),
          new Paragraph({ text: 'c) Đúng' }),
          new Paragraph({ text: 'd) Sai' }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Lời giải: ', bold: true, italics: true }),
              new TextRun({ text: 'a) Đúng (Na + H₂O); b) Sai (Cu đứng sau H, không tan trong nước); c) Đúng (Fe + 2HCl → FeCl₂ + H₂); d) Sai (Ag đứng sau H, không phản ứng với HCl).', italics: true }),
            ],
          }),
          new Paragraph({ text: '' }),

          // Phần 3
          new Paragraph({
            children: [
              new TextRun({
                text: 'PHẦN III: TRẢ LỜI NGẮN',
                bold: true,
                size: 26,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: '[VẬN DỤNG] ', bold: true, color: '0070C0' }),
              new TextRun({ text: 'Câu 4. Cho phản ứng thuận nghịch: CO(g) + H₂O(g) ⇌ CO₂(g) + H₂(g). Ở nhiệt độ T, hằng số cân bằng KC = 4. Ban đầu nạp vào bình kín 1 mol CO và 1 mol H₂O. Khi phản ứng đạt trạng thái cân bằng ở nhiệt độ T, nồng độ phần trăm về thể tích của khí CO₂ trong hỗn hợp sau phản ứng là bao nhiêu phần trăm? (Làm tròn kết quả đến hàng đơn vị).' }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Đáp án: ', bold: true }),
              new TextRun({ text: '33' }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Lời giải: ', bold: true, italics: true }),
              new TextRun({ text: 'Gọi x là số mol CO phản ứng. Tại trạng thái cân bằng ta có x/(1-x) = 2 => x = 2/3 mol. %V(CO₂) = (2/3)/2 * 100% ≈ 33%.', italics: true }),
            ],
          }),
          new Paragraph({ text: '' }),
          new Paragraph({
            children: [
              new TextRun({ text: '[VẬN DỤNG] ', bold: true, color: '0070C0' }),
              new TextRun({ text: 'Câu 5. Tính số mol có trong 11,2 lít khí oxygen ở điều kiện quy định của đề (đkc với 22,4 L/mol).' }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Đáp án: ', bold: true }),
              new TextRun({ text: '0,5' }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Lời giải: ', bold: true, italics: true }),
              new TextRun({ text: 'Số mol n = V / 22,4 = 11,2 / 22,4 = 0,5 mol.', italics: true }),
            ],
          }),
        ],
      },
    ],
  });

  return await Packer.toBlob(doc);
}

export async function downloadSampleDocx(): Promise<void> {
  const blob = await generateSampleDocxBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'EduChem_Studio_Mau_Nhap_Cau_Hoi.docx';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
