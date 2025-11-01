import argparse, os
if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("path")
    args = ap.parse_args()
    print(f"[Replay] Would send traces from {args.path} to OTLP endpoint (stub).")
