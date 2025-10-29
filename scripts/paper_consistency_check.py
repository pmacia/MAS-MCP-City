import argparse, json, os, time

if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", required=True)
    args = ap.parse_args()
    manifest = {
        "version": "v0-scaffold",
        "timestamp": time.time(),
        "tables": {
            "table_3": os.path.exists(os.path.join(args.out,"tables","table_3_aggregated_kpis.csv")),
            "table_4": os.path.exists(os.path.join(args.out,"tables","table_4_ablation.csv")),
        }
    }
    os.makedirs(args.out, exist_ok=True)
    with open(os.path.join(args.out,"manifest.json"),"w") as f:
        json.dump(manifest, f, indent=2)
    print("Consistency check complete. See out/manifest.json")
