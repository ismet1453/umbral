import cv2
import os
import sys

video = sys.argv[1]
outdir = sys.argv[2]

os.makedirs(outdir, exist_ok=True)
cap = cv2.VideoCapture(video)
if not cap.isOpened():
    raise SystemExit("could not open video")

frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
fps = cap.get(cv2.CAP_PROP_FPS)
duration = frames / fps if fps else 0
print(f"frames={frames} fps={fps:.2f} duration={duration:.2f}s")

seconds = [1, 4, 8, 12, 16, 20]
if duration and duration < 20:
    seconds = [duration * x for x in [0.05, 0.2, 0.4, 0.6, 0.8, 0.95]]

for i, sec in enumerate(seconds):
    frame_idx = min(frames - 1, max(0, int(sec * fps))) if fps else 0
    cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
    ok, frame = cap.read()
    if not ok:
        continue
    path = os.path.join(outdir, f"frame_{i}_{sec:.1f}s.png")
    cv2.imwrite(path, frame)
    print(path)

cap.release()
