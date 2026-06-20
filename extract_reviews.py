import re
import json

def extract():
    try:
        with open("0 تقييم - افحص ها _ موقع حراج.html", "r", encoding="utf-8") as f:
            html = f.read()

        blocks = html.split('class="bg-background-card relative grid rounded-2xl p-4 shadow"')
        
        reviews = []
        for block in blocks[1:]:
            author_match = re.search(r'<span class="mt-1 text-sm">(.*?)</span>', block)
            date_match = re.search(r'<div class="text-em-4 mt-1 border-\[#a9bdd5\]">(.*?)</div>', block)
            body_match = re.search(r'<div class="text-em-2 m-0 max-w-full self-start overflow-hidden break-words px-1 py-4"[^>]*>(.*?)</div>', block)
            
            if author_match and date_match and body_match:
                author = author_match.group(1).strip()
                date = date_match.group(1).strip()
                body = body_match.group(1).strip()
                # clean up HTML from body just in case
                body = re.sub(r'<[^>]+>', '', body)
                
                reviews.append({
                    "name": author,
                    "date": date,
                    "text": body,
                    "rating": 5
                })

        print(f"Extracted {len(reviews)} reviews.")
        with open("extracted_reviews.json", "w", encoding="utf-8") as out:
            json.dump(reviews, out, ensure_ascii=False, indent=2)
            
        for r in reviews[:3]:
            print(f"Review: {r['name']} - {r['date']} - {r['text']}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    extract()
