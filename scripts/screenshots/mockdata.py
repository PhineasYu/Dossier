import json
import re
from datetime import date, timedelta

LUCA = "11111111-1111-1111-1111-111111111111"
LUCY = "22222222-2222-2222-2222-222222222222"
today = date.today()


def d(days):
    return (today - timedelta(days=days)).isoformat()


children = [
    {"id": LUCA, "name": "Luca", "avatar_url": None, "theme_color": "#3267D4", "birthdate": "2020-04-11"},
    {"id": LUCY, "name": "Lucy", "avatar_url": None, "theme_color": "#B368EC", "birthdate": "2017-09-02"},
]

card_seed = [
    (LUCA, 0, "Built a whole garage for his diggers", "Cardboard box, two doors cut out, a sign that says GARIJ.", "interest", "child_moment"),
    (LUCA, 0, "We read the truck book three times", "He did the engine noises every page.", "other", "for_child"),
    (LUCA, 3, "Said hi to a new kid all by himself", "At the playground he walked straight up to a boy his age and said hi. Then looked back at me, proud.", "courage", None),
    (LUCA, 12, "First time eating mango", "He loved it, then his lips went a little puffy.", "first-time", None),
    (LUCA, 40, "Wants to be a garbage truck driver", "Because they get to hang off the back.", "dream", None),
    (LUCA, 96, "Slept without the hallway light", "He asked for it off himself.", "courage", None),
    (LUCA, 180, "Afraid of the vacuum cleaner", "Hid behind the sofa every time it came out.", "fear", None),
    (LUCY, 1, "Taught Luca to ride a bike", "She held the back of his seat the whole way down the street.", "friendship", None),
    (LUCY, 8, "Wants to be an astronaut this week", "Last week it was a vet. She drew the rocket herself.", "dream", None),
    (LUCY, 30, "Read a whole chapter out loud", "Stopped twice, kept going both times.", "first-time", None),
    (LUCY, 75, "Stood up for a friend at school", "Told me about it in the car, very matter-of-fact.", "courage", None),
    (LUCA, 400, "Called the moon a lamp for the night", "Pointed out of the car window all the way home.", "first-time", None),
    (LUCA, 700, "Hid behind my legs at the barber", "Then asked for the same haircut as Lucy.", "fear", None),
    (LUCA, 1100, "First word that wasn't mama: digger", "Said it to the actual digger outside the window.", "first-time", None),
    (LUCA, 1500, "Fell asleep on Lucy's lap", "Both of them, on the sofa, before dinner.", "friendship", None),
    (LUCY, 210, "Afraid of the dark water at the lake", "Would only go in up to her knees.", "fear", None),
    (LUCY, 400, "Learned to whistle", "Practised for three days straight.", "interest", None),
    (LUCY, 620, "Wanted to be a vet", "After the neighbour's cat had kittens.", "dream", None),
    (LUCY, 1000, "Held her baby brother for the first time", "She counted his fingers twice to be sure.", "first-time", None),
    (LUCY, 1500, "Drew our family as four suns", "Mine was the biggest. She said it was because I was the warmest.", "other", None),
]
cards = [
    {"id": f"c{i}", "child_id": c, "entry_id": None, "date": d(days), "title": t, "body": b,
     "category": cat, "question_origin": q, "created_at": d(days) + "T18:00:00Z"}
    for i, (c, days, t, b, cat, q) in enumerate(card_seed)
]

fact_seed = [
    (LUCA, "allergy", "Mango — mild lip swelling", 12), (LUCA, "medical", "Mild eczema, cream at night", 200),
    (LUCA, "height", "96", 400), (LUCA, "height", "101", 200), (LUCA, "height", "104", 20),
    (LUCA, "weight", "14.2", 400), (LUCA, "weight", "15.6", 200), (LUCA, "weight", "16.4", 20),
    (LUCA, "food_like", "Blueberries", 90), (LUCA, "food_dislike", "Broccoli", 90),
    (LUCA, "interest", "Diggers and trucks", 60), (LUCA, "friend", "Otto from nursery", 3),
    (LUCY, "allergy", "Penicillin (noted by doctor)", 500), (LUCY, "medical", "Wears glasses for reading", 300),
    (LUCY, "height", "104", 800), (LUCY, "height", "109", 400), (LUCY, "height", "112", 2),
    (LUCY, "weight", "17.1", 800), (LUCY, "weight", "19.0", 400), (LUCY, "weight", "20.3", 2),
    (LUCY, "food_like", "Pancakes with lingonberry", 120), (LUCY, "food_dislike", "Mushrooms", 120),
    (LUCY, "interest", "Space and rockets", 8), (LUCY, "friend", "Nour, best friend at school", 75),
    (LUCA, "wellbeing", "Nervous about starting swimming lessons", 5),
    (LUCA, "school", "Preschool: shares his toys much more now", 9),
    (LUCY, "wellbeing", "Sleeping badly before the school play", 4),
    (LUCY, "school", "Teacher: reads above her level, quiet in group work", 20),
]
facts = [
    {"id": f"f{i}", "child_id": c, "entry_id": None, "field": f, "value": v, "date": d(days),
     "created_at": d(days) + "T18:00:00Z"}
    for i, (c, f, v, days) in enumerate(fact_seed)
]
documents = [
    {"id": "doc1", "child_id": LUCA, "file_url": "https://example.invalid/checkup.png", "doc_type": "Health check-up",
     "extracted_json": {"Height": "104 cm", "Weight": "16.4 kg", "Vaccinations": "MMR dose 1", "Nurse": "BVC Hornstull"},
     "uploaded_at": d(20) + "T10:00:00Z"},
    {"id": "doc2", "child_id": LUCA, "file_url": "https://example.invalid/preschool.png", "doc_type": "Preschool note",
     "extracted_json": {"Teacher comment": "Loves the building corner"}, "uploaded_at": d(60) + "T10:00:00Z"},
]

TABLES = {"children": children, "cards": cards, "profile_facts": facts, "documents": documents}


def eq_filter(url, rows):
    for key, val in re.findall(r"[?&](\w+)=eq\.([^&]+)", url):
        rows = [r for r in rows if str(r.get(key)) == val]
    return rows


def handle(route):
    url = route.request.url
    m = re.search(r"/rest/v1/(\w+)", url)
    if not m:
        return route.fulfill(status=200, body="{}", content_type="application/json")
    rows = eq_filter(url, TABLES.get(m.group(1), []))
    if "order=date.desc" in url:
        rows = sorted(rows, key=lambda r: r.get("date", ""), reverse=True)
    accept = route.request.headers.get("accept", "")
    body = rows[0] if "vnd.pgrst.object" in accept and rows else rows
    route.fulfill(status=200, body=json.dumps(body), content_type="application/json")


