import json, argparse, os, glob

def load_ngsi(path):
    files = glob.glob(os.path.join(path, "*.jsonld"))
    print(f"[NGSI-LD] {len(files)} entities ready (validation stub).")
    for f in files[:3]:
        with open(f) as fh: json.load(fh)

def load_sta(path):
    ds = glob.glob(os.path.join(path, "datastream_*.json"))
    obs = glob.glob(os.path.join(path, "observations_*.json"))
    print(f"[STA] {len(ds)} datastreams, {len(obs)} observation files (validation stub).")
    for f in ds[:1]:
        with open(f) as fh: json.load(fh)

if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--ngsi", required=True)
    ap.add_argument("--sta", required=True)
    args = ap.parse_args()
    load_ngsi(args.ngsi)
    load_sta(args.sta)
    print("Fixtures loaded (local validation only).")
