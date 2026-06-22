import pdfplumber
import re
import json

def exam_pdf_to_json(pdf_path, output_json_path):
    full_text = ""
    
    # PDF에서 텍스트 추출
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            extracted = page.extract_text()
            if extracted:
                full_text += extracted + "\n"
     
    full_text = full_text.replace('［', '[')
    full_text = full_text.replace('～', '~')
    full_text = full_text.replace('］', ']')

    set_splits = re.split(r'(\[\d+\s*~\s*\d+\])', full_text)

    exam_data = []
    idx = 0

    # 파일별로 변경
    difficulty = ['하', '중', '중', '중', '하', '중', '하', '중']
    genre = ['독서론','인문','경제','과학기술','현대소설',["현대시", "수필"],'고전소설','고전시가']
    title = ["SQ3R 읽기 전략", "인문", "정보 비대칭 시장 이론", "라플라스 식", "나룻배 이야기", "그 나무 / 나무 / 노인과 꽃", "홍길동전", "만전춘별사 / 시름을 꺼내 들어~ / 임으란 회양 금성 오리나무 되고~"]
    answer = ['1', '5', '4', '3', '2', '1', '2', '5', '4', '2','3', '5', '5', '5', '4', '3', '1', '1', '2', '1','3', '1', '3', '5', '4', '2', '2', '3', '3', '4','5', '5', '5', '4']

    for i in range(1, len(set_splits), 2):
        passage_content = set_splits[i+1] if i+1 < len(set_splits) else ""
        
        passage_parts = re.split(r'(?=\n\d+\.\s)', passage_content, maxsplit=1)
        passage_text = passage_parts[0].strip()
        questions_text = passage_parts[1] if len(passage_parts) > 1 else ""
        
        q_splits = re.split(r'\n(?=\d+\.\s)', "\n" + questions_text)
        q_splits = [q.strip() for q in q_splits if q.strip()]
        
        questions_list = []
        for q_text in q_splits:
            q_single_line = q_text.replace("\n", " ") 
            
            bogi_match = re.search(r'(<보 기>.*?(?=①))', q_single_line)
            bogi_text = bogi_match.group(1).strip() if bogi_match else None
            
            choices_match = re.search(r'(①.*)', q_single_line)
            choices = []
            if choices_match:
                choices_raw = choices_match.group(1)
                choices = re.findall(r'([①-⑤][^①-⑤]*)', choices_raw)
                choices = [c.strip()[2:] for c in choices]
            
            question_main = q_text
            if bogi_text:
                question_main = question_main[:question_main.find("<보 기>")].strip()
            elif choices:
                question_main = question_main[:question_main.find("①")].strip()
            
            score = 2
            if '[3점]' in question_main:
                score = 3
                question_main = question_main.replace(' [3점]', '')
            if '않은' in question_main:
                question_main = question_main.replace("않은", "<u>않은</u>")
            elif '않는' in question_main:
                question_main = question_main.replace("않는", "<u>않는</u>")

            questions_list.append({
                "question": question_main,
                "bogi": bogi_text,
                "choices": choices if choices else None,
                "score" : score,
                "answer": answer[int(question_main[0])-1]
            })
        
        exam_data.append({
            "id" : "2606"+'0'+str(idx+1),
            "type" : "독서" if idx < 4 else "문학",
            "genre" : genre[idx],
            "difficulty" : difficulty[idx],
            "title": title[idx],
            "paragraph": passage_text.replace("\n", " "),
            "questions": questions_list
        })
        idx += 1
        
    result_dict = {"exam_data": exam_data}
    
    with open(output_json_path, 'w', encoding='utf-8') as f:
        json.dump(result_dict, f, ensure_ascii=False, indent=2)
        
    print(f"변환 완료! '{output_json_path}' 파일을 확인하세요.")

if __name__ == "__main__":
    pdf_file = "C:\html_work\project\data\in2606.pdf"
    json_file = "C:\html_work\project\data\output.json"
    
    exam_pdf_to_json(pdf_file, json_file)