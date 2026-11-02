#!/usr/bin/env python3
"""Собирает поисковый индекс + шарды с ценами и остатками по городам."""
import hashlib, json, os, time
from datetime import datetime, timezone
from pathlib import Path
import requests
from requests.auth import HTTPBasicAuth

ELCOM_BASE  = "https://online.el-com.ru/api/v1"
ELCOM_TOKEN = os.environ["ELCOM_TOKEN"]
RS_BASE     = "https://cdis.russvet.ru/rs"
RS_AUTH     = HTTPBasicAuth(os.environ["RS_USER"], os.environ["RS_PASSWORD"])

CITIES = ["Москва", "Санкт-Петербург", "Самара", "Екатеринбург",
          "Новосибирск", "Ростов-на-Дону", "Краснодар", "Тула", "Тверь"]

OUT     = Path(__file__).resolve().parent.parent / "docs" / "data"
SHARDS  = OUT / "shards"
OUT.mkdir(parents=True, exist_ok=True)
SHARDS.mkdir(exist_ok=True)

# ---------- утилиты ----------
def city(name: str) -> str | None:
    name = (name or "").strip()
    if name in CITIES: return name
    alias = {"Мск": "Москва", "СПб": "Санкт-Петербург", "СПБ": "Санкт-Петербург",
             "Питер": "Санкт-Петербург"}
    return alias.get(name)

def item_id(source: str, uid: str) -> str:
    return hashlib.sha1(f"{source}|{uid}".encode()).hexdigest()[:12]

def delay(s=0.2): time.sleep(s)

# ---------- ELCOM ----------
H = {"Authorization": f"Bearer {ELCOM_TOKEN}"}

def elcom_wh() -> dict[str, str]:
    r = requests.get(f"{ELCOM_BASE}/warehouses/groups/", headers=H, timeout=30)
    return {str(w["id"]): w["header"] for w in r.json()["data"]}

def elcom_all():
    wh = elcom_wh()
    scroll = None
    while True:
        params = {"hasStock": "true"}
        if scroll: params["scrollId"] = scroll
        r = requests.get(f"{ELCOM_BASE}/product/scroll", headers=H, params=params, timeout=60)
        d = r.json()["data"]
        for p in d.get("products", []):
            price = (p.get("commercePrice") or {}).get("price") or p.get("price")
            stocks = {}
            for wid, q in (p.get("balancesOnGroupsOfWarehouses") or {}).items():
                c = city(wh.get(str(wid), ""))
                if c and q and q > 0: stocks[c] = stocks.get(c, 0) + float(q)
            if not stocks and not price: continue           # пустышки пропускаем
            yield {
                "i": item_id("elcom", p["syncUid"]),
                "a": (p.get("articul") or "").strip(),
                "b": (p.get("manufacturerHeader") or "").strip(),
                "n": (p.get("header") or "").strip(),
                "p": float(price) if price else None,
                "s": stocks,
            }
        scroll = d.get("scrollId")
        if not scroll: break
        delay(0.15)

# ---------- RS ----------
def rs_wh() -> dict[str, str]:
    r = requests.get(f"{RS_BASE}/stocks", auth=RS_AUTH, timeout=30)
    return {str(w["ORGANIZATION_ID"]): w["NAME"] for w in r.json()["Stocks"]}

def rs_positions(wh_id: str):
    page = 1
    while True:
        r = requests.get(f"{RS_BASE}/position/{wh_id}/instock",
                         auth=RS_AUTH, params={"page": page, "rows": 1000}, timeout=60)
        d = r.json()
        for it in d.get("items", []): yield it
        last = d.get("meta", {}).get("last_page", page)
        if page >= last: break
        page += 1; delay(0.25)

def rs_residues(wh_id: str) -> dict[str, float]:
    res, page = {}, 1
    while True:
        r = requests.get(f"{RS_BASE}/residue/all/{wh_id}", auth=RS_AUTH,
                         params={"page": page, "rows": 200, "category": "all"},
                         timeout=60)
        for x in r.json().get("residues", []):
            q = float(x.get("RESIDUE") or 0)
            if q > 0: res[x["CODE"]] = res.get(x["CODE"], 0) + q
        pages = int(r.headers.get("x-pagination-page-count", page))
        if page >= pages: break
        page += 1; delay(0.25)
    return res

def rs_prices(codes: list[str]) -> dict[str, float]:
    out = {}
    for i in range(0, len(codes), 50):
        r = requests.post(f"{RS_BASE}/massprice", auth=RS_AUTH,
                          json={"items": codes[i:i+50]}, timeout=60)
        data = r.json()
        for it in (data if isinstance(data, list) else [data]):
            p = (it.get("Price") or {}).get("Personal_w_VAT")
            if it.get("RSCode") and p is not None:
                out[str(it["RSCode"])] = float(p)
        delay(0.25)
    return out

def rs_all():
    whs = {wid: wname for wid, wname in rs_wh().items() if city(wname)}
    meta, stocks = {}, {}
    for wid, wname in whs.items():
        c = city(wname)
        for p in rs_positions(wid):
            code = str(p["CODE"])
            meta.setdefault(code, {
                "a": (p.get("VENDOR_CODE") or "").strip(),
                "b": (p.get("BRAND") or "").strip(),
                "n": (p.get("NAME") or "").strip(),
            })
        for code, q in rs_residues(wid).items():
            if code in meta:
                stocks.setdefault(code, {})
                stocks[code][c] = stocks[code].get(c, 0) + q
    prices = rs_prices(list(meta.keys()))
    for code, m in meta.items():
        yield {
            "i": item_id("rs", code),
            "a": m["a"], "b": m["b"], "n": m["n"],
            "p": prices.get(code),
            "s": stocks.get(code, {}),
        }

# ---------- сборка ----------
def shard_key(id_: str) -> str: return id_[:2]

def main():
    shards: dict[str, dict] = {}
    search_rows = []
    seen = set()

    for src_fn, src in ((elcom_all, "elcom"), (rs_all, "rs")):
        count = 0
        for it in src_fn():
            if it["i"] in seen: continue
            seen.add(it["i"])
            # лёгкая часть — в поисковый индекс
            search_rows.append([it["i"], it["a"], it["b"], it["n"]])
            # полная часть — в шард
            sk = shard_key(it["i"])
            shards.setdefault(sk, {})[it["i"]] = {"p": it["p"], "s": it["s"], "src": src}
            count += 1
        print(f"{src}: {count}")

    # запись search.json (компактный формат)
    (OUT / "search.json").write_text(
        json.dumps({"fields": ["i", "a", "b", "n"], "rows": search_rows},
                   ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8")

    # запись шардов
    for f in SHARDS.glob("*.json"): f.unlink()
    for sk, items in shards.items():
        (SHARDS / f"{sk}.json").write_text(
            json.dumps(items, ensure_ascii=False, separators=(",", ":")),
            encoding="utf-8")

    (OUT / "meta.json").write_text(json.dumps({
        "updated": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "count": len(search_rows),
        "cities": CITIES,
    }, ensure_ascii=False), encoding="utf-8")
    print(f"Готово: {len(search_rows)} позиций, {len(shards)} шардов")

if __name__ == "__main__":
    main()
